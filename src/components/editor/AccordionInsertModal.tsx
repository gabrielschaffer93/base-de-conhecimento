import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import styles from './AccordionInsertModal.module.css'

const TITLE_INPUT_ID = 'accordion-title-input'

interface AccordionInsertModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (title: string) => void
}

export function AccordionInsertModal({ open, onClose, onConfirm }: AccordionInsertModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    requestAnimationFrame(() => {
      const input = document.getElementById(TITLE_INPUT_ID) as HTMLInputElement | null
      input?.focus()
      input?.select()
    })

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const title = String(formData.get('title') ?? '').trim()
    onConfirm(title || 'Título da seção')
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accordion-insert-title"
      >
        <h2 id="accordion-insert-title" className={styles.title}>
          Nova seção expansível
        </h2>
        <p className={styles.description}>
          Informe o título que aparecerá no cabeçalho. Depois de inserir, clique dentro da área
          de conteúdo para digitar o texto.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            id={TITLE_INPUT_ID}
            name="title"
            label="Título da seção"
            defaultValue="Título da seção"
            placeholder="Ex.: Cadastro manual via CRM"
            autoComplete="off"
          />

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Inserir seção</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
