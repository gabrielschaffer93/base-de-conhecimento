import { describe, expect, it } from 'vitest'
import {
  clipboardHasEmbeddedDataUrlImages,
  clipboardHasImages,
  getClipboardImageFiles,
  normalizeImageFile,
  shouldInterceptImagePaste,
  shouldProcessRichDocumentPaste,
} from '@/components/editor/clipboardImages'

const TINY_PNG = new File([new Uint8Array([137, 80, 78, 71])], 'image.png', { type: 'image/png' })

function mockClipboard(options: {
  html?: string
  plain?: string
  files?: File[]
}): DataTransfer {
  const clipboard = new DataTransfer()

  if (options.html !== undefined) clipboard.setData('text/html', options.html)
  if (options.plain !== undefined) clipboard.setData('text/plain', options.plain)

  for (const file of options.files ?? []) {
    clipboard.items.add(file)
  }

  return clipboard
}

describe('clipboardImages', () => {
  describe('normalizeImageFile', () => {
    it('keeps a file that already has a usable name and type', () => {
      const file = new File(['x'], 'diagram.png', { type: 'image/png' })
      expect(normalizeImageFile(file)).toBe(file)
    })

    it('renames generic pasted image files', () => {
      const file = new File(['x'], 'image.png', { type: 'image/png' })
      const normalized = normalizeImageFile(file, 2)

      expect(normalized.name).toMatch(/^pasted-image-\d+-2\.png$/)
      expect(normalized.type).toBe('image/png')
    })

    it('defaults missing image mime type to image/png', () => {
      const file = new File(['x'], 'photo.bin', { type: '' })
      const normalized = normalizeImageFile(file)

      expect(normalized.type).toBe('image/png')
      expect(normalized.name).toBe('photo.bin')
    })
  })

  describe('getClipboardImageFiles', () => {
    it('collects image files from clipboard items', () => {
      const clipboard = mockClipboard({ files: [TINY_PNG] })
      const files = getClipboardImageFiles(clipboard)

      expect(files).toHaveLength(1)
      expect(files[0].type).toBe('image/png')
    })

    it('deduplicates identical image files', () => {
      const clipboard = mockClipboard({ files: [TINY_PNG, TINY_PNG] })
      expect(getClipboardImageFiles(clipboard)).toHaveLength(1)
    })
  })

  describe('clipboardHasImages', () => {
    it('detects image files in the clipboard', () => {
      expect(clipboardHasImages(mockClipboard({ files: [TINY_PNG] }))).toBe(true)
    })

    it('detects data URL images in HTML', () => {
      const html = '<img src="data:image/png;base64,iVBORw0KGgo=" alt="">'
      expect(clipboardHasImages(mockClipboard({ html }))).toBe(true)
    })

    it('detects googleusercontent image URLs in HTML', () => {
      const html = '<img src="https://lh3.googleusercontent.com/abc" alt="">'
      expect(clipboardHasImages(mockClipboard({ html }))).toBe(true)
    })

    it('returns false for plain text only', () => {
      expect(clipboardHasImages(mockClipboard({ plain: 'Sem imagens' }))).toBe(false)
    })
  })

  describe('shouldInterceptImagePaste', () => {
    it('intercepts screenshot paste with image file only', () => {
      const clipboard = mockClipboard({ files: [TINY_PNG] })
      expect(shouldInterceptImagePaste(clipboard)).toBe(true)
    })

    it('does not intercept rich document paste with images and paragraphs', () => {
      const clipboard = mockClipboard({
        html: '<p>Parágrafo do Word</p><img src="https://example.com/a.png">',
        plain: 'Parágrafo do Word',
      })

      expect(shouldInterceptImagePaste(clipboard)).toBe(false)
    })

    it('intercepts data URL image HTML without plain text', () => {
      const html = '<img src="data:image/png;base64,iVBORw0KGgo=">'
      expect(shouldInterceptImagePaste(mockClipboard({ html }))).toBe(true)
    })

    it('does not intercept when there are no images', () => {
      expect(shouldInterceptImagePaste(mockClipboard({ plain: 'Apenas texto' }))).toBe(false)
    })
  })

  describe('shouldProcessRichDocumentPaste', () => {
    it('returns true for HTML with document structure and plain text', () => {
      const clipboard = mockClipboard({
        html: '<p>Conteúdo <strong>formatado</strong></p>',
        plain: 'Conteúdo formatado',
      })

      expect(shouldProcessRichDocumentPaste(clipboard)).toBe(true)
    })

    it('returns false when HTML is empty', () => {
      expect(shouldProcessRichDocumentPaste(mockClipboard({ plain: 'Texto' }))).toBe(false)
    })

    it('returns false when plain text is empty', () => {
      expect(
        shouldProcessRichDocumentPaste(mockClipboard({ html: '<p>Só HTML</p>' })),
      ).toBe(false)
    })
  })

  describe('clipboardHasEmbeddedDataUrlImages', () => {
    it('detects embedded data URL images', () => {
      const html = '<p><img src="data:image/jpeg;base64,/9j/4AAQ" alt=""></p>'
      expect(clipboardHasEmbeddedDataUrlImages(mockClipboard({ html }))).toBe(true)
    })

    it('returns false for external image URLs', () => {
      const html = '<img src="https://cdn.example.com/a.jpg" alt="">'
      expect(clipboardHasEmbeddedDataUrlImages(mockClipboard({ html }))).toBe(false)
    })
  })
})
