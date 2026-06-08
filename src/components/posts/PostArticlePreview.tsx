import { Link } from 'react-router-dom'
import { RichTextViewer } from '@/components/editor/RichTextViewer'
import { formatDate } from '@/lib/utils'
import styles from '@/pages/public/PostDetailPage.module.css'

export interface PostArticlePreviewData {
  title: string
  excerpt?: string | null
  content: Record<string, unknown>
  featuredImageUrl?: string | null
  category?: { name: string; slug: string } | null
  tags?: { id: string; name: string }[]
  authorName?: string | null
  publishedAt?: string | null
  createdAt?: string | null
}

interface PostArticlePreviewProps {
  post: PostArticlePreviewData
  linkCategory?: boolean
}

export function PostArticlePreview({ post, linkCategory = true }: PostArticlePreviewProps) {
  const dateSource = post.publishedAt ?? post.createdAt ?? new Date().toISOString()

  return (
    <article className={styles.article}>
      {post.featuredImageUrl && (
        <img src={post.featuredImageUrl} alt="" className={styles.featured} />
      )}

      <header className={styles.header}>
        {post.category &&
          (linkCategory ? (
            <Link to={`/categorias/${post.category.slug}`} className={styles.category}>
              {post.category.name}
            </Link>
          ) : (
            <span className={styles.category}>{post.category.name}</span>
          ))}
        <h1>{post.title}</h1>
        <div className={styles.meta}>
          <time dateTime={dateSource}>{formatDate(dateSource)}</time>
          {post.authorName && <span>Por {post.authorName}</span>}
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <span key={tag.id} className={styles.tag}>
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </header>

      {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}

      <div className={styles.content}>
        <RichTextViewer content={post.content} />
      </div>
    </article>
  )
}
