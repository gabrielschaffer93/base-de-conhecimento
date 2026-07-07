import { detectPasteSource } from '@/components/editor/paste/detectSource'
import { parseHtmlDocument, serializeDocumentBody } from '@/components/editor/paste/dom'
import { sanitizePasteDocument } from '@/components/editor/paste/sanitizeHtml'
import type { PasteSource } from '@/components/editor/paste/types'
import { transformGoogleDocsPaste } from '@/components/editor/paste/transformers/googleDocs'
import {
  normalizePasteHeadings,
  removeTemplateNoise,
  unwrapRedundantSpans,
} from '@/components/editor/paste/transformers/headings'
import { normalizePasteImageStructure } from '@/components/editor/paste/transformers/images'
import { normalizePasteLists } from '@/components/editor/paste/transformers/lists'
import { convertVideoEmbedsInDocument } from '@/components/editor/paste/transformers/videos'
import { transformWordPaste } from '@/components/editor/paste/transformers/word'
import { transformWordPressPaste } from '@/components/editor/paste/transformers/wordpress'

function applySourceTransformers(doc: Document, html: string, forceSource?: PasteSource): void {
  const source = forceSource ?? detectPasteSource(html)

  switch (source) {
    case 'google-docs':
      transformGoogleDocsPaste(doc)
      break
    case 'microsoft-word':
      transformWordPaste(doc)
      break
    case 'wordpress':
      transformWordPressPaste(doc)
      break
    default:
      break
  }
}

function applySharedTransformers(doc: Document): void {
  removeTemplateNoise(doc)
  unwrapRedundantSpans(doc)
  normalizePasteLists(doc)
  normalizePasteHeadings(doc)
  normalizePasteImageStructure(doc)
  convertVideoEmbedsInDocument(doc)
}

/** Synchronous HTML cleanup for TipTap transformPastedHTML. */
export function transformPastedHtmlSync(html: string): string {
  return transformHtmlSync(html)
}

/** Shared synchronous HTML transform pipeline used by paste and import. */
export function transformHtmlSync(html: string, forceSource?: PasteSource): string {
  const doc = parseHtmlDocument(html)
  sanitizePasteDocument(doc)
  applySourceTransformers(doc, html, forceSource)
  applySharedTransformers(doc)
  sanitizePasteDocument(doc)
  return serializeDocumentBody(doc)
}

export { applySharedTransformers, applySourceTransformers }
