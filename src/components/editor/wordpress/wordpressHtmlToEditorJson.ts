import type { JSONContent } from '@tiptap/core'
import { editorHtmlToJson } from '@/components/editor/extensions/editorRoundTrip'
import { ensureDomEnvironment } from '@/components/editor/wordpress/ensureDomEnvironment'
import { transformWordPressImportHtml } from '@/components/editor/wordpress/transformWordPressImportHtml'

/** Convert WordPress article HTML to TipTap JSON using the shared Extension Kit. */
export function wordpressHtmlToEditorJson(html: string): JSONContent {
  ensureDomEnvironment()
  const processedHtml = transformWordPressImportHtml(html)
  return editorHtmlToJson(processedHtml)
}

/** Convenience alias for import scripts expecting Record<string, unknown>. */
export function wordpressHtmlToEditorContent(html: string): Record<string, unknown> {
  return wordpressHtmlToEditorJson(html) as Record<string, unknown>
}
