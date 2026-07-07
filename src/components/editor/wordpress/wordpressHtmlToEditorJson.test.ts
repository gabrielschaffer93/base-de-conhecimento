import { describe, expect, it } from 'vitest'
import { editorHtmlToJson } from '@/components/editor/extensions/editorRoundTrip'
import { transformWordPressImportHtml } from '@/components/editor/wordpress/transformWordPressImportHtml'
import { wordpressHtmlToEditorJson } from '@/components/editor/wordpress/wordpressHtmlToEditorJson'

describe('WordPress HTML import', () => {
  it('converts wp-block-image figures into image nodes', () => {
    const html =
      '<figure class="wp-block-image"><img src="https://cdn.example.com/photo.jpg" alt=""><figcaption>Legenda da foto</figcaption></figure>'

    const json = wordpressHtmlToEditorJson(html)
    const serialized = JSON.stringify(json)

    expect(serialized).toContain('photo.jpg')
    expect(serialized).toContain('Legenda da foto')
    expect(serialized).not.toContain('wp-block-image')
  })

  it('converts wp-block-quote blocks to blockquotes', () => {
    const html = '<div class="wp-block-quote"><p>&gt; GERAL</p><p>Texto explicativo do callout legado.</p></div>'

    const processed = transformWordPressImportHtml(html)
    expect(processed).toContain('<blockquote>')

    const json = editorHtmlToJson(processed)
    expect(JSON.stringify(json)).toContain('GERAL')
  })

  it('converts wp-block-embed YouTube iframes to video embed markup', () => {
    const html = `
      <figure class="wp-block-embed is-type-video is-provider-youtube">
        <div class="wp-block-embed__wrapper">
          <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube"></iframe>
        </div>
      </figure>
    `

    const processed = transformWordPressImportHtml(html)
    expect(processed).toContain('data-video-embed')
    expect(processed).toContain('youtube')
  })

  it('preserves shortcode syntax as plain text', () => {
    const html = '<p>[vista_corretores id="123"]</p>'

    const json = wordpressHtmlToEditorJson(html)
    expect(JSON.stringify(json)).toContain('vista_corretores')
    expect(JSON.stringify(json)).toContain('123')
  })

  it('imports classic lists and internal article links', () => {
    const html = `
      <ul>
        <li>Como cadastrar: <a href="/artigos/cadastro-de-cliente/">Leitura</a></li>
        <li>Item com <strong>negrito</strong></li>
      </ul>
    `

    const json = wordpressHtmlToEditorJson(html)
    const serialized = JSON.stringify(json)

    expect(serialized).toContain('cadastro-de-cliente')
    expect(serialized).toContain('negrito')
    expect(json.content?.[0]?.type).toBe('bulletList')
  })

  it('strips Gutenberg comments before parsing', () => {
    const html = `
      <!-- wp:paragraph -->
      <p>Parágrafo importado</p>
      <!-- /wp:paragraph -->
    `

    const json = wordpressHtmlToEditorJson(html)
    expect(JSON.stringify(json)).toContain('Parágrafo importado')
  })
})
