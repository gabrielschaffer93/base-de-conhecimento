import { Button } from '@/components/ui/Button'
import {
  PostArticlePreview,
  type PostArticlePreviewData,
} from '@/components/posts/PostArticlePreview'
import { BrandLogo } from '@/components/layout/BrandLogo'
import publicLayoutStyles from '@/components/layout/PublicLayout.module.css'
import styles from './PostPreviewModal.module.css'

interface PostPreviewModalProps {
  open: boolean
  onClose: () => void
  post: PostArticlePreviewData
}

export function PostPreviewModal({ open, onClose, post }: PostPreviewModalProps) {
  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <div>
            <h2 className={styles.dialogTitle}>Prévia do artigo</h2>
            <p className={styles.dialogSubtitle}>Visualização exatamente como no site público</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className={styles.siteFrame}>
          <header className={publicLayoutStyles.header}>
            <div className={publicLayoutStyles.headerInner}>
              <BrandLogo asLink={false} size="sm" />
              <nav className={`${publicLayoutStyles.nav} ${styles.previewNav}`} aria-hidden="true">
                <span>Início</span>
                <span>Buscar</span>
              </nav>
            </div>
          </header>

          <main className={styles.siteMain}>
            <PostArticlePreview post={post} linkCategory={false} />
          </main>

          <footer className={publicLayoutStyles.footer}>
            <div className={publicLayoutStyles.footerInner}>
              <p>© {new Date().getFullYear()} Loft. Todos os direitos reservados.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
