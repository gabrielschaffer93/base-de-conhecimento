const PT_BR_MONTHS: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  março: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function parsePtBrDate(text: string): string | null {
  const match = text.trim().match(/^(\d{1,2})\s+de\s+([\wç]+)\s+de\s+(\d{4})$/i)
  if (!match) return null

  const day = Number.parseInt(match[1], 10)
  const month = PT_BR_MONTHS[match[2].toLowerCase()]
  const year = Number.parseInt(match[3], 10)

  if (month === undefined || Number.isNaN(day) || Number.isNaN(year)) return null

  return new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString()
}

export function extractSlugFromUrl(url: string): string {
  const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, '')
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? ''
}

export function rewriteInternalLinks(html: string): string {
  return html.replace(
    /href=(["'])(?:https?:\/\/ajuda\.vistasoft\.com\.br)?\/([^"'#?]+)\/?\1/gi,
    (_match, quote: string, path: string) => {
      const normalizedPath = path.replace(/\/$/, '')
      if (
        normalizedPath.startsWith('categoria') ||
        normalizedPath.startsWith('author') ||
        normalizedPath.startsWith('wp-') ||
        normalizedPath.startsWith('page/')
      ) {
        return `href=${quote}https://ajuda.vistasoft.com.br/${normalizedPath}/${quote}`
      }

      const slug = normalizedPath.split('/').pop() ?? normalizedPath
      return `href=${quote}/${slug}${quote}`
    },
  )
}

interface TipTapNode {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
}

export function extractPlainTextFromContent(content: Record<string, unknown>): string {
  const parts: string[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const tipTapNode = node as TipTapNode
    if (typeof tipTapNode.text === 'string') parts.push(tipTapNode.text)
    if (Array.isArray(tipTapNode.content)) tipTapNode.content.forEach(walk)
  }

  walk(content)
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function buildExcerptFromContent(content: Record<string, unknown>): string | null {
  const text = extractPlainTextFromContent(content)
  if (!text) return null
  return text.length <= 300 ? text : `${text.slice(0, 297).trim()}…`
}

export function findFirstImageUrl(content: Record<string, unknown>): string | null {
  let imageUrl: string | null = null

  function walk(node: unknown) {
    if (imageUrl || !node || typeof node !== 'object') return
    const tipTapNode = node as TipTapNode
    if (tipTapNode.type === 'image' && typeof tipTapNode.attrs?.src === 'string') {
      imageUrl = tipTapNode.attrs.src
      return
    }
    if (Array.isArray(tipTapNode.content)) tipTapNode.content.forEach(walk)
  }

  walk(content)
  return imageUrl
}

export function buildStoragePath(filename: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uuid = crypto.randomUUID()
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${year}/${month}/${uuid}-${safeName}`
}

export function guessMimeType(filename: string, fallback = 'image/jpeg'): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    default:
      return fallback
  }
}

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'LoftKnowledgeBaseImporter/1.0',
      Accept: 'text/html',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
