import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { formatDashboardNumber } from '@/lib/utils'
import styles from './DashboardRankedList.module.css'

export interface DashboardRankedListItem {
  key: string
  label: string
  value: number
  href?: string
  meta?: string
}

interface DashboardRankedListProps {
  title: string
  items: DashboardRankedListItem[]
  emptyMessage: string
  valueLabel?: string
}

export function DashboardRankedList({
  title,
  items,
  emptyMessage,
  valueLabel = 'ocorrências',
}: DashboardRankedListProps) {
  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ol className={styles.list}>
          {items.map((item, index) => (
            <li key={item.key} className={styles.item}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.content}>
                {item.href ? (
                  <Link to={item.href} className={styles.labelLink}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={styles.label}>{item.label}</span>
                )}
                {item.meta && <span className={styles.meta}>{item.meta}</span>}
              </div>
              <span className={styles.value}>
                {formatDashboardNumber(item.value)} {valueLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
