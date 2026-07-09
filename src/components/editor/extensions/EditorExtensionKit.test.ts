import { describe, expect, it } from 'vitest'
import { EMPTY_EDITOR_DOC } from '@/components/editor/constants'
import { createEditorExtensions } from '@/components/editor/extensions/EditorExtensionKit'
import { editorHtmlToJson, editorJsonToHtml, roundTripEditorJson } from '@/components/editor/extensions/editorRoundTrip'

describe('EditorExtensionKit', () => {
  it('exposes a consistent extension list for editor and viewer', () => {
    const editExtensions = createEditorExtensions({
      placeholder: 'Test…',
      enableKeyboardShortcuts: true,
    })
    const viewExtensions = createEditorExtensions()

    const editTypes = editExtensions.map((ext) => ext.name).sort()
    const viewTypes = viewExtensions
      .map((ext) => ext.name)
      .filter((name) => name !== 'placeholder')
      .sort()

    expect(editTypes).toContain('placeholder')
    expect(editTypes).toContain('editorKeyboardShortcuts')
    expect(viewTypes).not.toContain('placeholder')
    expect(viewTypes).not.toContain('editorKeyboardShortcuts')
    expect(viewTypes).toEqual(
      createEditorExtensions()
        .map((ext) => ext.name)
        .sort(),
    )
  })

  it('includes formatting extensions for headings, underline, alignment, and tasks', () => {
    const names = createEditorExtensions().map((ext) => ext.name)
    expect(names).toContain('starterKit')
    expect(names).toContain('textAlign')
    expect(names).toContain('taskList')
    expect(names).toContain('taskItem')
    expect(names).toContain('tableKit')
  })

  it('round-trips an empty document', () => {
    const result = roundTripEditorJson(EMPTY_EDITOR_DOC)
    expect(result).toEqual(EMPTY_EDITOR_DOC)
  })

  it('round-trips a document with headings, lists, and links', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, textAlign: null },
          content: [{ type: 'text', text: 'Título' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: null },
          content: [
            { type: 'text', text: 'Veja ' },
            {
              type: 'text',
              text: 'o link',
              marks: [{ type: 'link', attrs: { href: 'https://example.com', target: '_blank' } }],
            },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  attrs: { textAlign: null },
                  content: [{ type: 'text', text: 'Item um' }],
                },
              ],
            },
          ],
        },
      ],
    }

    const html = editorJsonToHtml(doc)
    expect(html).toContain('Título')
    expect(html).toContain('https://example.com')

    const parsed = editorHtmlToJson(html)
    expect(parsed.type).toBe('doc')
    expect(roundTripEditorJson(doc)).toEqual(parsed)
  })

  it('round-trips a callout block', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: { type: 'tip' },
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: null },
              content: [{ type: 'text', text: 'Dica importante' }],
            },
          ],
        },
      ],
    }

    expect(roundTripEditorJson(doc)).toEqual(doc)
  })

  it('round-trips underline and heading level 4', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 4, textAlign: null },
          content: [
            {
              type: 'text',
              text: 'Subtítulo',
              marks: [{ type: 'underline' }],
            },
          ],
        },
      ],
    }

    expect(roundTripEditorJson(doc)).toEqual(doc)
  })

  it('round-trips a task list', () => {
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
                  content: [{ type: 'text', text: 'Primeira tarefa' }],
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
                  content: [{ type: 'text', text: 'Concluída' }],
                },
              ],
            },
          ],
        },
      ],
    }

    expect(roundTripEditorJson(doc)).toEqual(doc)
  })

  it('round-trips a table with header row', () => {
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
                      content: [{ type: 'text', text: 'Nome' }],
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
                      content: [{ type: 'text', text: 'Item A' }],
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
                      content: [{ type: 'text', text: '100' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    expect(roundTripEditorJson(doc)).toEqual(doc)
  })
})
