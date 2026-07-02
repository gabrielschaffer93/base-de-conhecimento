import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import {
  deleteMedia,
  deleteMediaBatch,
  fetchMediaAssets,
  MEDIA_IMAGE_ACCEPT,
  MEDIA_IMAGE_EXTENSIONS,
  uploadMedia,
} from '@/features/media/mediaService'
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

function matchesDateRange(asset: MediaAsset, dateFrom: string, dateTo: string): boolean {
  if (!dateFrom && !dateTo) return true

  const created = new Date(asset.created_at)

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`)
    if (created < from) return false
  }

  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`)
    if (created > to) return false
  }

  return true
}

function formatUploadedAt(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function MediaPage() {
  const { user } = useAuth()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeletingBatch, setIsDeletingBatch] = useState(false)
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('all')
  const [extensionFilter, setExtensionFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
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

  useEffect(() => {
    setSelectedIds(new Set())
  }, [typeFilter, extensionFilter, searchQuery, dateFrom, dateTo])

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
      if (!matchesDateRange(asset, dateFrom, dateTo)) {
        return false
      }
      return matchesSearch(asset, searchQuery)
    })
  }, [typeFilteredAssets, extensionFilter, searchQuery, dateFrom, dateTo])

  const selectedAssets = useMemo(
    () => filteredAssets.filter((asset) => selectedIds.has(asset.id)),
    [filteredAssets, selectedIds],
  )

  const allFilteredSelected =
    filteredAssets.length > 0 && filteredAssets.every((asset) => selectedIds.has(asset.id))

  const toggleSelectionMode = () => {
    setSelectionMode((current) => {
      if (current) setSelectedIds(new Set())
      return !current
    })
  }

  const toggleAssetSelection = (assetId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(assetId)) next.delete(assetId)
      else next.add(assetId)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredAssets.map((asset) => asset.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

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

  const handleDeleteSelected = async () => {
    if (selectedAssets.length === 0) return

    const count = selectedAssets.length
    const confirmed = window.confirm(
      `Excluir ${count} arquivo${count > 1 ? 's' : ''}? Esta ação não pode ser desfeita.`,
    )
    if (!confirmed) return

    setIsDeletingBatch(true)
    try {
      const { deleted, failed } = await deleteMediaBatch(selectedAssets)
      if (failed > 0) {
        alert(`${deleted} arquivo(s) excluído(s). ${failed} falha(s) ao excluir.`)
      }
      setSelectedIds(new Set())
      setSelectionMode(false)
      reload()
    } finally {
      setIsDeletingBatch(false)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('URL copiada!')
  }

  const clearDateFilters = () => {
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    extensionFilter !== '' ||
    dateFrom !== '' ||
    dateTo !== ''

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
          <div className={styles.headerActions}>
            <Button
              variant={selectionMode ? 'secondary' : 'ghost'}
              onClick={toggleSelectionMode}
            >
              {selectionMode ? 'Cancelar seleção' : 'Selecionar'}
            </Button>
            <label className={styles.uploadBtn}>
              <input
                type="file"
                accept={`${MEDIA_IMAGE_ACCEPT},video/*`}
                multiple
                hidden
                onChange={handleUpload}
                disabled={isUploading}
              />
              <span className={styles.uploadLabel}>
                {isUploading ? 'Enviando…' : 'Enviar arquivos'}
              </span>
            </label>
          </div>
        }
      />

      {selectionMode && (
        <Card className={styles.bulkBar}>
          <div className={styles.bulkBarInfo}>
            <strong>{selectedAssets.length}</strong>
            <span>selecionado{selectedAssets.length !== 1 ? 's' : ''}</span>
            {filteredAssets.length > 0 && (
              <span className={styles.bulkBarHint}>
                de {filteredAssets.length} no filtro atual
              </span>
            )}
          </div>
          <div className={styles.bulkBarActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllFiltered}
              disabled={filteredAssets.length === 0 || allFilteredSelected}
            >
              Selecionar todos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selectedAssets.length === 0}
            >
              Limpar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedAssets.length === 0 || isDeletingBatch}
            >
              {isDeletingBatch ? 'Excluindo…' : `Excluir selecionados (${selectedAssets.length})`}
            </Button>
          </div>
        </Card>
      )}

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

        <div className={styles.filterRow}>
          <span className={styles.extensionLabel}>Período</span>
          <span className={styles.dateHint}>De</span>
          <input
            type="date"
            name="dateFrom"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={styles.dateInput}
            aria-label="Data inicial"
          />
          <span className={styles.dateHint}>até</span>
          <input
            type="date"
            name="dateTo"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={styles.dateInput}
            aria-label="Data final"
          />
          {(dateFrom || dateTo) && (
            <button type="button" className={`${styles.filterBtn} ${styles.filterBtnSm}`} onClick={clearDateFilters}>
              Limpar
            </button>
          )}
        </div>

        {showExtensionFilters && (
          <div className={styles.filterRow}>
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
          {filteredAssets.map((asset) => {
            const isSelected = selectedIds.has(asset.id)

            return (
              <Card
                key={asset.id}
                className={`${styles.assetCard} ${isSelected ? styles.assetCardSelected : ''}`}
              >
                {selectionMode && (
                  <label className={styles.selectOverlay}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleAssetSelection(asset.id)}
                      aria-label={`Selecionar ${asset.original_name}`}
                    />
                  </label>
                )}

                {asset.type === 'image' ? (
                  <button
                    type="button"
                    className={`${styles.thumbWrap} ${selectionMode ? styles.thumbSelectable : styles.thumbClickable}`}
                    onClick={() => {
                      if (selectionMode) {
                        toggleAssetSelection(asset.id)
                        return
                      }
                      setPreviewAsset(asset)
                    }}
                    aria-label={
                      selectionMode ? `Selecionar ${asset.original_name}` : `Ampliar ${asset.original_name}`
                    }
                  >
                    <img
                      src={asset.public_url}
                      alt={asset.alt_text ?? asset.original_name}
                      className={styles.thumb}
                    />
                  </button>
                ) : (
                  <div
                    className={`${styles.thumbWrap} ${selectionMode ? styles.thumbSelectable : ''}`}
                    onClick={
                      selectionMode ? () => toggleAssetSelection(asset.id) : undefined
                    }
                    onKeyDown={
                      selectionMode
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              toggleAssetSelection(asset.id)
                            }
                          }
                        : undefined
                    }
                    role={selectionMode ? 'button' : undefined}
                    tabIndex={selectionMode ? 0 : undefined}
                  >
                    <video src={asset.public_url} controls={!selectionMode} className={styles.video} />
                  </div>
                )}

                <div className={styles.assetInfo}>
                  <p className={styles.assetName} title={asset.original_name}>
                    {asset.original_name}
                  </p>
                  <p className={styles.assetMeta}>
                    {formatFileSize(asset.size_bytes)} · {formatUploadedAt(asset.created_at)}
                  </p>
                  {!selectionMode && (
                    <div className={styles.assetActions}>
                      <Button variant="ghost" size="sm" onClick={() => copyUrl(asset.public_url)}>
                        Copiar URL
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(asset)}>
                        Excluir
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
