import { Card } from '@/components/ui/Card'
import type { DashboardStats } from '@/types/database'
import styles from './DashboardStatCard.module.css'

type StatIcon = 'posts' | 'published' | 'drafts' | 'users'

interface DashboardStatCardProps {
  label: string
  value: number
  icon: StatIcon
  percentOfTotal?: number
  sublinePrefix?: string
  sublinePercent?: number
}

function StatIconGraphic({ icon }: { icon: StatIcon }) {
  switch (icon) {
    case 'posts':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M16 4v4h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'published':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M8 12.5l2.5 2.5L16 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'drafts':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M22 19v-1a3.5 3.5 0 0 0-2.8-3.4M16 3.6a3.5 3.5 0 0 1 0 6.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
  }
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100)
}

export function DashboardStatCard({
  label,
  value,
  icon,
  percentOfTotal,
  sublinePrefix,
  sublinePercent,
}: DashboardStatCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.iconWrap} ${styles[`icon_${icon}`]}`}>
          <StatIconGraphic icon={icon} />
        </span>
      </div>
      <div className={styles.body}>
        <div className={styles.valueRow}>
          <span className={styles.value}>{value}</span>
          {percentOfTotal !== undefined && (
            <span className={styles.percent}>{percentOfTotal}%</span>
          )}
        </div>
        {sublinePrefix !== undefined && sublinePercent !== undefined && (
          <p className={styles.subline}>
            {sublinePrefix} · <span className={styles.percent}>{sublinePercent}% do total</span>
          </p>
        )}
      </div>
    </Card>
  )
}

export function buildDashboardStatCards(stats: DashboardStats) {
  const archivedLabel =
    stats.archivedPosts === 1 ? '1 arquivado' : `${stats.archivedPosts} arquivados`

  return [
    {
      label: 'Total de posts',
      value: stats.totalPosts,
      icon: 'posts' as const,
      sublinePrefix: archivedLabel,
      sublinePercent: pct(stats.archivedPosts, stats.totalPosts),
    },
    {
      label: 'Publicados',
      value: stats.publishedPosts,
      icon: 'published' as const,
      percentOfTotal: pct(stats.publishedPosts, stats.totalPosts),
    },
    {
      label: 'Rascunhos',
      value: stats.draftPosts,
      icon: 'drafts' as const,
      percentOfTotal: pct(stats.draftPosts, stats.totalPosts),
    },
    {
      label: 'Usuários ativos',
      value: stats.activeUsers,
      icon: 'users' as const,
      percentOfTotal: pct(stats.activeUsers, stats.totalUsers),
    },
  ]
}
