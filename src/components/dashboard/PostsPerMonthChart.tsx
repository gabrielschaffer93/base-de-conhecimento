import { Card } from '@/components/ui/Card'
import { formatDashboardNumber } from '@/lib/utils'
import type { PostsPerMonthPoint } from '@/types/database'
import styles from './PostsPerMonthChart.module.css'

interface PostsPerMonthChartProps {
  data: PostsPerMonthPoint[]
}

export function PostsPerMonthChart({ data }: PostsPerMonthChartProps) {
  const maxCount = Math.max(...data.map((point) => point.count), 1)
  const totalInRange = data.reduce((sum, point) => sum + point.count, 0)
  const chartSummary = data
    .map((point) => `${point.label}: ${point.count}`)
    .join(', ')

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Posts por mês</h3>
          <p className={styles.subtitle}>
            Últimos 12 meses · {formatDashboardNumber(totalInRange)} posts no período · data de
            publicação
          </p>
        </div>
      </div>

      {totalInRange === 0 ? (
        <p className={styles.empty}>Nenhum post publicado nos últimos 12 meses.</p>
      ) : (
        <div
          className={styles.chart}
          role="img"
          aria-label={`Gráfico de posts criados por mês. ${chartSummary}`}
        >
          {data.map((point) => {
            const heightPercent = Math.max((point.count / maxCount) * 100, point.count > 0 ? 8 : 0)

            return (
              <div key={point.monthKey} className={styles.column}>
                <span className={styles.value}>{formatDashboardNumber(point.count)}</span>
                <div className={styles.barTrack} aria-hidden="true">
                  <div
                    className={styles.barFill}
                    style={{ height: `${heightPercent}%` }}
                    title={`${point.label}: ${point.count} posts`}
                  />
                </div>
                <span className={styles.label}>{point.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
