import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { fetchAdminPostFeedback, type AdminPostFeedbackItem } from '@/features/feedback/feedbackService'
import { getCsatColor } from '@/lib/csatColors'
import { formatDate } from '@/lib/utils'
import styles from './FeedbackPage.module.css'

type FeedbackFilter = 'all' | 'positive' | 'negative' | 'with_comment' | 'with_csat'

export function FeedbackPage() {
  const [items, setItems] = useState<AdminPostFeedbackItem[]>([])
  const [filter, setFilter] = useState<FeedbackFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminPostFeedback()
      .then(setItems)
      .catch(() => setError('Não foi possível carregar o feedback dos artigos.'))
      .finally(() => setIsLoading(false))
  }, [])

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'positive':
        return items.filter((item) => item.vote === 1)
      case 'negative':
        return items.filter((item) => item.vote === -1)
      case 'with_comment':
        return items.filter((item) => item.comment)
      case 'with_csat':
        return items.filter((item) => item.csatScore !== null)
      default:
        return items
    }
  }, [filter, items])

  const stats = useMemo(() => {
    const likes = items.filter((item) => item.vote === 1).length
    const dislikes = items.filter((item) => item.vote === -1).length
    const comments = items.filter((item) => item.comment).length
    const csatItems = items.filter((item) => item.csatScore !== null)
    const avgCsat =
      csatItems.length > 0
        ? csatItems.reduce((sum, item) => sum + (item.csatScore ?? 0), 0) / csatItems.length
        : null

    return { likes, dislikes, comments, total: items.length, avgCsat, csatCount: csatItems.length }
  }, [items])

  if (isLoading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Feedback"
        description="Avaliações CSAT, votos e comentários enviados pelos leitores nos artigos"
      />

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Total de avaliações</span>
          <strong className={styles.statValue}>{stats.total}</strong>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Média CSAT</span>
          <strong className={styles.statValue}>
            {stats.avgCsat !== null ? stats.avgCsat.toFixed(1) : '—'}
          </strong>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Gostei</span>
          <strong className={`${styles.statValue} ${styles.statPositive}`}>{stats.likes}</strong>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Não gostei</span>
          <strong className={`${styles.statValue} ${styles.statNegative}`}>{stats.dislikes}</strong>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statLabel}>Com comentário</span>
          <strong className={styles.statValue}>{stats.comments}</strong>
        </Card>
      </div>

      <Card>
        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === 'with_csat' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('with_csat')}
          >
            Com CSAT
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === 'positive' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('positive')}
          >
            Gostei
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === 'negative' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('negative')}
          >
            Não gostei
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === 'with_comment' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('with_comment')}
          >
            Com comentário
          </button>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {!error && filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum feedback ainda"
            description="As avaliações dos leitores aparecerão aqui quando começarem a votar nos artigos."
          />
        ) : (
          <div className={styles.list}>
            {filteredItems.map((item) => (
              <article key={item.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <div>
                    {item.postSlug ? (
                      <Link to={`/artigos/${item.postSlug}`} className={styles.postLink}>
                        {item.postTitle}
                      </Link>
                    ) : (
                      <strong>{item.postTitle}</strong>
                    )}
                    <p className={styles.itemMeta}>Atualizado em {formatDate(item.updatedAt)}</p>
                  </div>

                  <div className={styles.badges}>
                    {item.csatScore !== null && (
                      <span
                        className={styles.csatBadge}
                        style={{ '--csat-color': getCsatColor(item.csatScore) } as React.CSSProperties}
                      >
                        CSAT {item.csatScore}
                      </span>
                    )}
                    {item.vote !== null && (
                      <span
                        className={`${styles.voteBadge} ${
                          item.vote === 1 ? styles.voteBadgePositive : styles.voteBadgeNegative
                        }`}
                      >
                        {item.vote === 1 ? 'Gostei' : 'Não gostei'}
                      </span>
                    )}
                  </div>
                </div>

                {item.comment ? (
                  <p className={styles.comment}>{item.comment}</p>
                ) : (
                  <p className={styles.noComment}>Sem comentário adicional.</p>
                )}
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
