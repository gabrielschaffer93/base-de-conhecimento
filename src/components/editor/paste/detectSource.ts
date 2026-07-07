import type { PasteSource } from '@/components/editor/paste/types'

const GOOGLE_DOCS_MARKERS = /docs-internal-guid|googleusercontent\.com/i
const WORD_MARKERS = /MsoNormal|xmlns:o=|urn:schemas-microsoft-com:office|<!--\[if gte mso/i
const WORDPRESS_MARKERS = /wp-block-|class="[^"]*wp-|<!--\s*wp:/i

export function detectPasteSource(html: string): PasteSource {
  if (GOOGLE_DOCS_MARKERS.test(html)) return 'google-docs'
  if (WORDPRESS_MARKERS.test(html)) return 'wordpress'
  if (WORD_MARKERS.test(html)) return 'microsoft-word'
  return 'generic'
}
