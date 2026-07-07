import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useMemo } from 'react'
import { createEditorExtensions } from '@/components/editor/extensions/EditorExtensionKit'
import { transformVideoLinksInContent } from '@/lib/videoEmbeds'

interface RichTextViewerProps {
  content: Record<string, unknown>
}

export function RichTextViewer({ content }: RichTextViewerProps) {
  const normalizedContent = useMemo(() => transformVideoLinksInContent(content), [content])

  const editor = useEditor({
    extensions: createEditorExtensions(),
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
