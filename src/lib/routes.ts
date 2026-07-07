export function getPostPublicPath(slug: string): string {
  return `/${slug}`
}

/** Rewrites legacy `/artigos/:slug` hrefs to `/:slug`. */
export function normalizePostPublicHref(href: string): string {
  const trimmed = href.trim()
  const relativeMatch = trimmed.match(/^\/artigos\/([^/?#]+)\/?([?#].*)?$/)
  if (relativeMatch) {
    return `/${relativeMatch[1]}${relativeMatch[2] ?? ''}`
  }

  try {
    const parsed = new URL(trimmed)
    const pathMatch = parsed.pathname.match(/^\/artigos\/([^/]+)\/?$/)
    if (pathMatch) {
      return `/${pathMatch[1]}${parsed.search}${parsed.hash}`
    }
  } catch {
    // Keep original href when it is not a valid absolute URL.
  }

  return href
}

type TipTapMark = { type: string; attrs?: Record<string, unknown> }
type TipTapNode = {
  type?: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  marks?: TipTapMark[]
  text?: string
}

function normalizeTipTapNode(node: unknown): unknown {
  if (!node || typeof node !== 'object') return node

  const tipTapNode = node as TipTapNode
  const normalized: TipTapNode = { ...tipTapNode }

  if (Array.isArray(tipTapNode.marks)) {
    normalized.marks = tipTapNode.marks.map((mark) => {
      if (mark.type !== 'link' || typeof mark.attrs?.href !== 'string') return mark
      return {
        ...mark,
        attrs: {
          ...mark.attrs,
          href: normalizePostPublicHref(mark.attrs.href),
        },
      }
    })
  }

  if (Array.isArray(tipTapNode.content)) {
    normalized.content = tipTapNode.content.map((child) => normalizeTipTapNode(child) as TipTapNode)
  }

  return normalized
}

/** Normalizes legacy article links stored in TipTap JSON content. */
export function normalizePostLinksInContent(content: Record<string, unknown>): Record<string, unknown> {
  return normalizeTipTapNode(content) as Record<string, unknown>
}
