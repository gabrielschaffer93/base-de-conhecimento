import { Link } from 'react-router-dom'
import { POST_PLACEHOLDER_IMAGE_PATH } from '@/config/publicSite'
import {
  estimateReadingTimeMinutes,
  findPostImageUrl,
  getPostContentSignals,
  getSearchResultBadgeLabel,
} from '@/lib/postContent'
import { formatCardDate } from '@/lib/utils'
import type { PostWithRelations } from '@/types/database'
import styles from './RelatedPostMiniCard.module.css'

interface RelatedPostMiniCardProps {
  post: PostWithRelations
}

export function RelatedPostMiniCard({ post }: RelatedPostMiniCardProps) {
  const imageUrl = findPostImageUrl(post.content, post.featured_image_url)
  const readingTime = estimateReadingTimeMinutes(post.content, post.excerpt)
  const publishedLabel = formatCardDate(post.published_at ?? post.created_at)
  const contentSignals = getPostContentSignals(post.content, post.title, post.slug, post.excerpt)
  const contentLabel = getSearchResultBadgeLabel(contentSignals, post.category?.name)
  const badgeClass = contentSignals.hasVideo
    ? styles.mediaBadgeVideo
    : contentSignals.hasTutorial
      ? styles.mediaBadgeTutorial
      : styles.mediaBadgeArticle

  return (
    <article className={styles.card}>
      <Link to={`/artigos/${post.slug}`} className={styles.mediaLink}>
        <div className={styles.media}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className={styles.image} />
          ) : (
            <div className={styles.imageFallback} aria-hidden="true">
              <img src={POST_PLACEHOLDER_IMAGE_PATH} alt="" className={styles.placeholderIcon} />
            </div>
          )}
          <span className={`${styles.mediaBadge} ${badgeClass}`}>{contentLabel}</span>
        </div>
      </Link>

      <div className={styles.content}>
        <Link to={`/artigos/${post.slug}`} className={styles.title}>
          {post.title}
        </Link>
        <div className={styles.meta}>
          <time dateTime={post.published_at ?? post.created_at}>{publishedLabel}</time>
          <span className={styles.metaDot} aria-hidden="true">
            ·
          </span>
          <span className={styles.readTime}>{readingTime} min</span>
        </div>
      </div>
    </article>
  )
}
