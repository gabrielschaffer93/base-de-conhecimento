import { Link } from 'react-router-dom'
import { HERO_VISUAL_PATH } from '@/config/publicSite'
import { formatRelativeTime } from '@/lib/utils'
import type { PostWithRelations } from '@/types/database'
import styles from './HeroBrowserMockup.module.css'

interface HeroBrowserMockupProps {
  latestPost?: PostWithRelations | null
}

function getBadgeLabel(createdAt: string): string {
  const created = new Date(createdAt)
  const now = new Date()
  const isToday =
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()

  return isToday ? 'Atualizado hoje' : `Atualizado ${formatRelativeTime(createdAt)}`
}

export function HeroBrowserMockup({ latestPost }: HeroBrowserMockupProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.mockup}>
        <div className={styles.chrome}>
          <div className={styles.dots} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className={styles.screen}>
          <img src={HERO_VISUAL_PATH} alt="" className={styles.screenImage} />
        </div>
      </div>

      {latestPost && (
        <Link to={`/artigos/${latestPost.slug}`} className={styles.badge}>
          <span className={styles.badgeIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M8 12.5l2.5 2.5L16 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={styles.badgeText}>
            <strong>{latestPost.title}</strong>
            <span>{getBadgeLabel(latestPost.created_at)}</span>
          </span>
        </Link>
      )}
    </div>
  )
}
