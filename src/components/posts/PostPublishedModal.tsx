import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import styles from './PostPublishedModal.module.css'

interface PostPublishedModalProps {
  open: boolean
  onClose: () => void
  title: string
  slug: string
}

export function PostPublishedModal({ open, onClose, title, slug }: PostPublishedModalProps) {
  if (!open) return null

  const publicPath = `/artigos/${slug}`

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-published-title"
      >
        <div className={styles.iconWrap} aria-hidden="true">
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 12.5l2.5 2.5L16 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="post-published-title" className={styles.title}>
          Post publicado!
        </h2>
        <p className={styles.message}>
          O artigo <strong>{title}</strong> já está disponível no site público.
        </p>

        <div className={styles.linkBox}>
          <span className={styles.linkLabel}>Link do artigo</span>
          <Link to={publicPath} target="_blank" rel="noopener noreferrer" className={styles.link}>
            {publicPath}
          </Link>
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => window.open(publicPath, '_blank', 'noopener,noreferrer')}
          >
            Ver no site
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}
