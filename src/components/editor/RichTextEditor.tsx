import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import styles from './RichTextEditor.module.css'

interface RichTextEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
  placeholder?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escreva o conteúdo do artigo…',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as Record<string, unknown>)
    },
    editorProps: {
      attributes: {
        class: styles.editorContent,
      },
    },
  })

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar} role="toolbar" aria-label="Formatação de texto">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? styles.active : ''}
          aria-label="Negrito"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? styles.active : ''}
          aria-label="Itálico"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? styles.active : ''}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? styles.active : ''}
        >
          • Lista
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? styles.active : ''}
        >
          1. Lista
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? styles.active : ''}
        >
          Citação
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URL do link:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          className={editor.isActive('link') ? styles.active : ''}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URL da imagem:')
            if (url) editor.chain().focus().setImage({ src: url }).run()
          }}
        >
          Imagem
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
