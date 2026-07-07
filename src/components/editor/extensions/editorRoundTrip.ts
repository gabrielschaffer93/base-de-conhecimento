import { generateHTML, generateJSON } from '@tiptap/html'
import type { Extensions, JSONContent } from '@tiptap/core'
import { createEditorExtensions } from '@/components/editor/extensions/EditorExtensionKit'

let cachedExtensions: Extensions | null = null

function getEditorExtensions(): Extensions {
  if (!cachedExtensions) {
    cachedExtensions = createEditorExtensions()
  }

  return cachedExtensions
}

/** Serialize TipTap JSON to HTML using the shared extension kit */
export function editorJsonToHtml(doc: JSONContent): string {
  return generateHTML(doc, getEditorExtensions())
}

/** Parse HTML into TipTap JSON using the shared extension kit */
export function editorHtmlToJson(html: string): JSONContent {
  return generateJSON(html, getEditorExtensions())
}

/** Round-trip JSON → HTML → JSON (structural equivalence for tests) */
export function roundTripEditorJson(doc: JSONContent): JSONContent {
  return editorHtmlToJson(editorJsonToHtml(doc))
}
