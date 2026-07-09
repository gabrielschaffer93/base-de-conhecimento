import { describe, expect, it, vi } from 'vitest'
import { detectPasteSource } from '@/components/editor/paste/detectSource'
import { processPasteHtml, transformPastedHtmlSync } from '@/components/editor/paste/processPasteHtml'
import { editorHtmlToJson } from '@/components/editor/extensions/editorRoundTrip'

const noopUpload = vi.fn(async () => ({
  publicUrl: 'https://cdn.example.com/image.png',
  originalName: 'image.png',
}))

describe('paste pipeline', () => {
  it('detects Google Docs clipboard HTML', () => {
    const html = '<b id="docs-internal-guid-abc"><p>Texto</p></b>'
    expect(detectPasteSource(html)).toBe('google-docs')
  })

  it('detects Microsoft Word clipboard HTML', () => {
    const html = '<p class="MsoNormal">Parágrafo do Word</p>'
    expect(detectPasteSource(html)).toBe('microsoft-word')
  })

  it('detects WordPress clipboard HTML', () => {
    const html = '<figure class="wp-block-image"><img src="https://example.com/a.png" alt=""></figure>'
    expect(detectPasteSource(html)).toBe('wordpress')
  })

  it('removes scripts and javascript links during sync transform', () => {
    const html =
      '<p onclick="alert(1)">Texto</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>'

    const result = transformPastedHtmlSync(html)

    expect(result).toContain('Texto')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('javascript:')
  })

  it('merges orphan numbered paragraphs from Google Docs style paste', () => {
    const html = `
      <p>1.</p>
      <p><strong>Configuração de Recebimento:</strong> Ajustaremos o acesso do usuário.</p>
      <p>2.</p>
      <p><strong>Configuração de Envio:</strong> Ajustaremos o acesso do usuário.</p>
    `

    const result = transformPastedHtmlSync(html)

    expect(result).toMatch(/Configuração de Recebimento/)
    expect(result).toMatch(/Configuração de Envio/)
    expect(result).not.toMatch(/<p>1\.<\/p>/)
    expect(result).not.toMatch(/<p>2\.<\/p>/)
  })

  it('unwraps WordPress figure blocks to images', () => {
    const html =
      '<figure class="wp-block-image size-large"><img src="https://example.com/photo.jpg" alt=""><figcaption>Legenda</figcaption></figure>'

    const result = transformPastedHtmlSync(html)

    expect(result).toContain('<img')
    expect(result).toContain('photo.jpg')
    expect(result).toContain('alt="Legenda"')
    expect(result).not.toContain('wp-block-image')
  })

  it('converts standalone YouTube URLs to video embed markup', () => {
    const html = '<p>https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>'

    const result = transformPastedHtmlSync(html)

    expect(result).toContain('data-video-embed')
    expect(result).toContain('data-provider="youtube"')
  })

  it('round-trips cleaned paste HTML through the editor schema', async () => {
    const html = '<h2>Título</h2><ul><li>Item um</li><li>Item dois</li></ul>'

    const processed = await processPasteHtml(html, new DataTransfer(), noopUpload)
    const json = editorHtmlToJson(processed)

    expect(json.type).toBe('doc')
    expect(JSON.stringify(json)).toContain('Item um')
    expect(JSON.stringify(json)).toContain('Título')
  })

  it('preserves pasted HTML tables after sanitization', () => {
    const html = `
      <table>
        <thead>
          <tr><th>Coluna A</th><th>Coluna B</th></tr>
        </thead>
        <tbody>
          <tr><td>Linha 1</td><td>Valor</td></tr>
        </tbody>
      </table>
    `

    const result = transformPastedHtmlSync(html)
    const json = editorHtmlToJson(result)

    expect(JSON.stringify(json)).toContain('Coluna A')
    expect(JSON.stringify(json)).toContain('Linha 1')
    expect(json.content?.[0]?.type).toBe('table')
  })
})
