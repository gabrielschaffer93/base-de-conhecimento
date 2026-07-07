import { describe, expect, it } from 'vitest'
import { XSS_HTML_FIXTURES } from '@/components/editor/__fixtures__/xssHtmlFixtures'
import { editorHtmlToJson } from '@/components/editor/extensions/editorRoundTrip'
import { transformPastedHtmlSync } from '@/components/editor/paste/processPasteHtml'
import { parseHtmlDocument, serializeDocumentBody } from '@/components/editor/paste/dom'
import { sanitizePasteDocument } from '@/components/editor/paste/sanitizeHtml'

describe.each(XSS_HTML_FIXTURES)('XSS fixture: $id', (fixture) => {
  it('removes dangerous markup during sync paste transform', () => {
    const result = transformPastedHtmlSync(fixture.html)

    for (const forbidden of fixture.forbidden) {
      expect(result).not.toContain(forbidden)
    }
  })

  it('removes dangerous markup during document sanitization', () => {
    const doc = parseHtmlDocument(fixture.html)
    sanitizePasteDocument(doc)
    const result = serializeDocumentBody(doc)

    for (const forbidden of fixture.forbidden) {
      expect(result).not.toContain(forbidden)
    }
  })

  it('does not persist XSS vectors in editor JSON', () => {
    const processed = transformPastedHtmlSync(fixture.html)
    const serialized = JSON.stringify(editorHtmlToJson(processed))

    for (const forbidden of fixture.forbidden) {
      expect(serialized).not.toContain(forbidden)
    }
  })
})
