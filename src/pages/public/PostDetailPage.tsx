import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { RichTextViewer } from '@/components/editor/RichTextViewer'
import { fetchPostBySlug } from '@/features/posts/postsService'
import { formatDate } from '@/lib/utils'
import type { PostWithRelations } from '@/types/database'
import styles from './PostDetailPage.module.css'

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetchPostBySlug(slug)
      .then(setPost)
      .finally(() => setIsLoading(false))
  }, [slug])

  useEffect(() => {
    if (post) {
      document.title = post.meta_title ?? post.title
    }
  }, [post])

  if (isLoading) return <Spinner />
  if (!post) return <EmptyState title="Artigo não encontrado" description="Este conteúdo não existe ou foi removido." />

  return (
    <article className={styles.article}>
      {post.featured_image_url && (
        <img src={post.featured_image_url} alt="" className={styles.featured} />
      )}

      <header className={styles.header}>
        {post.category && (
          <Link to={`/categorias/${post.category.slug}`} className={styles.category}>
            {post.category.name}
          </Link>
        )}
        <h1>{post.title}</h1>
        <div className={styles.meta}>
          <time dateTime={post.published_at ?? post.created_at}>
            {formatDate(post.published_at ?? post.created_at)}
          </time>
          {post.author?.full_name && <span>Por {post.author.full_name}</span>}
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
