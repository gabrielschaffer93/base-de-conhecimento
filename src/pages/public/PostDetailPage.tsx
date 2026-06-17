import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PostArticlePreview } from '@/components/posts/PostArticlePreview'
import { PostArticleSidebar } from '@/components/public/PostArticleSidebar'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { recordPostView } from '@/features/analytics/analyticsService'
import {
  fetchPostBySlug,
  fetchRelatedPosts,
  type RelatedPostsData,
} from '@/features/posts/postsService'
import { usePostReadingTracker } from '@/hooks/usePostReadingTracker'
import { getVisitorKey } from '@/lib/visitorKey'
import type { PostWithRelations } from '@/types/database'
import styles from './PostDetailPage.module.css'

const EMPTY_RELATED: RelatedPostsData = {
  categoryPosts: [],
  tagPosts: [],
}

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostWithRelations | null>(null)
  const [related, setRelated] = useState<RelatedPostsData>(EMPTY_RELATED)
  const [isLoading, setIsLoading] = useState(true)

  usePostReadingTracker(post?.id)

  useEffect(() => {
    if (!slug) return

    let cancelled = false
    setIsLoading(true)

    fetchPostBySlug(slug)
      .then(async (loadedPost) => {
        if (cancelled) return

        setPost(loadedPost)

        if (!loadedPost) {
          setRelated(EMPTY_RELATED)
          return
        }

        const relatedPosts = await fetchRelatedPosts(
          loadedPost.id,
          loadedPost.category_id,
          loadedPost.tags?.map((tag) => tag.id) ?? [],
        )

        if (!cancelled) {
          setRelated(relatedPosts)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (post) {
      document.title = post.meta_title ?? post.title
      void recordPostView(post.id, getVisitorKey())
    }
  }, [post])

  if (isLoading) return <Spinner />
  if (!post) {
    return (
      <EmptyState
        title="Artigo não encontrado"
        description="Este conteúdo não existe ou foi removido."
      />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.main}>
          <PostArticlePreview
            postId={post.id}
            post={{
              title: post.title,
              content: post.content,
              featuredImageUrl: post.featured_image_url,
              category: post.category ?? null,
              tags: post.tags,
              authorName: post.author?.full_name,
              publishedAt: post.published_at,
              createdAt: post.created_at,
            }}
          />
        </div>

        <PostArticleSidebar
          category={post.category}
          tags={post.tags}
          related={related}
        />
      </div>
    </div>
  )
}
