import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PostArticlePreview } from '@/components/posts/PostArticlePreview'
import { fetchPostBySlug } from '@/features/posts/postsService'
import type { PostWithRelations } from '@/types/database'

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
    <PostArticlePreview
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
  )
}
