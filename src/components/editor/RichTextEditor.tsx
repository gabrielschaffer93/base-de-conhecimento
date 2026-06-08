import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RichTextToolbar } from '@/components/editor/RichTextToolbar'
import { getClipboardImageFiles } from '@/components/editor/clipboardImages'
import { uploadMedia } from '@/features/media/mediaService'
import styles from './RichTextEditor.module.css'

function ImageIcon() {
  return (
    <svg className={styles.imageUploadIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
      <path
        d="M3 16l5-5 4 4 3-3 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface RichTextEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
  placeholder?: string
  userId?: string
  onPreviewRequest?: () => void
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escreva o conteúdo do artigo…',
  userId,
  onPreviewRequest,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userIdRef = useRef(userId)
  const insertImagesRef = useRef<(files: File[]) => Promise<void>>(async () => {})
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ HTMLAttributes: { class: styles.editorImage } }),
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
      handlePaste: (_view, event) => {
        const clipboardData = event.clipboardData
        if (!clipboardData || !userIdRef.current) return false

        const imageFiles = getClipboardImageFiles(clipboardData)
        if (imageFiles.length === 0) return false

        event.preventDefault()
        void insertImagesRef.current(imageFiles)
        return true
      },
    },
  })

  const insertImagesFromFiles = useCallback(
    async (files: File[]) => {
      if (!editor || !userId || files.length === 0) return

      setIsUploadingImage(true)
      setUploadError(null)

      try {
        for (const file of files) {
          const asset = await uploadMedia(file, userId, file.name)
          editor.chain().focus().setImage({ src: asset.public_url, alt: asset.original_name }).run()
        }
      } catch {
        setUploadError('Não foi possível enviar a imagem. Tente novamente.')
      } finally {
        setIsUploadingImage(false)
      }
    },
    [editor, userId],
  )

  useEffect(() => {
    insertImagesRef.current = insertImagesFromFiles
  }, [insertImagesFromFiles])

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await insertImagesFromFiles([file])
  }

  if (!editor) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.modeTabs} role="tablist" aria-label="Modo do editor">
            <button
              type="button"
              role="tab"
              aria-selected
              className={`${styles.modeTab} ${styles.modeTabActive}`}
            >
              Editor
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              className={styles.modeTab}
              onClick={onPreviewRequest}
              disabled={!onPreviewRequest}
            >
              Visualizar
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className={styles.hiddenInput}
            onChange={handleImageUpload}
          />
          <button
            type="button"
            className={styles.imageUploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={!userId || isUploadingImage}
            title="Salva na biblioteca de mídia e insere no conteúdo. Também funciona ao colar (Ctrl+V)."
          >
            {isUploadingImage ? (
              'Enviando…'
            ) : (
              <>
                <ImageIcon />
                Inserir imagem
              </>
            )}
          </button>
        </div>

        {uploadError ? (
          <span className={styles.uploadError}>{uploadError}</span>
        ) : (
          <span className={styles.previewHint}>
            Cole imagens (Ctrl+V) ou use Inserir imagem — salva na biblioteca de mídia
          </span>
        )}
      </div>

      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
