import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { RichTextViewer } from '@/components/editor/RichTextViewer'
import type { AiImproveProgress } from '@/features/ai/aiContentService'
import styles from './AiContentPreviewModal.module.css'

interface AiContentPreviewModalProps {
  open: boolean
  onClose: () => void
  beforeContent: Record<string, unknown>
  afterContent: Record<string, unknown> | null
  isLoading: boolean
  progress: AiImproveProgress | null
  error: string | null
  onApply: () => void
  onSimplify: () => void
  onCustomImprove: (instruction: string) => void
}

export function AiContentPreviewModal({
  open,
  onClose,
  beforeContent,
  afterContent,
  isLoading,
  progress,
  error,
  onApply,
  onSimplify,
  onCustomImprove,
}: AiContentPreviewModalProps) {
  const [customInstruction, setCustomInstruction] = useState('')
  const [mobileTab, setMobileTab] = useState<'before' | 'after'>('after')

  if (!open) return null

  const handleCustomSubmit = () => {
    const trimmed = customInstruction.trim()
    if (!trimmed) return
    onCustomImprove(trimmed)
    setCustomInstruction('')
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <div>
            <h2 className={styles.dialogTitle}>Melhorar com IA</h2>
            <p className={styles.dialogSubtitle}>
              Compare a versão atual com a sugestão da IA antes de aplicar
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Fechar
          </Button>
        </div>

        {isLoading && (
          <div className={styles.loadingBar}>
            <Spinner size="sm" />
            <span>
              {progress
                ? `Processando ${progress.sectionLabel} (${progress.currentSection}/${progress.totalSections})… Pode demorar um pouco.`
                : 'Gerando sugestão… Pode levar até 1 minuto.'}
            </span>
          </div>
        )}

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.mobileTabs} role="tablist" aria-label="Comparação">
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'before'}
            className={`${styles.mobileTab} ${mobileTab === 'before' ? styles.mobileTabActive : ''}`}
            onClick={() => setMobileTab('before')}
          >
            Antes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'after'}
            className={`${styles.mobileTab} ${mobileTab === 'after' ? styles.mobileTabActive : ''}`}
            onClick={() => setMobileTab('after')}
          >
            Depois
          </button>
        </div>

        <div className={styles.compareGrid}>
          <section
            className={`${styles.panel} ${mobileTab === 'before' ? styles.panelVisible : styles.panelHiddenMobile}`}
            aria-label="Conteúdo atual"
          >
            <h3 className={styles.panelTitle}>Antes</h3>
            <div className={styles.panelBody}>
              <RichTextViewer content={beforeContent} />
            </div>
          </section>

          <section
            className={`${styles.panel} ${mobileTab === 'after' ? styles.panelVisible : styles.panelHiddenMobile}`}
            aria-label="Sugestão da IA"
          >
            <h3 className={styles.panelTitle}>Depois</h3>
            <div className={styles.panelBody}>
              {afterContent ? (
                <RichTextViewer content={afterContent} />
              ) : (
                <p className={styles.placeholder}>
                  {isLoading ? 'Aguardando sugestão…' : 'Nenhuma sugestão disponível.'}
                </p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.actions}>
          <div className={styles.customField}>
            <Textarea
              label="Como deseja que eu melhore?"
              value={customInstruction}
              onChange={(event) => setCustomInstruction(event.target.value)}
              placeholder="Ex.: torne mais objetivo, use tom informal, encurte parágrafos longos…"
              rows={2}
              disabled={isLoading}
            />
            <Button
              variant="secondary"
              onClick={handleCustomSubmit}
              disabled={isLoading || !customInstruction.trim() || !afterContent}
            >
              Melhorar com instrução
            </Button>
          </div>

          <div className={styles.actionButtons}>
            <Button
              variant="secondary"
              onClick={onSimplify}
              disabled={isLoading || !afterContent}
            >
              Não gostei, simplifique
            </Button>
            <Button onClick={onApply} disabled={isLoading || !afterContent}>
              Gostei, aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
