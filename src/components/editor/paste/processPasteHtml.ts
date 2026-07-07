import { parseHtmlDocument, serializeDocumentBody } from '@/components/editor/paste/dom'
import { sanitizePasteDocument } from '@/components/editor/paste/sanitizeHtml'
import type { PasteImageUploadFn } from '@/components/editor/paste/types'
import {
  applySharedTransformers,
  applySourceTransformers,
} from '@/components/editor/paste/transformHtmlSync'
import {
  normalizePasteHeadings,
  removeTemplateNoise,
} from '@/components/editor/paste/transformers/headings'
import { processPasteImages } from '@/components/editor/paste/transformers/images'
import { normalizePasteLists } from '@/components/editor/paste/transformers/lists'
import { convertVideoEmbedsInDocument } from '@/components/editor/paste/transformers/videos'

export { transformPastedHtmlSync } from '@/components/editor/paste/transformHtmlSync'
export { transformHtmlSync } from '@/components/editor/paste/transformHtmlSync'

/** Full async paste pipeline: sanitize, transform, upload images. */
export async function processPasteHtml(
  html: string,
  clipboardData: DataTransfer,
  upload: PasteImageUploadFn,
): Promise<string> {
  const doc = parseHtmlDocument(html)

  sanitizePasteDocument(doc)
  applySourceTransformers(doc, html)
  applySharedTransformers(doc)

  await processPasteImages(doc, clipboardData, upload)

  convertVideoEmbedsInDocument(doc)
  normalizePasteLists(doc)
  normalizePasteHeadings(doc)
  removeTemplateNoise(doc)

  sanitizePasteDocument(doc)

  return serializeDocumentBody(doc)
}
