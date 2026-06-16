import { Link } from 'react-router-dom'
import type { Category } from '@/types/database'
import styles from './TopicCategoryCard.module.css'

const TOPIC_ICONS = [
  ( // clock
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  ( // finance
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  ( // settings
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15.5 2h-7L9.7 6a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.9 7.9 0 0 0-.1 1 7.9 7.9 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1L12.5 22h7l-.3-4a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ( // integrations
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 9h11M4 15h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M18 9l3-2-3-2M18 15l3 2-3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ( // code
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 8 4 12l4 4M16 8l4 4-4 4M14 6l-4 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ( // security
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v6c0 4.2 3 7.4 7 8 4-.6 7-3.8 7-8V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5 11.5 14.5 15 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
] as const

function TopicIcon({ index }: { index: number }) {
  return <span className={styles.iconWrap}>{TOPIC_ICONS[index % TOPIC_ICONS.length]}</span>
}

interface TopicCategoryCardProps {
  category: Category
  index: number
}

export function TopicCategoryCard({ category, index }: TopicCategoryCardProps) {
  const description =
    category.description?.trim() ||
    `Explore guias e documentação sobre ${category.name.toLowerCase()}.`

  return (
    <Link to={`/categorias/${category.slug}`} className={styles.card}>
      <TopicIcon index={index} />
      <h3>{category.name}</h3>
      <p>{description}</p>
    </Link>
  )
}
