import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { formatFileSize } from '@/lib/utils'
import type { MediaAsset } from '@/types/database'
import styles from './MediaPreviewModal.module.css'

interface MediaPreviewModalProps {
  asset: MediaAsset | null
  onClose: () => void
}

export function MediaPreviewModal({ asset, onClose }: MediaPreviewModalProps) {
  useEffect(() => {
    if (!asset) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [asset, onClose])

  if (!asset) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-preview-title"
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id="media-preview-title" className={styles.title}>
              {asset.original_name}
            </h2>
            <p className={styles.meta}>{formatFileSize(asset.size_bytes)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className={styles.previewArea}>
          {asset.type === 'image' ? (
            <img
              src={asset.public_url}
              alt={asset.alt_text ?? asset.original_name}
              className={styles.previewImage}
            />
          ) : (
            <video src={asset.public_url} controls autoPlay className={styles.previewVideo} />
          )}
        </div>
      </div>
    </div>
  )
}
