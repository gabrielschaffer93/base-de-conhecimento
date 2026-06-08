import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { deleteMedia, fetchMediaAssets, uploadMedia } from '@/features/media/mediaService'
import { formatFileSize } from '@/lib/utils'
import type { MediaAsset } from '@/types/database'
import styles from './MediaPage.module.css'

export function MediaPage() {
  const { user } = useAuth()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')

  useEffect(() => {
    fetchMediaAssets(filter === 'all' ? undefined : filter)
      .then(setAssets)
      .finally(() => setIsLoading(false))
  }, [filter])

  const reload = useCallback(() => {
    setIsLoading(true)
    fetchMediaAssets(filter === 'all' ? undefined : filter)
      .then(setAssets)
      .finally(() => setIsLoading(false))
  }, [filter])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !user) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file, user.id)
      }
      reload()
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (asset: MediaAsset) => {
    if (!window.confirm(`Excluir "${asset.original_name}"?`)) return
    await deleteMedia(asset)
    reload()
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('URL copiada!')
  }

  return (
    <div>
      <PageHeader
        title="Biblioteca de mídia"
        description="Imagens e vídeos para os artigos"
        actions={
          <label className={styles.uploadBtn}>
            <input type="file" accept="image/*,video/*" multiple hidden onChange={handleUpload} disabled={isUploading} />
            <span className={styles.uploadLabel}>{isUploading ? 'Enviando…' : 'Enviar arquivos'}</span>
          </label>
        }
      />

      <div className={styles.filters}>
        {(['all', 'image', 'video'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todos' : f === 'image' ? 'Imagens' : 'Vídeos'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : assets.length === 0 ? (
        <EmptyState title="Nenhum arquivo" description="Envie imagens ou vídeos para usar nos artigos." />
      ) : (
        <div className={styles.grid}>
          {assets.map((asset) => (
            <Card key={asset.id} className={styles.assetCard}>
              {asset.type === 'image' ? (
                <img src={asset.public_url} alt={asset.alt_text ?? asset.original_name} />
              ) : (
                <video src={asset.public_url} controls className={styles.video} />
              )}
              <div className={styles.assetInfo}>
                <strong title={asset.original_name}>{asset.original_name}</strong>
                <span>{formatFileSize(asset.size_bytes)}</span>
                <div className={styles.assetActions}>
                  <Button variant="ghost" size="sm" onClick={() => copyUrl(asset.public_url)}>
                    Copiar URL
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(asset)}>
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
