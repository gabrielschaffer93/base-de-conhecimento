import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Editor } from '@tiptap/react'
import { insertUploadedImagesInEditor } from '@/components/editor/images/editorImageUpload'

const uploadMedia = vi.fn()

vi.mock('@/features/media/mediaService', () => ({
  uploadMedia: (...args: unknown[]) => uploadMedia(...args),
}))

function createMockEditor() {
  const chain = {
    focus: vi.fn().mockReturnThis(),
    insertContent: vi.fn().mockReturnThis(),
    insertContentAt: vi.fn().mockReturnThis(),
    run: vi.fn(),
  }

  return {
    chain: vi.fn(() => chain),
    _chain: chain,
  } as unknown as Editor & { _chain: typeof chain }
}

describe('insertUploadedImagesInEditor', () => {
  beforeEach(() => {
    uploadMedia.mockReset()
  })

  it('uploads each file and inserts image nodes at the cursor', async () => {
    const editor = createMockEditor()

    uploadMedia.mockResolvedValueOnce({
      public_url: 'https://cdn.example.com/a.png',
      original_name: 'a.png',
    })
    uploadMedia.mockResolvedValueOnce({
      public_url: 'https://cdn.example.com/b.png',
      original_name: 'b.png',
    })

    const fileA = new File(['a'], 'a.png', { type: 'image/png' })
    const fileB = new File(['b'], 'b.png', { type: 'image/png' })

    const result = await insertUploadedImagesInEditor(editor, [fileA, fileB], 'user-1')

    expect(result).toEqual({ inserted: 2, failed: 0 })
    expect(uploadMedia).toHaveBeenCalledTimes(2)
    expect(editor._chain.insertContent).toHaveBeenCalledTimes(2)
    expect(editor._chain.insertContent).toHaveBeenCalledWith({
      type: 'image',
      attrs: { src: 'https://cdn.example.com/a.png', alt: 'a.png' },
    })
  })

  it('inserts images at a drop position when provided', async () => {
    const editor = createMockEditor()

    uploadMedia.mockResolvedValueOnce({
      public_url: 'https://cdn.example.com/drop.png',
      original_name: 'drop.png',
    })

    const file = new File(['x'], 'drop.png', { type: 'image/png' })
    await insertUploadedImagesInEditor(editor, [file], 'user-1', 42)

    expect(editor._chain.insertContentAt).toHaveBeenCalledWith(42, {
      type: 'image',
      attrs: { src: 'https://cdn.example.com/drop.png', alt: 'drop.png' },
    })
  })

  it('reports failed uploads without stopping the batch', async () => {
    const editor = createMockEditor()

    uploadMedia.mockRejectedValueOnce(new Error('network'))
    uploadMedia.mockResolvedValueOnce({
      public_url: 'https://cdn.example.com/ok.png',
      original_name: 'ok.png',
    })

    const files = [
      new File(['bad'], 'bad.png', { type: 'image/png' }),
      new File(['ok'], 'ok.png', { type: 'image/png' }),
    ]

    const result = await insertUploadedImagesInEditor(editor, files, 'user-1')

    expect(result).toEqual({ inserted: 1, failed: 1 })
    expect(editor._chain.insertContent).toHaveBeenCalledTimes(1)
  })
})
