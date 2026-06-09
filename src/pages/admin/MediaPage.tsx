import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { deleteMedia, fetchMediaAssets, MEDIA_IMAGE_ACCEPT, MEDIA_IMAGE_EXTENSIONS, uploadMedia } from '@/features/media/mediaService'
import { formatFileSize, getFileExtension } from '@/lib/utils'
import type { MediaAsset } from '@/types/database'
import { MediaPreviewModal } from '@/components/media/MediaPreviewModal'
import styles from './MediaPage.module.css'

type MediaTypeFilter = 'all' | 'image' | 'video'

function matchesTypeFilter(asset: MediaAsset, typeFilter: MediaTypeFilter): boolean {
  return typeFilter === 'all' || asset.type === typeFilter
}

function matchesSearch(asset: MediaAsset, searchQuery: string): boolean {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return true

  return (
    asset.original_name.toLowerCase().includes(query) ||
    asset.filename.toLowerCase().includes(query)
  )
}

export function MediaPage() {
  const { user } = useAuth()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('all')
  const [extensionFilter, setExtensionFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null)

  const reload = useCallback(() => {
    setIsLoading(true)
    fetchMediaAssets()
      .then(setAssets)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (typeFilter === 'video') setExtensionFilter('')
  }, [typeFilter])

  const typeFilteredAssets = useMemo(
    () => assets.filter((asset) => matchesTypeFilter(asset, typeFilter)),
    [assets, typeFilter],
  )

  const showExtensionFilters = typeFilter !== 'video'

  const filteredAssets = useMemo(() => {
    return typeFilteredAssets.filter((asset) => {
      if (extensionFilter && getFileExtension(asset.original_name) !== extensionFilter) {
        return false
      }
      return matchesSearch(asset, searchQuery)
    })
  }, [typeFilteredAssets, extensionFilter, searchQuery])

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

  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || extensionFilter !== ''
  const emptyDescription = hasActiveFilters
    ? 'Nenhum arquivo corresponde aos filtros aplicados.'
    : 'Envie imagens ou vídeos para usar nos artigos.'

  return (
    <div>
      <MediaPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} />

      <PageHeader
        title="Biblioteca de mídia"
        description="Imagens e vídeos para os artigos"
        actions={
          <label className={styles.uploadBtn}>
            <input type="file" accept={`${MEDIA_IMAGE_ACCEPT},video/*`} multiple hidden onChange={handleUpload} disabled={isUploading} />
            <span className={styles.uploadLabel}>{isUploading ? 'Enviando…' : 'Enviar arquivos'}</span>
          </label>
        }
      />

      <Card className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <Input
            name="search"
            placeholder="Buscar por nome do arquivo…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchField}
          />

          <div className={styles.filters}>
            {(['all', 'image', 'video'] as const).map((filterValue) => (
              <button
                key={filterValue}
                type="button"
                className={`${styles.filterBtn} ${typeFilter === filterValue ? styles.filterActive : ''}`}
                onClick={() => setTypeFilter(filterValue)}
              >
                {filterValue === 'all' ? 'Todos' : filterValue === 'image' ? 'Imagens' : 'Vídeos'}
              </button>
            ))}
          </div>
        </div>

        {showExtensionFilters && (
          <div className={styles.extensionFilters}>
            <span className={styles.extensionLabel}>Formato</span>
            <button
              type="button"
              className={`${styles.filterBtn} ${styles.filterBtnSm} ${extensionFilter === '' ? styles.filterActive : ''}`}
              onClick={() => setExtensionFilter('')}
            >
              Todos
            </button>
            {MEDIA_IMAGE_EXTENSIONS.map((extension) => (
              <button
                key={extension}
                type="button"
                className={`${styles.filterBtn} ${styles.filterBtnSm} ${extensionFilter === extension ? styles.filterActive : ''}`}
                onClick={() => setExtensionFilter(extension)}
              >
                .{extension}
              </button>
            ))}
          </div>
        )}
      </Card>

      {isLoading ? (
        <Spinner />
      ) : assets.length === 0 ? (
        <EmptyState title="Nenhum arquivo" description="Envie imagens ou vídeos para usar nos artigos." />
      ) : filteredAssets.length === 0 ? (
        <EmptyState title="Nenhum arquivo encontrado" description={emptyDescription} />
      ) : (
        <div className={styles.grid}>
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className={styles.assetCard}>
              {asset.type === 'image' ? (
                <button
                  type="button"
                  className={`${styles.thumbWrap} ${styles.thumbClickable}`}
                  onClick={() => setPreviewAsset(asset)}
                  aria-label={`Ampliar ${asset.original_name}`}
                >
                  <img
                    src={asset.public_url}
                    alt={asset.alt_text ?? asset.original_name}
                    className={styles.thumb}
                  />
                </button>
              ) : (
                <div className={styles.thumbWrap}>
                  <video src={asset.public_url} controls className={styles.video} />
                </div>
              )}
              <div className={styles.assetInfo}>
                <p className={styles.assetName} title={asset.original_name}>
                  {asset.original_name}
                </p>
                <p className={styles.assetMeta}>{formatFileSize(asset.size_bytes)}</p>
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
