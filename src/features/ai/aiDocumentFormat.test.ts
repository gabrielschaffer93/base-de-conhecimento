import { describe, expect, it } from 'vitest'
import { roundTripEditorJson } from '@/components/editor/extensions/editorRoundTrip'
import {
  isEmptyDoc,
  markdownToTiptap,
  tiptapToMarkdown,
} from '@/features/ai/aiDocumentFormat'

describe('aiDocumentFormat', () => {
  it('round-trips underline marks through markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [
            { type: 'text', text: 'destaque', marks: [{ type: 'underline' }] },
          ],
        },
      ],
    }

    const markdown = tiptapToMarkdown(doc)
    expect(markdown).toContain('<u>destaque</u>')

    const parsed = markdownToTiptap(markdown)
    const content = parsed.content as Array<Record<string, unknown>>
    expect(content[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'destaque', marks: [{ type: 'underline' }] }],
    })
  })

  it('round-trips task lists through markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [
                {
                  type: 'paragraph',
                  attrs: { textAlign: null },
                  content: [{ type: 'text', text: 'Pendente' }],
                },
              ],
            },
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  attrs: { textAlign: null },
                  content: [{ type: 'text', text: 'Feito' }],
                },
              ],
            },
          ],
        },
      ],
    }

    const markdown = tiptapToMarkdown(doc)
    expect(markdown).toContain('- [ ] Pendente')
    expect(markdown).toContain('- [x] Feito')

    const parsed = markdownToTiptap(markdown)
    expect(JSON.stringify(parsed)).toContain('taskList')
    expect(JSON.stringify(parsed)).toContain('Pendente')
    expect(JSON.stringify(parsed)).toContain('Feito')
  })

  it('round-trips tables through markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: { textAlign: null },
                      content: [{ type: 'text', text: 'Campo' }],
                    },
                  ],
                },
                {
                  type: 'tableHeader',
                  attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: { textAlign: null },
                      content: [{ type: 'text', text: 'Valor' }],
                    },
                  ],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: { textAlign: null },
                      content: [{ type: 'text', text: 'Nome' }],
                    },
                  ],
                },
                {
                  type: 'tableCell',
                  attrs: { colspan: 1, rowspan: 1, colwidth: null, align: null },
                  content: [
                    {
                      type: 'paragraph',
                      attrs: { textAlign: null },
                      content: [{ type: 'text', text: 'João' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const markdown = tiptapToMarkdown(doc)
    expect(markdown).toContain('| Campo | Valor |')
    expect(markdown).toContain('| Nome | João |')

    const parsed = markdownToTiptap(markdown)
    const content = parsed.content as Array<Record<string, unknown>>
    expect(content[0]?.type).toBe('table')
    expect(JSON.stringify(parsed)).toContain('Campo')
    expect(JSON.stringify(parsed)).toContain('João')
  })

  it('round-trips text alignment hints through markdown', () => {
    const markdown = '<!-- align:center -->\nTexto centralizado'
    const parsed = markdownToTiptap(markdown)

    const content = parsed.content as Array<Record<string, unknown>>
    expect(content[0]).toMatchObject({
      type: 'paragraph',
      attrs: { textAlign: 'center' },
    })

    const back = tiptapToMarkdown(parsed)
    expect(back).toContain('<!-- align:center -->')
    expect(back).toContain('Texto centralizado')
  })

  it('produces editor-compatible JSON for new block types', () => {
    const markdown = [
      '## Título',
      '',
      '- [ ] Revisar contrato',
      '',
      '| Etapa | Status |',
      '| --- | --- |',
      '| Assinatura | OK |',
    ].join('\n')

    const parsed = markdownToTiptap(markdown)
    const roundTripped = roundTripEditorJson(parsed)

    expect(roundTripped.type).toBe('doc')
    expect(JSON.stringify(roundTripped)).toContain('Revisar contrato')
    expect(JSON.stringify(roundTripped)).toContain('Assinatura')
  })

  it('detects empty documents', () => {
    expect(isEmptyDoc({ type: 'doc', content: [{ type: 'paragraph', attrs: { textAlign: null } }] })).toBe(
      true,
    )
    expect(
      isEmptyDoc({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { textAlign: null },
            content: [{ type: 'text', text: 'Conteúdo' }],
          },
        ],
      }),
    ).toBe(false)
  })
})
