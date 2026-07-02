import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useMemo } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { VideoEmbedExtension } from '@/components/editor/VideoEmbedExtension'
import { transformVideoLinksInContent } from '@/lib/videoEmbeds'

interface RichTextViewerProps {
  content: Record<string, unknown>
}

export function RichTextViewer({ content }: RichTextViewerProps) {
  const normalizedContent = useMemo(() => transformVideoLinksInContent(content), [content])

  const editor = useEditor({
    extensions: [StarterKit, Link, Image, VideoEmbedExtension],
    content: normalizedContent,
    editable: false,
    editorProps: {
      attributes: {
        class: 'rich-content',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(normalizedContent)) {
      editor.commands.setContent(normalizedContent)
    }
  }, [editor, normalizedContent])

  if (!editor) return null
  return <EditorContent editor={editor} />
}
