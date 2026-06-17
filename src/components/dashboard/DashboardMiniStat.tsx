import { Card } from '@/components/ui/Card'
import { formatDashboardNumber } from '@/lib/utils'
import styles from './DashboardMiniStat.module.css'

interface DashboardMiniStatProps {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
  hint?: string
}

export function DashboardMiniStat({ label, value, tone = 'default', hint }: DashboardMiniStatProps) {
  return (
    <Card className={styles.card}>
      <span className={styles.label}>{label}</span>
      <strong className={`${styles.value} ${styles[`tone_${tone}`]}`}>{value}</strong>
      {hint && <span className={styles.hint}>{hint}</span>}
    </Card>
  )
}

export function formatReadingDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  if (seconds < 60) return `${formatDashboardNumber(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return remainder > 0 ? `${minutes} min ${remainder}s` : `${minutes} min`
}
