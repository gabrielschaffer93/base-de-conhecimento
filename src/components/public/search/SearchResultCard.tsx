import { Link } from 'react-router-dom'
import { POST_PLACEHOLDER_IMAGE_PATH } from '@/config/publicSite'
import { findPostImageUrl, estimateReadingTimeMinutes, getPostContentSignals, getSearchResultBadgeLabel } from '@/lib/postContent'
import { formatCardDate, getPostPreviewText } from '@/lib/utils'
import type { PostWithRelations } from '@/types/database'
import styles from './SearchResultCard.module.css'

interface SearchResultCardProps {
  post: PostWithRelations
}

function getAuthorLabel(post: PostWithRelations): string {
  return post.author?.full_name?.trim() || post.author?.email?.split('@')[0] || 'Equipe Loft'
}

export function SearchResultCard({ post }: SearchResultCardProps) {
  const imageUrl = findPostImageUrl(post.content, post.featured_image_url)
  const previewText = post.excerpt ?? getPostPreviewText(post.content, 200)
  const readingTime = estimateReadingTimeMinutes(post.content, post.excerpt)
  const publishedLabel = formatCardDate(post.published_at ?? post.created_at)
  const contentSignals = getPostContentSignals(post.content, post.title, post.slug, post.excerpt)
  const contentLabel = getSearchResultBadgeLabel(contentSignals, post.category?.name)
  const badgeClass =
    contentSignals.hasVideo
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
          {contentSignals.hasVideo && (
            <span className={styles.playIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.68L9.54 5.98A1 1 0 0 0 8 6.82Z" />
              </svg>
            </span>
          )}
        </div>
      </Link>

      <div className={styles.content}>
        <Link to={`/artigos/${post.slug}`} className={styles.title}>
          {post.title}
        </Link>
        {previewText && <p className={styles.excerpt}>{previewText}</p>}
        <div className={styles.meta}>
          <span className={styles.authorAvatar} aria-hidden="true">
            {getAuthorLabel(post).charAt(0).toUpperCase()}
          </span>
          <span>{getAuthorLabel(post)}</span>
          <span className={styles.metaDot} aria-hidden="true">
            ·
          </span>
          <time dateTime={post.published_at ?? post.created_at}>{publishedLabel}</time>
          <span className={styles.metaDot} aria-hidden="true">
            ·
          </span>
          <span className={styles.readTime}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {readingTime} min
          </span>
        </div>
      </div>
    </article>
  )
}
