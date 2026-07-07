import { describe, expect, it } from 'vitest'
import { detectPasteSource } from '@/components/editor/paste/detectSource'

describe('detectPasteSource', () => {
  it.each([
    ['google-docs-guid', '<b id="docs-internal-guid-abc"><p>Texto</p></b>', 'google-docs'],
    ['googleusercontent-image', '<img src="https://lh3.googleusercontent.com/x">', 'google-docs'],
    ['mso-normal', '<p class="MsoNormal">Word</p>', 'microsoft-word'],
    ['office-xmlns', '<html xmlns:o="urn:schemas-microsoft-com:office:office">', 'microsoft-word'],
    ['mso-conditional', '<!--[if gte mso 9]><xml></xml><![endif]-->', 'microsoft-word'],
    ['wp-block-class', '<figure class="wp-block-image"><img src="x"></figure>', 'wordpress'],
    ['wp-comment', '<!-- wp:paragraph --><p>WP</p><!-- /wp:paragraph -->', 'wordpress'],
    ['generic-paragraph', '<p>HTML simples</p>', 'generic'],
    ['generic-table', '<table><tr><td>Célula</td></tr></table>', 'generic'],
  ] as const)('detects %s as %s', (_label, html, expected) => {
    expect(detectPasteSource(html)).toBe(expected)
  })

  it('prioritizes Google Docs over WordPress when both markers appear', () => {
    const html =
      '<b id="docs-internal-guid-xyz"><figure class="wp-block-image"><img src="x"></figure></b>'

    expect(detectPasteSource(html)).toBe('google-docs')
  })
})
