import FileHandler from '@tiptap/extension-file-handler'
import type { Editor } from '@tiptap/core'
import { normalizeImageFile } from '@/components/editor/clipboardImages'
import { EDITOR_IMAGE_MIME_TYPES } from '@/components/editor/images/editorImageConstants'

export interface EditorImageFileHandlers {
  isEnabled: () => boolean
  insertImagesAtCursor: (files: File[]) => Promise<void>
  insertImagesAtPosition: (files: File[], position: number) => Promise<void>
}

function normalizeImageFiles(files: File[]): File[] {
  return files.map((file, index) => normalizeImageFile(file, index))
}

export function createEditorFileHandlerExtension(
  getHandlers: () => EditorImageFileHandlers | null,
) {
  return FileHandler.configure({
    allowedMimeTypes: [...EDITOR_IMAGE_MIME_TYPES],
    onPaste: (_editor: Editor, files, htmlContent) => {
      const handlers = getHandlers()
      if (!handlers?.isEnabled()) return

      // Rich HTML pastes are handled by the document paste pipeline.
      if (htmlContent?.trim()) return

      void handlers.insertImagesAtCursor(normalizeImageFiles(files))
    },
    onDrop: (_editor: Editor, files, position) => {
      const handlers = getHandlers()
      if (!handlers?.isEnabled()) return

      void handlers.insertImagesAtPosition(normalizeImageFiles(files), position)
    },
  })
}
