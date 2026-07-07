import { describe, expect, it } from 'vitest'
import {
  HEADING_LEVEL_FIXTURES,
  ROUND_TRIP_DOC_FIXTURES,
} from '@/components/editor/__fixtures__/roundTripDocs'
import { roundTripEditorJson } from '@/components/editor/extensions/editorRoundTrip'

function assertAccordionRoundTrip(
  result: Record<string, unknown>,
  expectedText: string,
): void {
  expect(result.type).toBe('doc')
  const accordion = (result.content as Array<Record<string, unknown>>)?.[0]
  expect(accordion?.type).toBe('accordion')
  expect(JSON.stringify(result)).toContain(expectedText)
}

describe.each(ROUND_TRIP_DOC_FIXTURES)('round-trip fixture: $id', ({ id, document }) => {
  it('preserves document structure through HTML serialization', () => {
    const result = roundTripEditorJson(document)

    if (id === 'accordion-node') {
      assertAccordionRoundTrip(result, 'Resposta expansível')
      return
    }

    expect(result).toEqual(document)
  })
})

describe.each(HEADING_LEVEL_FIXTURES)('heading level H$level', ({ level, document }) => {
  it('round-trips through HTML', () => {
    const result = roundTripEditorJson(document)

    expect(result.content?.[0]).toMatchObject({
      type: 'heading',
      attrs: { level },
    })
    expect(result).toEqual(document)
  })
})
