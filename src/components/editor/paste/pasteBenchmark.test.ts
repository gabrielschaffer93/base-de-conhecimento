import { describe, expect, it } from 'vitest'
import { transformPastedHtmlSync } from '@/components/editor/paste/processPasteHtml'

const LARGE_WORD_PASTE_HTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office">
<body>
${Array.from({ length: 80 }, (_, index) => `
  <p class="MsoNormal"><strong>Seção ${index + 1}:</strong> Texto de exemplo com formatação rica colada do Word.</p>
  <ul>
    <li>Item A da seção ${index + 1}</li>
    <li>Item B da seção ${index + 1}</li>
  </ul>
  <table>
    <tr><th>Coluna</th><th>Valor</th></tr>
    <tr><td>Linha ${index + 1}</td><td>${(index + 1) * 10}</td></tr>
  </table>
`).join('\n')}
</body>
</html>
`

describe('paste performance', () => {
  it('transforms a large Word-like paste within a reasonable time budget', () => {
    const start = performance.now()
    const result = transformPastedHtmlSync(LARGE_WORD_PASTE_HTML)
    const elapsedMs = performance.now() - start

    expect(result).toContain('Seção 1')
    expect(result).toContain('<table')
    expect(elapsedMs).toBeLessThan(3_000)

    console.info(`[paste-benchmark] large Word-like HTML: ${elapsedMs.toFixed(1)}ms`)
  })

  it('transforms repeated Google Docs orphan-number cleanup efficiently', () => {
    const html = Array.from({ length: 120 }, (_, index) => `
      <p>${index + 1}.</p>
      <p><strong>Passo ${index + 1}:</strong> Descrição detalhada do passo ${index + 1} no fluxo operacional.</p>
    `).join('\n')

    const start = performance.now()
    const result = transformPastedHtmlSync(html)
    const elapsedMs = performance.now() - start

    expect(result).toContain('Passo 1')
    expect(result).not.toContain('<p>1.</p>')
    expect(elapsedMs).toBeLessThan(2_000)

    console.info(`[paste-benchmark] Google Docs orphan numbers: ${elapsedMs.toFixed(1)}ms`)
  })
})
