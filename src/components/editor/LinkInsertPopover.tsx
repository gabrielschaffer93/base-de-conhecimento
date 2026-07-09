import { useEffect, useId, useRef } from 'react'
import styles from './RichTextEditor.module.css'

const URL_INPUT_ID = 'editor-link-url-input'

interface LinkInsertPopoverProps {
  initialUrl: string
  canRemove: boolean
  onConfirm: (url: string) => void
  onRemove: () => void
  onClose: () => void
}

function normalizeLinkUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function LinkInsertPopover({
  initialUrl,
  canRemove,
  onConfirm,
  onRemove,
  onClose,
}: LinkInsertPopoverProps) {
  const formId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onConfirm(normalizeLinkUrl(String(formData.get('url') ?? '')))
  }

  return (
    <div
      className={styles.linkPopover}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <p id={`${formId}-title`} className={styles.linkPopoverTitle}>
        Inserir link
      </p>

      <form className={styles.linkPopoverForm} onSubmit={handleSubmit}>
        <label htmlFor={URL_INPUT_ID} className={styles.linkPopoverLabel}>
          URL
        </label>
        <input
          ref={inputRef}
          id={URL_INPUT_ID}
          name="url"
          type="url"
          className={styles.linkPopoverInput}
          defaultValue={initialUrl}
          placeholder="https://exemplo.com"
          autoComplete="off"
          inputMode="url"
        />

        <div className={styles.linkPopoverActions}>
          {canRemove && (
            <button type="button" className={styles.linkPopoverRemoveBtn} onClick={onRemove}>
              Remover
            </button>
          )}
          <div className={styles.linkPopoverPrimaryActions}>
            <button type="button" className={styles.linkPopoverCancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.linkPopoverApplyBtn}>
              Aplicar
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
