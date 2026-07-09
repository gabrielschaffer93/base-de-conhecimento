import { describe, expect, it } from 'vitest'
import { PASTE_HTML_FIXTURES } from '@/components/editor/__fixtures__/pasteHtmlFixtures'
import { editorHtmlToJson } from '@/components/editor/extensions/editorRoundTrip'
import { transformPastedHtmlSync } from '@/components/editor/paste/processPasteHtml'

describe.each(PASTE_HTML_FIXTURES)('paste fixture: $id', (fixture) => {
  it('produces sanitized HTML', () => {
    const result = transformPastedHtmlSync(fixture.html)

    for (const snippet of fixture.contains ?? []) {
      expect(result).toContain(snippet)
    }

    for (const snippet of fixture.notContains ?? []) {
      expect(result).not.toContain(snippet)
    }
  })

  it('parses into valid editor JSON', () => {
    const processed = transformPastedHtmlSync(fixture.html)
    const json = editorHtmlToJson(processed)
    const serialized = JSON.stringify(json)

    expect(json.type).toBe('doc')

    for (const snippet of fixture.jsonIncludes ?? []) {
      expect(serialized).toContain(snippet)
    }

    if (fixture.rootNodeType) {
      expect(json.content?.[0]?.type).toBe(fixture.rootNodeType)
    }
  })
})
