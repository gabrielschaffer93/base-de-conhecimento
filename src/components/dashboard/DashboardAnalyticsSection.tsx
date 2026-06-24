import type { ReactNode } from 'react'
import styles from './DashboardAnalyticsSection.module.css'

interface DashboardAnalyticsSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function DashboardAnalyticsSection({
  title,
  description,
  children,
}: DashboardAnalyticsSectionProps) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      {children}
    </section>
  )
}
