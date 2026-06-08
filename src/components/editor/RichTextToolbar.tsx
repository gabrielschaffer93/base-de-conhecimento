import type { Editor } from '@tiptap/react'
import { useEffect, useReducer } from 'react'
import styles from './RichTextEditor.module.css'

interface ToolbarButtonProps {
  label: string
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
}

function ToolbarButton({ label, onClick, isActive, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.toolBtn} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className={styles.divider} aria-hidden="true" />
}

export function RichTextToolbar({ editor }: { editor: Editor }) {
  const [, rerender] = useReducer((v: number) => v + 1, 0)

  useEffect(() => {
    const handleUpdate = () => rerender()
    editor.on('transaction', handleUpdate)
    editor.on('selectionUpdate', handleUpdate)
    return () => {
      editor.off('transaction', handleUpdate)
      editor.off('selectionUpdate', handleUpdate)
    }
  }, [editor])

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL do link:', previousUrl ?? 'https://')

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Formatação de texto">
      <div className={styles.toolbarGroup}>
        <ToolbarButton
          label="Desfazer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          label="Refazer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          ↷
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className={styles.toolbarGroup}>
        <ToolbarButton
          label="Título 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          label="Título 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Título 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
        >
          H3
        </ToolbarButton>
        <ToolbarButton
          label="Parágrafo"
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive('paragraph')}
        >
          ¶
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className={styles.toolbarGroup}>
        <ToolbarButton
          label="Negrito"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Itálico"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Riscado"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          label="Código inline"
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
        >
          {'</>'}
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className={styles.toolbarGroup}>
        <ToolbarButton
          label="Lista com marcadores"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          •
        </ToolbarButton>
        <ToolbarButton
          label="Lista numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          label="Citação"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        >
          “
        </ToolbarButton>
        <ToolbarButton
          label="Bloco de código"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
        >
          {'{ }'}
        </ToolbarButton>
        <ToolbarButton
          label="Linha horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          ―
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className={styles.toolbarGroup}>
        <ToolbarButton
          label="Inserir link"
          onClick={setLink}
          isActive={editor.isActive('link')}
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          label="Remover link"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
        >
          ✕
        </ToolbarButton>
        <ToolbarButton
          label="Limpar formatação"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          ⌫
        </ToolbarButton>
      </div>
    </div>
  )
}
