import type { SupabaseClient } from '@supabase/supabase-js'

import { MEDIA_IMAGES_BUCKET } from './config.js'
import { buildStoragePath, guessMimeType } from './utils.js'

interface TipTapNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
}

export interface ImageMigrationResult {
  html: string
  migratedCount: number
  failedUrls: string[]
}

function resolveImageUrl(src: string, pageUrl: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('//')) return `https:${src}`
  return new URL(src, pageUrl).toString()
}

function extractImageSources(html: string, pageUrl: string): string[] {
  const sources = new Set<string>()
  const regex = /<img[^>]+src=(["'])(.*?)\1/gi

  for (const match of html.matchAll(regex)) {
    const resolved = resolveImageUrl(match[2], pageUrl)
    sources.add(resolved)
  }

  return [...sources]
}

function replaceImageUrl(html: string, fromUrl: string, toUrl: string): string {
  return html.split(fromUrl).join(toUrl)
}

async function uploadImage(
  supabase: SupabaseClient,
  sourceUrl: string,
): Promise<string | null> {
  const response = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'LoftKnowledgeBaseImporter/1.0' },
  })

  if (!response.ok) return null

  const buffer = Buffer.from(await response.arrayBuffer())
  const pathname = new URL(sourceUrl).pathname
  const filename = pathname.split('/').pop() ?? 'image.jpg'
  const mimeType = response.headers.get('content-type')?.split(';')[0] ?? guessMimeType(filename)
  const storagePath = buildStoragePath(filename)

  const { error } = await supabase.storage.from(MEDIA_IMAGES_BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    cacheControl: '3600',
    upsert: false,
  })

  if (error) return null

  const { data } = supabase.storage.from(MEDIA_IMAGES_BUCKET).getPublicUrl(storagePath)
  const publicUrl = data.publicUrl

  await supabase.from('media_assets').insert({
    filename: storagePath.split('/').pop() ?? filename,
    original_name: filename,
    mime_type: mimeType,
    size_bytes: buffer.byteLength,
    storage_path: storagePath,
    public_url: publicUrl,
    type: 'image',
    uploaded_by: null,
    alt_text: null,
  })

  return publicUrl
}

export async function migrateImagesInHtml(
  supabase: SupabaseClient,
  html: string,
  pageUrl: string,
  cache: Map<string, string>,
): Promise<ImageMigrationResult> {
  let migratedHtml = html
  const failedUrls: string[] = []
  let migratedCount = 0

  for (const sourceUrl of extractImageSources(html, pageUrl)) {
    const cached = cache.get(sourceUrl)
    if (cached) {
      migratedHtml = replaceImageUrl(migratedHtml, sourceUrl, cached)
      continue
    }

    try {
      const publicUrl = await uploadImage(supabase, sourceUrl)
      if (!publicUrl) {
        failedUrls.push(sourceUrl)
        continue
      }

      cache.set(sourceUrl, publicUrl)
      migratedHtml = replaceImageUrl(migratedHtml, sourceUrl, publicUrl)
      migratedCount += 1
    } catch {
      failedUrls.push(sourceUrl)
    }
  }

  return { html: migratedHtml, migratedCount, failedUrls }
}

export function migrateImagesInContent(
  content: Record<string, unknown>,
  cache: Map<string, string>,
): Record<string, unknown> {
  function walk(node: unknown): unknown {
    if (!node || typeof node !== 'object') return node
    const tipTapNode = node as TipTapNode

    if (tipTapNode.type === 'image' && typeof tipTapNode.attrs?.src === 'string') {
      const mapped = cache.get(tipTapNode.attrs.src)
      if (mapped) {
        return {
          ...tipTapNode,
          attrs: {
            ...tipTapNode.attrs,
            src: mapped,
          },
        }
      }
    }

    if (Array.isArray(tipTapNode.content)) {
      return {
        ...tipTapNode,
        content: tipTapNode.content.map(walk),
      }
    }

    return tipTapNode
  }

  return walk(content) as Record<string, unknown>
}
