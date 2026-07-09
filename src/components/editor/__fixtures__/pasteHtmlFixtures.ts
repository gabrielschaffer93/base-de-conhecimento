export interface PasteHtmlFixture {
  id: string
  html: string
  contains?: string[]
  notContains?: string[]
  jsonIncludes?: string[]
  rootNodeType?: string
}

export const PASTE_HTML_FIXTURES: PasteHtmlFixture[] = [
  {
    id: 'plain-paragraph',
    html: '<p>Texto simples</p>',
    contains: ['Texto simples'],
    jsonIncludes: ['Texto simples'],
  },
  {
    id: 'bold-italic',
    html: '<p><strong>Negrito</strong> e <em>itálico</em></p>',
    jsonIncludes: ['Negrito', 'itálico'],
  },
  {
    id: 'underline-strike',
    html: '<p><u>Sublinhado</u> e <s>riscado</s></p>',
    jsonIncludes: ['Sublinhado', 'riscado'],
  },
  {
    id: 'ordered-list',
    html: '<ol><li>Primeiro</li><li>Segundo</li></ol>',
    rootNodeType: 'orderedList',
    jsonIncludes: ['Primeiro', 'Segundo'],
  },
  {
    id: 'bullet-list',
    html: '<ul><li>Alpha</li><li>Beta</li></ul>',
    rootNodeType: 'bulletList',
    jsonIncludes: ['Alpha', 'Beta'],
  },
  {
    id: 'blockquote',
    html: '<blockquote><p>Citação importante</p></blockquote>',
    jsonIncludes: ['Citação importante'],
  },
  {
    id: 'code-block',
    html: '<pre><code>const x = 1;</code></pre>',
    jsonIncludes: ['const x = 1'],
  },
  {
    id: 'inline-code',
    html: '<p>Use o comando <code>npm test</code></p>',
    jsonIncludes: ['npm test'],
  },
  {
    id: 'horizontal-rule',
    html: '<p>Antes</p><hr><p>Depois</p>',
    jsonIncludes: ['Antes', 'Depois'],
  },
  {
    id: 'external-link',
    html: '<p><a href="https://example.com">link externo</a></p>',
    contains: ['https://example.com'],
    jsonIncludes: ['link externo'],
  },
  {
    id: 'heading-h2',
    html: '<h2>Título da seção</h2><p>Corpo</p>',
    jsonIncludes: ['Título da seção', 'Corpo'],
  },
  {
    id: 'text-align-center',
    html: '<p style="text-align: center">Centralizado</p>',
    jsonIncludes: ['Centralizado'],
  },
  {
    id: 'google-docs-guid',
    html: '<b id="docs-internal-guid-xyz"><p>Docs</p></b>',
    contains: ['Docs'],
    notContains: ['docs-internal-guid'],
  },
  {
    id: 'google-docs-orphan-numbers',
    html: '<p>1.</p><p><strong>Item A:</strong> Descrição longa do item A no documento.</p>',
    contains: ['Item A'],
    notContains: ['<p>1.</p>'],
  },
  {
    id: 'word-mso-normal',
    html: '<p class="MsoNormal">Texto do Word</p>',
    contains: ['Texto do Word'],
    notContains: ['MsoNormal'],
  },
  {
    id: 'wordpress-image-figure',
    html: '<figure class="wp-block-image"><img src="https://cdn.example.com/a.jpg" alt=""><figcaption>Legenda</figcaption></figure>',
    contains: ['a.jpg', 'alt="Legenda"'],
    notContains: ['wp-block-image'],
  },
  {
    id: 'wordpress-quote-block',
    html: '<div class="wp-block-quote"><p>Aviso geral</p></div>',
    contains: ['<blockquote>', 'Aviso geral'],
  },
  {
    id: 'wordpress-youtube-embed',
    html: '<figure class="wp-block-embed"><iframe src="https://www.youtube.com/embed/abc123"></iframe></figure>',
    contains: ['data-video-embed', 'youtube'],
  },
  {
    id: 'youtube-standalone-url',
    html: '<p>https://youtu.be/abc123def45</p>',
    contains: ['data-video-embed'],
  },
  {
    id: 'vimeo-standalone-url',
    html: '<p>https://vimeo.com/123456789</p>',
    contains: ['data-video-embed', 'vimeo'],
  },
  {
    id: 'nested-spans',
    html: '<p><span><span>Texto limpo</span></span></p>',
    contains: ['Texto limpo'],
    notContains: ['<span>'],
  },
  {
    id: 'table-basic',
    html: '<table><tr><th>H</th></tr><tr><td>C</td></tr></table>',
    rootNodeType: 'table',
    jsonIncludes: ['H', 'C'],
  },
  {
    id: 'image-external-url',
    html: '<p><img src="https://cdn.example.com/photo.png" alt="foto"></p>',
    contains: ['photo.png'],
    jsonIncludes: ['foto'],
  },
  {
    id: 'mixed-formatting-paragraph',
    html: '<p><strong>Negrito</strong>, <em>itálico</em> e <a href="https://loft.com.br">Loft</a></p>',
    jsonIncludes: ['Negrito', 'itálico', 'Loft'],
  },
  {
    id: 'wp-columns-unwrap',
    html: '<div class="wp-block-columns"><div class="wp-block-column"><p>Coluna</p></div></div>',
    contains: ['Coluna'],
    notContains: ['wp-block-columns'],
  },
]
