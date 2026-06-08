import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

interface RichTextViewerProps {
  content: Record<string, unknown>
}

export function RichTextViewer({ content }: RichTextViewerProps) {
  const editor = useEditor({
    extensions: [StarterKit, Link, Image],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'rich-content',
      },
    },
  })

  if (!editor) return null
  return <EditorContent editor={editor} />
}
