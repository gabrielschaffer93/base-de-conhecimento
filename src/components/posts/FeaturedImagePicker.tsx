import { useState } from 'react'
import { MediaImagePickerModal } from '@/components/media/MediaImagePickerModal'
import featuredCoverPlaceholder from '@/assets/featured-cover-placeholder.png'
import styles from './FeaturedImagePicker.module.css'

interface FeaturedImagePickerProps {
  value: string | null
  onChange: (url: string | null) => void
  userId?: string
}

function CoverImageIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
      <path
        d="M3 16l5-4 4 3 4-5 5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 7h3v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FeaturedImagePicker({ value, onChange, userId }: FeaturedImagePickerProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  return (
    <div className={styles.field}>
      <span className={styles.label}>Imagem de destaque</span>

      <button
        type="button"
        className={styles.picker}
        onClick={() => setIsPickerOpen(true)}
        aria-label={value ? 'Alterar capa' : 'Selecionar capa'}
      >
        {value ? (
          <>
            <img src={value} alt="" className={styles.preview} />
            <span className={styles.overlay}>
              <CoverImageIcon />
              <span className={styles.overlayText}>Alterar capa</span>
            </span>
          </>
        ) : (
          <>
            <img
              src={featuredCoverPlaceholder}
              alt=""
              className={styles.placeholderBg}
              aria-hidden="true"
            />
            <span className={styles.placeholder}>
              <CoverImageIcon />
              <span className={styles.overlayText}>Selecionar capa</span>
            </span>
          </>
        )}
      </button>

      {value && (
        <button type="button" className={styles.removeBtn} onClick={() => onChange(null)}>
          Remover imagem
        </button>
      )}

      <MediaImagePickerModal
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        userId={userId}
      />
    </div>
  )
}
