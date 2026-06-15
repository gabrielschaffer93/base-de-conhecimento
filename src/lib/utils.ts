const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function formatShortDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

  const absSeconds = Math.abs(diffSeconds)
  if (absSeconds < 60) return rtf.format(diffSeconds, 'second')

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')

  const diffHours = Math.round(diffSeconds / 3600)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')

  const diffDays = Math.round(diffSeconds / 86400)
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day')

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month')

  return rtf.format(Math.round(diffDays / 365), 'year')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex <= 0 || dotIndex === filename.length - 1) return ''
  return filename.slice(dotIndex + 1).toLowerCase()
}

function formatCompactDecimal(value: number): string {
  if (value >= 100) return Math.round(value).toString()
  const fixed = value.toFixed(1)
  return fixed.endsWith('.0') ? Math.round(value).toString() : fixed.replace('.', ',')
}

export function formatDashboardNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'

  if (value >= 1_000_000) {
    return `${formatCompactDecimal(value / 1_000_000)}M`
  }

  if (value >= 10_000) {
    return `${formatCompactDecimal(value / 1_000)}k`
  }

  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}…`
}

interface TipTapNode {
  type?: string
  text?: string
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

export function getPostPreviewText(content: Record<string, unknown>, maxLength = 140): string {
  const text = extractPlainTextFromContent(content)
  return text ? truncate(text, maxLength) : ''
}

export function buildExcerptFromContent(content: Record<string, unknown>): string | null {
  const text = extractPlainTextFromContent(content)
  if (!text) return null
  return text.length <= 300 ? text : `${text.slice(0, 297).trim()}…`
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Visualizador',
  }
  return labels[role] ?? role
}

export function getShortDisplayName(fullName?: string | null, email?: string | null): string {
  const trimmed = fullName?.trim()
  if (!trimmed) return email?.split('@')[0] ?? 'Usuário'

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]

  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    published: 'Publicado',
    archived: 'Arquivado',
  }
  return labels[status] ?? status
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes('your-project'))
}
