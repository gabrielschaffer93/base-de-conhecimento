import { transformHtmlSync } from '@/components/editor/paste/transformHtmlSync'
import { stripWordPressHtmlComments } from '@/components/editor/wordpress/stripWordPressHtmlComments'
import { detectPasteSource } from '@/components/editor/paste/detectSource'
import { transformGoogleDocsPaste } from '@/components/editor/paste/transformers/googleDocs'
import { parseHtmlDocument, serializeDocumentBody } from '@/components/editor/paste/dom'
import { sanitizePasteDocument } from '@/components/editor/paste/sanitizeHtml'
import { applySharedTransformers } from '@/components/editor/paste/transformHtmlSync'
import { transformWordPaste } from '@/components/editor/paste/transformers/word'
import { transformWordPressPaste } from '@/components/editor/paste/transformers/wordpress'

/**
 * WordPress import pipeline: always applies WP transforms, then optional
 * secondary source cleanup (Word/Google) before shared normalization.
 */
export function transformWordPressImportHtml(html: string): string {
  const withoutComments = stripWordPressHtmlComments(html)
  const doc = parseHtmlDocument(withoutComments)

  sanitizePasteDocument(doc)
  transformWordPressPaste(doc)

  const secondarySource = detectPasteSource(withoutComments)
  if (secondarySource === 'google-docs') transformGoogleDocsPaste(doc)
  if (secondarySource === 'microsoft-word') transformWordPaste(doc)

  applySharedTransformers(doc)
  sanitizePasteDocument(doc)

  return serializeDocumentBody(doc)
}

/** Paste path when source is already detected as WordPress. */
export function transformWordPressPastedHtml(html: string): string {
  return transformHtmlSync(html, 'wordpress')
}
