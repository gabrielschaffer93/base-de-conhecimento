import type { Editor } from '@tiptap/react'
import { useEffect, useReducer, useRef, useState } from 'react'
import { AccordionInsertModal } from '@/components/editor/AccordionInsertModal'
import { LinkInsertPopover } from '@/components/editor/LinkInsertPopover'
import { CALLOUT_ICONS, type CalloutType } from '@/components/editor/CalloutExtension'
import {
  EDITOR_HEADING_LEVELS,
  type EditorHeadingLevel,
} from '@/components/editor/extensions/EditorExtensionKit'
import styles from './RichTextEditor.module.css'

const CALLOUT_LABELS: Record<CalloutType, string> = {
  tip: 'Dica',
  warning: 'Atenção',
  info: 'Informação',
  success: 'Sucesso',
}

interface ToolbarButtonProps {
  label: string
  onClick?: () => void
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void
  isActive?: boolean
  disabled?: boolean
  ariaHasPopup?: boolean | 'menu'
  ariaExpanded?: boolean
  ariaControls?: string
  children: React.ReactNode
}

function ToolbarButton({
  label,
  onClick,
  onMouseDown,
  isActive,
  disabled,
  ariaHasPopup,
  ariaExpanded,
  ariaControls,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.toolBtn} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      aria-label={label}
      title={label}
      aria-pressed={isActive}
      aria-haspopup={ariaHasPopup}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className={styles.divider} aria-hidden="true" />
}

const BLOCK_FORMAT_OPTIONS = [
  { value: 'paragraph', label: 'Parágrafo' },
  ...EDITOR_HEADING_LEVELS.map((level) => ({
    value: `h${level}`,
    label: `Título ${level}`,
  })),
]

function getCurrentBlockFormat(editor: Editor): string {
  for (const level of EDITOR_HEADING_LEVELS) {
    if (editor.isActive('heading', { level })) return `h${level}`
  }
  return 'paragraph'
}

function focusAdjacentToolbarControl(toolbar: HTMLElement, direction: 1 | -1, current: HTMLElement) {
  const controls = Array.from(
    toolbar.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled)'),
  )

  const index = controls.indexOf(current)
  if (index === -1) return

  const nextIndex = (index + direction + controls.length) % controls.length
  controls[nextIndex]?.focus()
}

function focusToolbarEdge(toolbar: HTMLElement, edge: 'start' | 'end', current: HTMLElement) {
  const controls = Array.from(
    toolbar.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled)'),
  )

  if (!controls.length || !controls.includes(current)) return
  controls[edge === 'start' ? 0 : controls.length - 1]?.focus()
}

function BlockFormatSelect({ editor }: { editor: Editor }) {
  const value = getCurrentBlockFormat(editor)

  return (
    <select
      className={styles.formatSelect}
      value={value}
      onChange={(event) => {
        const selected = event.target.value
        if (selected === 'paragraph') {
          editor.chain().focus().setParagraph().run()
          return
        }
        const level = Number.parseInt(selected.slice(1), 10) as EditorHeadingLevel
        editor.chain().focus().setHeading({ level }).run()
      }}
      aria-label="Formato do bloco"
      title="Formato do bloco"
    >
      {BLOCK_FORMAT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

type TextAlignValue = 'left' | 'center' | 'right' | 'justify'

const TEXT_ALIGN_OPTIONS: { value: TextAlignValue; label: string; icon: string }[] = [
  { value: 'left', label: 'Alinhar à esquerda', icon: 'L' },
  { value: 'center', label: 'Centralizar', icon: 'C' },
  { value: 'right', label: 'Alinhar à direita', icon: 'R' },
  { value: 'justify', label: 'Justificar', icon: 'J' },
]

function TableToolbarGroup({ editor }: { editor: Editor }) {
  const inTable = editor.isActive('table')

  return (
    <>
      <ToolbarButton
        label="Inserir tabela 3×3"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        disabled={inTable}
      >
        ⊞
      </ToolbarButton>
      {inTable && (
        <>
          <ToolbarButton
            label="Adicionar linha abaixo"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            disabled={!editor.can().addRowAfter()}
          >
            +↧
          </ToolbarButton>
          <ToolbarButton
            label="Remover linha"
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={!editor.can().deleteRow()}
          >
            −↧
          </ToolbarButton>
          <ToolbarButton
            label="Adicionar coluna à direita"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            disabled={!editor.can().addColumnAfter()}
          >
            +→
          </ToolbarButton>
          <ToolbarButton
            label="Remover coluna"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={!editor.can().deleteColumn()}
          >
            −→
          </ToolbarButton>
          <ToolbarButton
            label="Remover tabela"
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={!editor.can().deleteTable()}
          >
            ⊟
          </ToolbarButton>
        </>
      )}
    </>
  )
}

const CALLOUT_MENU_ID = 'editor-callout-menu'

export function RichTextToolbar({
  editor,
  onAiImproveRequest,
}: {
  editor: Editor
  onAiImproveRequest?: () => void
}) {
  const [, rerender] = useReducer((v: number) => v + 1, 0)
  const [showCalloutMenu, setShowCalloutMenu] = useState(false)
  const [showAccordionModal, setShowAccordionModal] = useState(false)
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const [linkUrl, setLinkUrl] = useState('https://')
  const calloutMenuRef = useRef<HTMLDivElement>(null)
  const linkMenuRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleUpdate = () => rerender()
    editor.on('transaction', handleUpdate)
    editor.on('selectionUpdate', handleUpdate)
    return () => {
      editor.off('transaction', handleUpdate)
      editor.off('selectionUpdate', handleUpdate)
    }
  }, [editor])

  useEffect(() => {
    if (!showCalloutMenu) return

    const close = (event: MouseEvent) => {
      if (calloutMenuRef.current?.contains(event.target as Node)) return
      setShowCalloutMenu(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCalloutMenu(false)
      }
    }

    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showCalloutMenu])

  useEffect(() => {
    if (!showLinkPopover) return

    const close = (event: MouseEvent) => {
      if (linkMenuRef.current?.contains(event.target as Node)) return
      setShowLinkPopover(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowLinkPopover(false)
    }

    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showLinkPopover])

  const handleToolbarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const toolbar = toolbarRef.current
    const target = event.target
    if (!toolbar || !(target instanceof HTMLElement)) return

    if (event.key === 'Escape') {
      setShowCalloutMenu(false)
      setShowLinkPopover(false)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusAdjacentToolbarControl(toolbar, 1, target)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusAdjacentToolbarControl(toolbar, -1, target)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      focusToolbarEdge(toolbar, 'start', target)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      focusToolbarEdge(toolbar, 'end', target)
    }
  }

  const openLinkPopover = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    setLinkUrl(previousUrl ?? 'https://')
    setShowLinkPopover(true)
    setShowCalloutMenu(false)
  }

  const applyLink = (url: string) => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: url,
          marks: [{ type: 'link', attrs: { href: url } }],
        })
        .run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
  }

  return (
    <div
      ref={toolbarRef}
      className={styles.toolbar}
      role="toolbar"
      aria-label="Formatação de texto"
      onKeyDown={handleToolbarKeyDown}
    >
      <div className={styles.toolbarGroup} role="group" aria-label="Histórico">
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

      <div className={styles.toolbarGroup} role="group" aria-label="Formato do bloco">
        <BlockFormatSelect editor={editor} />
      </div>

      <ToolbarDivider />

      <div className={styles.toolbarGroup} role="group" aria-label="Estilo de texto">
        <ToolbarButton
          label="Negrito (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Itálico (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Sublinhado (Ctrl+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          label="Riscado (Ctrl+Shift+X)"
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

      <div className={styles.toolbarGroup} role="group" aria-label="Alinhamento">
        {TEXT_ALIGN_OPTIONS.map((option) => (
          <ToolbarButton
            key={option.value}
            label={option.label}
            onClick={() => editor.chain().focus().setTextAlign(option.value).run()}
            isActive={editor.isActive({ textAlign: option.value })}
          >
            {option.icon}
          </ToolbarButton>
        ))}
      </div>

      <ToolbarDivider />

      <div className={styles.toolbarGroup} role="group" aria-label="Listas e blocos">
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
          label="Lista de tarefas"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
        >
          ☑
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

      <div className={styles.toolbarGroup} role="group" aria-label="Tabelas">
        <TableToolbarGroup editor={editor} />
      </div>

      <ToolbarDivider />

      <div ref={calloutMenuRef} className={styles.toolbarGroup} style={{ position: 'relative' }} role="group" aria-label="Callouts">
        <ToolbarButton
          label="Inserir callout"
          onMouseDown={(event) => {
            event.preventDefault()
            setShowCalloutMenu((value) => !value)
          }}
          isActive={editor.isActive('callout')}
          ariaHasPopup="menu"
          ariaExpanded={showCalloutMenu}
          ariaControls={CALLOUT_MENU_ID}
        >
          💡
        </ToolbarButton>

        {showCalloutMenu && (
          <div
            id={CALLOUT_MENU_ID}
            className={styles.calloutMenu}
            role="menu"
            aria-label="Tipos de callout"
          >
            {(['tip', 'warning', 'info', 'success'] as CalloutType[]).map((type) => (
              <button
                key={type}
                type="button"
                role="menuitem"
                className={styles.calloutMenuItem}
                onMouseDown={(event) => {
                  event.preventDefault()
                  editor.chain().focus().insertCallout(type).run()
                  setShowCalloutMenu(false)
                }}
              >
                {CALLOUT_ICONS[type]} {CALLOUT_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      <ToolbarDivider />

      <div className={styles.toolbarGroup}>
        <ToolbarButton
          label="Inserir accordion (seção expansível)"
          onClick={() => setShowAccordionModal(true)}
          isActive={editor.isActive('accordion')}
        >
          ▶
        </ToolbarButton>
      </div>

      <AccordionInsertModal
        open={showAccordionModal}
        onClose={() => setShowAccordionModal(false)}
        onConfirm={(title) => {
          editor.chain().focus().insertAccordion(title).run()
          setShowAccordionModal(false)
        }}
      />

      {onAiImproveRequest && (
        <>
          <ToolbarDivider />
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              className={styles.aiImproveBtn}
              onClick={onAiImproveRequest}
              title="Melhorar texto com IA"
              aria-label="Melhorar texto com IA"
            >
              ✨ Melhorar com IA
            </button>
          </div>
        </>
      )}

      <ToolbarDivider />

      <div
        ref={linkMenuRef}
        className={styles.toolbarGroup}
        style={{ position: 'relative' }}
        role="group"
        aria-label="Links e limpeza"
      >
        <ToolbarButton
          label="Inserir link"
          onMouseDown={(event) => {
            event.preventDefault()
            openLinkPopover()
          }}
          isActive={editor.isActive('link') || showLinkPopover}
          ariaHasPopup="dialog"
          ariaExpanded={showLinkPopover}
        >
          🔗
        </ToolbarButton>

        {showLinkPopover && (
          <LinkInsertPopover
            initialUrl={linkUrl}
            canRemove={editor.isActive('link')}
            onConfirm={(url) => {
              applyLink(url)
              setShowLinkPopover(false)
            }}
            onRemove={() => {
              removeLink()
              setShowLinkPopover(false)
            }}
            onClose={() => setShowLinkPopover(false)}
          />
        )}

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
