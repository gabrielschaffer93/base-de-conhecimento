import { doc, heading, paragraph } from '@/components/editor/__fixtures__/editorDocHelpers'

export interface RoundTripDocFixture {
  id: string
  document: Record<string, unknown>
}

export const ROUND_TRIP_DOC_FIXTURES: RoundTripDocFixture[] = [
  { id: 'heading-h1', document: doc(heading(1, 'Título principal')) },
  { id: 'heading-h3', document: doc(heading(3, 'Subseção')) },
  { id: 'heading-h5', document: doc(heading(5, 'Nota')) },
  { id: 'heading-h6', document: doc(heading(6, 'Detalhe')) },
  {
    id: 'bold-italic-marks',
    document: doc(
      paragraph('destaque', [
        { type: 'bold' },
        { type: 'italic' },
      ]),
    ),
  },
  {
    id: 'underline-mark',
    document: doc(paragraph('sublinhado', [{ type: 'underline' }])),
  },
  {
    id: 'strike-mark',
    document: doc(paragraph('riscado', [{ type: 'strike' }])),
  },
  {
    id: 'code-mark',
    document: doc(paragraph('código', [{ type: 'code' }])),
  },
  {
    id: 'link-mark',
    document: doc(
      paragraph('site', [
        {
          type: 'link',
          attrs: {
            href: 'https://loft.com.br',
            target: '_blank',
            rel: 'noopener noreferrer',
            class: null,
            title: null,
          },
        },
      ]),
    ),
  },
  {
    id: 'text-align-right',
    document: doc(paragraph('Direita', undefined, 'right')),
  },
  {
    id: 'ordered-list-two-items',
    document: {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          attrs: { start: 1, type: null },
          content: [
            {
              type: 'listItem',
              content: [paragraph('Um')],
            },
            {
              type: 'listItem',
              content: [paragraph('Dois')],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'blockquote-paragraph',
    document: {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [paragraph('Citação')],
        },
      ],
    },
  },
  {
    id: 'code-block',
    document: {
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: null },
          content: [{ type: 'text', text: 'console.log("ok")' }],
        },
      ],
    },
  },
  {
    id: 'horizontal-rule',
    document: {
      type: 'doc',
      content: [{ type: 'horizontalRule' }, paragraph('Após regra')],
    },
  },
  {
    id: 'image-node',
    document: {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            src: 'https://cdn.example.com/image.png',
            alt: 'Ilustração',
            title: null,
            width: null,
            height: null,
          },
        },
      ],
    },
  },
  {
    id: 'video-embed-node',
    document: {
      type: 'doc',
      content: [
        {
          type: 'videoEmbed',
          attrs: {
            src: 'https://www.youtube.com/embed/abc123',
            href: 'https://www.youtube.com/watch?v=abc123',
            provider: 'youtube',
          },
        },
      ],
    },
  },
  {
    id: 'callout-warning',
    document: {
      type: 'doc',
      content: [
        {
          type: 'callout',
          attrs: { type: 'warning' },
          content: [paragraph('Atenção ao processo')],
        },
      ],
    },
  },
  {
    id: 'task-list',
    document: {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [paragraph('Tarefa pendente')],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'accordion-node',
    document: {
      type: 'doc',
      content: [
        {
          type: 'accordion',
          attrs: { title: 'FAQ', open: true },
          content: [paragraph('Resposta expansível')],
        },
      ],
    },
  },
]

export const HEADING_LEVEL_FIXTURES = [1, 2, 3, 4, 5, 6].map((level) => ({
  level,
  document: doc(heading(level, `Heading ${level}`)),
}))
