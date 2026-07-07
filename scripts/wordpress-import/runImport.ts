import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

import { htmlToTiptapContent } from './htmlToTiptap.js'
import { migrateImagesInContent, migrateImagesInHtml } from './imageMigrator.js'
import { WORDPRESS_BASE_URL } from './config.js'
import { fetchListingPosts, scrapeArticle, type ListingPostRef } from './scraper.js'
import { importPost } from './supabaseImport.js'
import { buildExcerptFromContent, rewriteInternalLinks, sleep } from './utils.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..', '..')

loadEnv({ path: path.join(projectRoot, '.env') })

export interface ImportReportItem {
  slug: string
  title: string
  sourceUrl: string
  action: 'created' | 'updated'
  postId: string
  category: string | null
  tags: string[]
  imagesMigrated: number
  imageFailures: string[]
  adminUrl: string
  publicUrl: string
}

export interface ImportReport {
  startedAt: string
  finishedAt: string
  totalListed: number
  totalProcessed: number
  created: number
  updated: number
  failed: number
  notes: string[]
  items: ImportReportItem[]
  errors: Array<{ slug: string; message: string }>
}

export interface RunImportOptions {
  limit?: number
  slugs?: string[]
  reportOutputPath: string
  delayMs?: number
  /** Override WordPress origin (defaults to ajuda.vistasoft.com.br). */
  baseUrl?: string
}

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('your-project')) {
    throw new Error('Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
  }

  return createClient(url, key)
}

export async function assertImportPrerequisites(supabase: SupabaseClient) {
  const probeSlug = `import-probe-${Date.now()}`

  let result
  try {
    result = await supabase
      .from('categories')
      .insert({ name: 'Import Probe', slug: probeSlug, sort_order: 0 })
      .select('id')
      .single()
  } catch (error) {
    const cause =
      error instanceof Error && 'cause' in error && error.cause instanceof Error
        ? error.cause.message
        : null

    throw new Error(
      [
        'Could not reach Supabase.',
        cause ?? (error instanceof Error ? error.message : String(error)),
        'Check your network/VPN and VITE_SUPABASE_URL in .env, then retry.',
      ].join(' '),
    )
  }

  const { error } = result

  if (error) {
    const isPermissionError = error.code === '42501' || error.message.includes('permission denied')

    throw new Error(
      [
        'Database is not ready for WordPress import.',
        error.message,
        isPermissionError
          ? 'Run scripts/apply-import-prerequisites.sql in the Supabase SQL Editor, then retry.'
          : 'Check the Supabase project status and try again.',
      ].join(' '),
    )
  }

  await supabase.from('categories').delete().eq('slug', probeSlug)
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    const details = error as { message?: string; details?: string; hint?: string; code?: string }
    return [details.message, details.details, details.hint, details.code].filter(Boolean).join(' | ')
  }
  return String(error)
}

export async function runWordpressImport(options: RunImportOptions): Promise<ImportReport> {
  const startedAt = new Date().toISOString()
  const supabase = getSupabaseClient()
  await assertImportPrerequisites(supabase)
  const imageCache = new Map<string, string>()
  const delayMs = options.delayMs ?? 400

  const listingLabel = options.slugs?.length
    ? `${options.slugs.length} selected posts`
    : options.limit
      ? `first ${options.limit} posts`
      : 'all posts from WordPress listing'

  console.log(`Fetching ${listingLabel}...`)

  let listingPosts: ListingPostRef[]

  if (options.slugs?.length) {
    const baseUrl = options.baseUrl ?? WORDPRESS_BASE_URL
    listingPosts = options.slugs.map((slug) => ({
      url: `${baseUrl}/${slug}/`,
      slug,
      title: slug,
      categories: [],
      publishedAt: null,
    }))
  } else {
    listingPosts = await fetchListingPosts(options.limit)
  }

  if (listingPosts.length === 0) {
    throw new Error('No posts found in WordPress listing')
  }

  console.log(`Found ${listingPosts.length} posts to import.`)

  const report: ImportReport = {
    startedAt,
    finishedAt: '',
    totalListed: listingPosts.length,
    totalProcessed: 0,
    created: 0,
    updated: 0,
    failed: 0,
    notes: [
      'Posts imported without author (author_id = null). Update via SQL when ready.',
      'Posts imported without featured image (featured_image_url = null).',
      'First WordPress category becomes category; remaining categories become tags.',
      'Existing posts with the same slug are updated.',
    ],
    items: [],
    errors: [],
  }

  for (const [index, listingRef] of listingPosts.entries()) {
    const progress = `[${index + 1}/${listingPosts.length}]`
    console.log(`\n${progress} Importing: ${listingRef.title}`)

    try {
      const article = await scrapeArticle(listingRef.url)
      const categoryName = article.categories[0] ?? null
      const tagNames = article.categories.slice(1)

      const rewrittenHtml = rewriteInternalLinks(article.contentHtml)
      const imageResult = await migrateImagesInHtml(supabase, rewrittenHtml, article.url, imageCache)
      const tiptapContent = htmlToTiptapContent(imageResult.html)
      const contentWithImages = migrateImagesInContent(tiptapContent, imageCache)
      const excerpt = buildExcerptFromContent(contentWithImages)

      const importResult = await importPost(supabase, {
        title: article.title,
        slug: article.slug,
        excerpt,
        content: contentWithImages,
        categoryName,
        tagNames,
        publishedAt: article.publishedAt,
      })

      report.totalProcessed += 1
      if (importResult.action === 'created') report.created += 1
      else report.updated += 1

      report.items.push({
        slug: article.slug,
        title: article.title,
        sourceUrl: article.url,
        action: importResult.action,
        postId: importResult.postId,
        category: importResult.categoryName,
        tags: importResult.tagNames,
        imagesMigrated: imageResult.migratedCount,
        imageFailures: imageResult.failedUrls,
        adminUrl: `/admin/posts/${importResult.postId}/edit`,
        publicUrl: `/${article.slug}`,
      })

      console.log(`  ✓ ${importResult.action} (${imageResult.migratedCount} content images migrated)`)
      await sleep(delayMs)
    } catch (error) {
      report.failed += 1
      const message = formatError(error)
      report.errors.push({ slug: listingRef.slug, message })
      console.error(`  ✗ ${message}`)
    }
  }

  report.finishedAt = new Date().toISOString()

  const outputPath = path.join(projectRoot, options.reportOutputPath)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  return report
}
