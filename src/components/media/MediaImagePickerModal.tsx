import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import {
  fetchMediaAssets,
  MEDIA_IMAGE_ACCEPT,
  uploadMedia,
} from '@/features/media/mediaService'
import type { MediaAsset } from '@/types/database'
import styles from './MediaImagePickerModal.module.css'

interface MediaImagePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  userId?: string
}

export function MediaImagePickerModal({
  open,
  onClose,
  onSelect,
  userId,
}: MediaImagePickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadAssets = useCallback(() => {
    setIsLoading(true)
    fetchMediaAssets('image')
      .then(setAssets)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!open) return

    loadAssets()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, loadAssets])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId) return

    setIsUploading(true)
    try {
      const asset = await uploadMedia(file, userId)
      onSelect(asset.public_url)
      onClose()
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const handleSelect = (asset: MediaAsset) => {
    onSelect(asset.public_url)
    onClose()
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-picker-title"
      >
        <div className={styles.header}>
          <h2 id="media-picker-title" className={styles.title}>
            Selecionar imagem
          </h2>
          <div className={styles.headerActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept={MEDIA_IMAGE_ACCEPT}
              hidden
              onChange={(event) => void handleUpload(event)}
              disabled={!userId || isUploading}
            />
            <Button
              type="button"
              size="sm"
              isLoading={isUploading}
              disabled={!userId}
              onClick={() => fileInputRef.current?.click()}
            >
              Enviar arquivo
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>

        <div className={styles.body}>
          {isLoading ? (
            <Spinner />
          ) : assets.length === 0 ? (
            <p className={styles.emptyMessage}>
              Nenhuma imagem na biblioteca. Envie um arquivo para usar como capa.
            </p>
          ) : (
            <div className={styles.grid}>
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  className={styles.assetBtn}
                  onClick={() => handleSelect(asset)}
                >
                  <img
                    src={asset.public_url}
                    alt={asset.alt_text ?? asset.original_name}
                    className={styles.thumb}
                  />
                  <span className={styles.assetName}>{asset.original_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
