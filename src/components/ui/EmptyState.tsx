import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
