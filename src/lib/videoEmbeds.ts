export type VideoEmbedProvider = 'youtube' | 'vimeo' | 'html5'

export interface ParsedVideoEmbed {
  href: string
  embedSrc: string
  provider: VideoEmbedProvider
}

const VIDEO_URL_IN_TEXT_PATTERN =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+(?:&[^\s]*)?|youtu\.be\/[\w-]+|youtube\.com\/shorts\/[\w-]+|(?:player\.)?vimeo\.com\/(?:video\/)?\d+|[^\s"'<>]+\.mp4(?:\?[^\s"'<>]*)?)/i

function normalizeInputUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function parseYouTubeUrl(url: URL, href: string): ParsedVideoEmbed | null {
  if (url.hostname === 'youtu.be') {
    const videoId = url.pathname.slice(1).split('/')[0]
    if (!videoId) return null
    return {
      href,
      embedSrc: `https://www.youtube.com/embed/${videoId}`,
      provider: 'youtube',
    }
  }

  if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtube-nocookie.com')) {
    return null
  }

  let videoId = url.searchParams.get('v')

  if (!videoId && url.pathname.startsWith('/embed/')) {
    videoId = url.pathname.split('/embed/')[1]?.split('/')[0] ?? null
  }

  if (!videoId && url.pathname.startsWith('/shorts/')) {
    videoId = url.pathname.split('/shorts/')[1]?.split('/')[0] ?? null
  }

  if (!videoId) return null

  return {
    href,
    embedSrc: `https://www.youtube.com/embed/${videoId}`,
    provider: 'youtube',
  }
}

function parseVimeoUrl(url: URL, href: string): ParsedVideoEmbed | null {
  if (!url.hostname.includes('vimeo.com')) return null

  const match = url.pathname.match(/\/(\d+)/)
  if (!match?.[1]) return null

  return {
    href,
    embedSrc: `https://player.vimeo.com/video/${match[1]}`,
    provider: 'vimeo',
  }
}

function parseHtml5VideoUrl(url: URL, href: string): ParsedVideoEmbed | null {
  if (!/\.mp4(\?.*)?$/i.test(url.pathname)) return null

  return {
    href,
    embedSrc: href,
    provider: 'html5',
  }
}

export function parseVideoEmbedUrl(rawUrl: string): ParsedVideoEmbed | null {
  const href = normalizeInputUrl(rawUrl)
  if (!href) return null

  try {
    const url = new URL(href)
    return parseYouTubeUrl(url, href) ?? parseVimeoUrl(url, href) ?? parseHtml5VideoUrl(url, href)
  } catch {
    return null
  }
}

export function isVideoEmbedUrl(text: string): boolean {
  return parseVideoEmbedUrl(text) !== null
}

export function extractVideoUrlFromText(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (isVideoEmbedUrl(trimmed)) return trimmed

  const match = trimmed.match(VIDEO_URL_IN_TEXT_PATTERN)
  if (!match?.[0]) return null

  return isVideoEmbedUrl(match[0]) ? match[0] : null
}

interface TipTapContentNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TipTapContentNode[]
  text?: string
  marks?: { type?: string; attrs?: Record<string, unknown> }[]
}

function getTextNodeVideoSource(child: TipTapContentNode): string | null {
  if (child.type !== 'text' || typeof child.text !== 'string') return null

  const linkMark = child.marks?.find((mark) => mark.type === 'link')
  if (linkMark && typeof linkMark.attrs?.href === 'string') {
    const href = linkMark.attrs.href.trim()
    if (parseVideoEmbedUrl(href)) {
      return extractVideoUrlFromText(child.text) ?? href
    }
  }

  const trimmed = child.text.trim()
  if (parseVideoEmbedUrl(trimmed)) return trimmed

  return extractVideoUrlFromText(child.text)
}

type InlineVideoSplitResult =
  | { kind: 'none' }
  | { kind: 'embed-only'; source: string }
  | { kind: 'split'; source: string; before?: TipTapContentNode; after?: TipTapContentNode }

function splitInlineVideoText(child: TipTapContentNode): InlineVideoSplitResult {
  if (child.type !== 'text' || typeof child.text !== 'string') return { kind: 'none' }

  const linkMark = child.marks?.find((mark) => mark.type === 'link')
  if (linkMark && typeof linkMark.attrs?.href === 'string') {
    const href = linkMark.attrs.href.trim()
    if (parseVideoEmbedUrl(href)) {
      const source = extractVideoUrlFromText(child.text) ?? href
      if (child.text.trim() === source || child.text.trim() === href) {
        return { kind: 'embed-only', source }
      }

      const index = child.text.indexOf(source)
      if (index !== -1) return buildSplitAroundUrl(child, source, index)

      return { kind: 'embed-only', source: href }
    }
  }

  const trimmed = child.text.trim()
  if (parseVideoEmbedUrl(trimmed)) return { kind: 'embed-only', source: trimmed }

  const extracted = extractVideoUrlFromText(child.text)
  if (!extracted) return { kind: 'none' }
  if (trimmed === extracted) return { kind: 'embed-only', source: extracted }

  const index = child.text.indexOf(extracted)
  if (index === -1) return { kind: 'none' }

  return buildSplitAroundUrl(child, extracted, index)
}

function buildSplitAroundUrl(
  child: TipTapContentNode,
  source: string,
  index: number,
): InlineVideoSplitResult {
  const beforeText = child.text?.slice(0, index) ?? ''
  const afterText = child.text?.slice(index + source.length) ?? ''
  const marksWithoutLink = child.marks?.filter((mark) => mark.type !== 'link')

  return {
    kind: 'split',
    source,
    before: beforeText.trim()
      ? {
          type: 'text',
          text: beforeText,
          ...(marksWithoutLink?.length ? { marks: marksWithoutLink } : {}),
        }
      : undefined,
    after: afterText.trim()
      ? {
          type: 'text',
          text: afterText,
          ...(marksWithoutLink?.length ? { marks: marksWithoutLink } : {}),
        }
      : undefined,
  }
}

function toVideoEmbedNode(source: string): TipTapContentNode | null {
  const parsed = parseVideoEmbedUrl(source)
  if (!parsed) return null

  return {
    type: 'videoEmbed',
    attrs: {
      src: parsed.embedSrc,
      href: parsed.href,
      provider: parsed.provider,
    },
  }
}

function splitParagraphWithVideoLinks(node: TipTapContentNode): TipTapContentNode[] {
  if (node.type !== 'paragraph' || !Array.isArray(node.content) || node.content.length === 0) {
    return [node]
  }

  const result: TipTapContentNode[] = []
  let buffer: TipTapContentNode[] = []
  let hasVideoTransform = false

  const flush = () => {
    const meaningful = buffer.filter(
      (inlineNode) => !(inlineNode.type === 'text' && !(inlineNode.text ?? '').trim()),
    )
    if (meaningful.length > 0) {
      result.push({ type: 'paragraph', content: meaningful })
    }
    buffer = []
  }

  for (const child of node.content) {
    const inlineVideo = splitInlineVideoText(child)

    if (inlineVideo.kind === 'embed-only') {
      hasVideoTransform = true
      flush()
      const embed = toVideoEmbedNode(inlineVideo.source)
      if (embed) {
        result.push(embed)
        continue
      }
    }

    if (inlineVideo.kind === 'split') {
      hasVideoTransform = true
      if (inlineVideo.before) buffer.push(inlineVideo.before)
      flush()
      const embed = toVideoEmbedNode(inlineVideo.source)
      if (embed) result.push(embed)
      if (inlineVideo.after) buffer.push(inlineVideo.after)
      continue
    }

    const videoSource = getTextNodeVideoSource(child)
    if (videoSource) {
      hasVideoTransform = true
      flush()
      const embed = toVideoEmbedNode(videoSource)
      if (embed) {
        result.push(embed)
        continue
      }
    }

    buffer.push(child)
  }

  if (!hasVideoTransform) return [node]

  flush()
  return result.length > 0 ? result : [node]
}

function repairVideoEmbedNode(node: TipTapContentNode): TipTapContentNode {
  if (node.type !== 'videoEmbed') return node

  const href = typeof node.attrs?.href === 'string' ? node.attrs.href : ''
  const src = typeof node.attrs?.src === 'string' ? node.attrs.src : ''
  const parsed = parseVideoEmbedUrl(href) ?? parseVideoEmbedUrl(src)
  if (!parsed) return node

  const needsFix = !src || src.includes('watch?v=') || src === href
  if (!needsFix) return node

  return {
    ...node,
    attrs: {
      ...node.attrs,
      src: parsed.embedSrc,
      href: parsed.href,
      provider: parsed.provider,
    },
  }
}

function transformVideoLinksNode(node: TipTapContentNode): TipTapContentNode | TipTapContentNode[] {
  if (node.type === 'videoEmbed') {
    return repairVideoEmbedNode(node)
  }

  if (node.type === 'paragraph') {
    const split = splitParagraphWithVideoLinks(node)
    if (split.length === 1 && split[0] === node) return node

    return split.flatMap((item) => {
      const transformed = transformVideoLinksNode(item)
      return Array.isArray(transformed) ? transformed : [transformed]
    })
  }

  if (!Array.isArray(node.content)) return node

  return {
    ...node,
    content: node.content.flatMap((child) => {
      const transformed = transformVideoLinksNode(child)
      return Array.isArray(transformed) ? transformed : [transformed]
    }),
  }
}

export function transformVideoLinksInContent(content: Record<string, unknown>): Record<string, unknown> {
  if (!content || typeof content !== 'object') return content
  const transformed = transformVideoLinksNode(content as TipTapContentNode)
  if (Array.isArray(transformed)) {
    return { type: 'doc', content: transformed } as Record<string, unknown>
  }
  return transformed as Record<string, unknown>
}
