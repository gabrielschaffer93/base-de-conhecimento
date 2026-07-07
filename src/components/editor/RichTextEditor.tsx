import { useEditor, EditorContent } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RichTextToolbar } from '@/components/editor/RichTextToolbar'
import { shouldProcessRichDocumentPaste } from '@/components/editor/clipboardImages'
import type { EditorImageFileHandlers } from '@/components/editor/extensions/EditorFileHandler'
import { createEditorExtensions } from '@/components/editor/extensions/EditorExtensionKit'
import { insertUploadedImagesInEditor } from '@/components/editor/images/editorImageUpload'
import { processPasteHtml, transformPastedHtmlSync } from '@/components/editor/paste'
import { replaceDataUrlImagesInEditor } from '@/components/editor/replaceDataUrlImages'
import { uploadMedia } from '@/features/media/mediaService'
import { isVideoEmbedUrl, parseVideoEmbedUrl, transformVideoLinksInContent } from '@/lib/videoEmbeds'
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
  onAiImproveRequest?: () => void
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escreva o conteúdo do artigo…',
  userId,
  onPreviewRequest,
  onAiImproveRequest,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userIdRef = useRef(userId)
  const insertVideoEmbedRef = useRef<(url: string) => void>(() => {})
  const processRichPasteRef = useRef<(clipboardData: DataTransfer) => Promise<void>>(async () => {})
  const imageHandlersRef = useRef<EditorImageFileHandlers>({
    isEnabled: () => false,
    insertImagesAtCursor: async () => {},
    insertImagesAtPosition: async () => {},
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isFileDragOver, setIsFileDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const extensions = useMemo(
    () =>
      createEditorExtensions({
        placeholder,
        enableKeyboardShortcuts: true,
        getImageFileHandlers: () => imageHandlersRef.current,
        resizableTables: true,
      }),
    [placeholder],
  )

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor: ed }) => {
      const current = ed.getJSON() as Record<string, unknown>
      const transformed = transformVideoLinksInContent(current)

      if (JSON.stringify(current) !== JSON.stringify(transformed)) {
        ed.commands.setContent(transformed, { emitUpdate: false })
        onChange(transformed)
        return
      }

      onChange(current)
    },
    editorProps: {
      attributes: {
        class: `${styles.editorContent} rich-content`,
      },
      transformPastedHTML: (html) => transformPastedHtmlSync(html),
      handlePaste: (_view, event) => {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        const pastedText = clipboardData.getData('text/plain').trim()
        if (pastedText && isVideoEmbedUrl(pastedText)) {
          event.preventDefault()
          insertVideoEmbedRef.current(pastedText)
          return true
        }

        if (!userIdRef.current) return false

        if (shouldProcessRichDocumentPaste(clipboardData)) {
          event.preventDefault()
          void processRichPasteRef.current(clipboardData)
          return true
        }

        return false
      },
    },
  })

  const insertImagesFromFiles = useCallback(
    async (files: File[], position?: number) => {
      if (!editor || !userId || files.length === 0) return

      setIsUploadingImage(true)
      setUploadError(null)

      try {
        const { inserted, failed } = await insertUploadedImagesInEditor(editor, files, userId, position)

        if (inserted === 0 && failed > 0) {
          setUploadError('Não foi possível enviar a imagem. Tente novamente.')
        } else if (failed > 0) {
          setUploadError('Algumas imagens não puderam ser enviadas.')
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
    imageHandlersRef.current = {
      isEnabled: () => Boolean(editor && userId),
      insertImagesAtCursor: async (files) => insertImagesFromFiles(files),
      insertImagesAtPosition: async (files, position) => insertImagesFromFiles(files, position),
    }
  }, [editor, userId, insertImagesFromFiles])

  const processRichDocumentPaste = useCallback(
    async (clipboardData: DataTransfer) => {
      if (!editor || !userId) return

      const html = clipboardData.getData('text/html')
      if (!html.trim()) return

      setIsUploadingImage(true)
      setUploadError(null)

      const insertFallback = () => {
        const rawHtml = clipboardData.getData('text/html').trim()
        if (rawHtml) {
          editor.chain().focus().insertContent(rawHtml).run()
          return true
        }

        const plain = clipboardData.getData('text/plain').trim()
        if (plain) {
          const paragraphs = plain
            .split(/\n{2,}/)
            .map((block) => block.trim())
            .filter(Boolean)
            .map((block) => ({
              type: 'paragraph' as const,
              content: [{ type: 'text' as const, text: block }],
            }))
          editor.chain().focus().insertContent(paragraphs).run()
          return true
        }

        return false
      }

      try {
        const processedHtml = await processPasteHtml(html, clipboardData, async (file, altText) => {
          const asset = await uploadMedia(file, userId, altText ?? file.name)
          return { publicUrl: asset.public_url, originalName: asset.original_name }
        })

        editor.chain().focus().insertContent(processedHtml).run()

        const currentJson = editor.getJSON() as Record<string, unknown>
        const withVideos = transformVideoLinksInContent(currentJson)
        if (JSON.stringify(currentJson) !== JSON.stringify(withVideos)) {
          editor.commands.setContent(withVideos, { emitUpdate: false })
        }

        await replaceDataUrlImagesInEditor(editor, userId)
      } catch (error) {
        console.error('[paste] Rich paste failed, trying fallback', error)
        if (!insertFallback()) {
          setUploadError('Não foi possível colar o conteúdo. Tente colar apenas o texto ou em partes menores.')
        }
      } finally {
        setIsUploadingImage(false)
      }
    },
    [editor, userId],
  )

  useEffect(() => {
    processRichPasteRef.current = processRichDocumentPaste
  }, [processRichDocumentPaste])

  useEffect(() => {
    if (!editor) return

    insertVideoEmbedRef.current = (url: string) => {
      const parsed = parseVideoEmbedUrl(url)
      if (!parsed) return

      editor
        .chain()
        .focus()
        .insertVideoEmbed({
          src: parsed.embedSrc,
          href: parsed.href,
          provider: parsed.provider,
        })
        .run()
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const normalized = transformVideoLinksInContent(content)
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(normalized)) {
      editor.commands.setContent(normalized)
    }
  }, [content, editor])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await insertImagesFromFiles([file])
  }

  const handleWrapperDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!userId || !event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    setIsFileDragOver(true)
  }

  const handleWrapperDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) return
    setIsFileDragOver(false)
  }

  const handleWrapperDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!userId || !event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
  }

  const handleWrapperDrop = () => {
    setIsFileDragOver(false)
  }

  if (!editor) return null

  return (
    <div
      className={`${styles.wrapper} ${isFileDragOver ? styles.wrapperDragOver : ''}`}
      onDragEnter={handleWrapperDragEnter}
      onDragLeave={handleWrapperDragLeave}
      onDragOver={handleWrapperDragOver}
      onDrop={handleWrapperDrop}
    >
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
            aria-busy={isUploadingImage}
            title="Salva na biblioteca de mídia e insere no conteúdo. Também funciona ao colar ou arrastar imagens."
          >
            {isUploadingImage ? (
              <>
                <span className={styles.uploadSpinner} aria-hidden="true" />
                Enviando…
              </>
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
            Cole, arraste ou envie imagens. Links de YouTube/Vimeo viram vídeo incorporado.
          </span>
        )}
      </div>

      <RichTextToolbar editor={editor} onAiImproveRequest={onAiImproveRequest} />
      <div className={styles.editorScrollArea}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
