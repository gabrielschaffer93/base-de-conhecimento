interface TipTapNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  text?: string
  marks?: { type?: string; attrs?: Record<string, unknown> }[]
}

export type SearchContentType = 'articles' | 'videos' | 'tutorials'

export interface PostContentSignals {
  hasVideo: boolean
  hasTutorial: boolean
}

const VIDEO_EMBED_PATTERN =
  /youtube|youtu\.be|vimeo|wistia|\.mp4|player\.|embed\/|watch\?v=/i
const VIDEO_META_PATTERN = /(?:^|[\s_-])video(?:$|[\s_-])/i
const VIDEO_SLUG_PATTERN = /-video$|^video-/i
const TUTORIAL_STEP_ONE_PATTERN = /passo[\s._-]*0?1\b/i
const TUTORIAL_STEP_TWO_PATTERN = /passo[\s._-]*0?2\b/i
const TUTORIAL_META_PATTERN = /passo\s*a\s*passo|guia\s+passo/i

function walkTipTapNodes(node: unknown, visit: (node: TipTapNode) => void) {
  if (!node || typeof node !== 'object') return
  const tipTapNode = node as TipTapNode
  visit(tipTapNode)
  if (Array.isArray(tipTapNode.content)) {
    tipTapNode.content.forEach((child) => walkTipTapNodes(child, visit))
  }
}

export function extractContentSearchBlob(
  content: Record<string, unknown>,
  title: string,
  slug: string,
  excerpt?: string | null,
): string {
  const parts: string[] = [title, slug, excerpt ?? '']

  walkTipTapNodes(content, (node) => {
    if (typeof node.text === 'string') parts.push(node.text)
    if (node.type === 'image') {
      if (typeof node.attrs?.src === 'string') parts.push(node.attrs.src)
      if (typeof node.attrs?.alt === 'string') parts.push(node.attrs.alt)
    }
    if (node.type === 'videoEmbed') {
      if (typeof node.attrs?.src === 'string') parts.push(node.attrs.src)
      if (typeof node.attrs?.href === 'string') parts.push(node.attrs.href)
    }
    node.marks?.forEach((mark) => {
      if (typeof mark.attrs?.href === 'string') parts.push(mark.attrs.href)
    })
  })

  return parts.join(' ')
}

export function getPostContentSignals(
  content: Record<string, unknown>,
  title: string,
  slug: string,
  excerpt?: string | null,
): PostContentSignals {
  const blob = extractContentSearchBlob(content, title, slug, excerpt)
  const meta = `${title} ${slug} ${excerpt ?? ''}`

  const hasVideo =
    VIDEO_EMBED_PATTERN.test(blob) ||
    VIDEO_META_PATTERN.test(meta) ||
    VIDEO_SLUG_PATTERN.test(slug)

  const hasTutorial =
    TUTORIAL_STEP_ONE_PATTERN.test(blob) ||
    TUTORIAL_META_PATTERN.test(meta) ||
    (TUTORIAL_STEP_ONE_PATTERN.test(blob) && TUTORIAL_STEP_TWO_PATTERN.test(blob))

  return { hasVideo, hasTutorial }
}

export function matchesSearchContentType(
  signals: PostContentSignals,
  contentType: SearchContentType,
): boolean {
  if (contentType === 'videos') return signals.hasVideo
  if (contentType === 'tutorials') return signals.hasTutorial
  return !signals.hasVideo && !signals.hasTutorial
}

export function getSearchResultBadgeLabel(
  signals: PostContentSignals,
  categoryName?: string | null,
): string {
  if (signals.hasVideo) return 'Vídeo'
  if (signals.hasTutorial) return 'Tutorial'
  return categoryName ?? 'Artigo'
}

export function findPostImageUrl(
  content: Record<string, unknown>,
  featuredImageUrl?: string | null,
): string | null {
  if (featuredImageUrl) return featuredImageUrl

  let firstUrl: string | null = null

  function walk(node: unknown) {
    if (firstUrl || !node || typeof node !== 'object') return
    const tipTapNode = node as TipTapNode
    if (tipTapNode.type === 'image' && typeof tipTapNode.attrs?.src === 'string') {
      firstUrl = tipTapNode.attrs.src
      return
    }
    if (Array.isArray(tipTapNode.content)) tipTapNode.content.forEach(walk)
  }

  walk(content)
  return firstUrl
}

function extractPlainText(content: Record<string, unknown>): string {
  const chunks: string[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const tipTapNode = node as TipTapNode
    if (typeof tipTapNode.text === 'string') chunks.push(tipTapNode.text)
    if (Array.isArray(tipTapNode.content)) tipTapNode.content.forEach(walk)
  }

  walk(content)
  return chunks.join(' ')
}

export function estimateReadingTimeMinutes(
  content: Record<string, unknown>,
  excerpt?: string | null,
): number {
  const text = excerpt?.trim() || extractPlainText(content)
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
