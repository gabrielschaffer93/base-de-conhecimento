import type { Editor } from '@tiptap/react'
import { normalizeImageFile } from '@/components/editor/clipboardImages'
import { uploadMedia } from '@/features/media/mediaService'

export { EDITOR_IMAGE_MIME_TYPES } from '@/components/editor/images/editorImageConstants'

export interface InsertEditorImagesResult {
  inserted: number
  failed: number
}

export async function insertUploadedImagesInEditor(
  editor: Editor,
  files: File[],
  userId: string,
  position?: number,
): Promise<InsertEditorImagesResult> {
  let inserted = 0
  let failed = 0
  let insertPos = position

  for (let index = 0; index < files.length; index += 1) {
    const normalizedFile = normalizeImageFile(files[index], index)

    try {
      const asset = await uploadMedia(normalizedFile, userId, normalizedFile.name)
      const imageNode = {
        type: 'image' as const,
        attrs: { src: asset.public_url, alt: asset.original_name },
      }

      if (insertPos !== undefined) {
        editor.chain().focus().insertContentAt(insertPos, imageNode).run()
        insertPos += 1
      } else {
        editor.chain().focus().insertContent(imageNode).run()
      }

      inserted += 1
    } catch {
      failed += 1
    }
  }

  return { inserted, failed }
}
