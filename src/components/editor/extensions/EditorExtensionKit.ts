import type { Extensions } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import StarterKit from '@tiptap/starter-kit'
import { AccordionExtension } from '@/components/editor/AccordionExtension'
import { CalloutExtension } from '@/components/editor/CalloutExtension'
import { VideoEmbedExtension } from '@/components/editor/VideoEmbedExtension'
import {
  createEditorFileHandlerExtension,
  type EditorImageFileHandlers,
} from '@/components/editor/extensions/EditorFileHandler'
import { EditorKeyboardShortcuts } from '@/components/editor/extensions/EditorKeyboardShortcuts'

export type EditorHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export const EDITOR_HEADING_LEVELS: EditorHeadingLevel[] = [1, 2, 3, 4, 5, 6]

export interface EditorExtensionKitOptions {
  /** Shown only in edit mode when provided */
  placeholder?: string
  headingLevels?: EditorHeadingLevel[]
  /** Register extra keyboard shortcuts (edit mode only) */
  enableKeyboardShortcuts?: boolean
  /** Image paste/drop handler (edit mode only) */
  getImageFileHandlers?: () => EditorImageFileHandlers | null
  /** Enable column resize handles in tables (edit mode only) */
  resizableTables?: boolean
}

/**
 * Single source of truth for TipTap extensions used by the editor and viewer.
 * Import, paste, and tests must use the same kit to avoid schema drift.
 */
export function createEditorExtensions(options: EditorExtensionKitOptions = {}): Extensions {
  const {
    placeholder,
    headingLevels = EDITOR_HEADING_LEVELS,
    enableKeyboardShortcuts = false,
    getImageFileHandlers,
    resizableTables = false,
  } = options

  const extensions: Extensions = [
    StarterKit.configure({
      heading: { levels: headingLevels },
      link: {
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Image.configure({
      allowBase64: true,
    }),
    TableKit.configure({
      table: { resizable: resizableTables },
    }),
    VideoEmbedExtension,
    CalloutExtension,
    AccordionExtension,
  ]

  if (enableKeyboardShortcuts) {
    extensions.push(EditorKeyboardShortcuts)
  }

  if (getImageFileHandlers) {
    extensions.push(createEditorFileHandlerExtension(getImageFileHandlers))
  }

  if (placeholder) {
    extensions.push(Placeholder.configure({ placeholder }))
  }

  return extensions
}
