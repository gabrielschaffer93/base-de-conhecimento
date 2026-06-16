import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { fetchCategoryBySlug } from '@/features/categories/categoriesService'
import { fetchPublishedPosts } from '@/features/posts/postsService'
import { formatDate, getPostPreviewText } from '@/lib/utils'
import type { Category, PostWithRelations } from '@/types/database'
import styles from '../public/HomePage.module.css'

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    fetchCategoryBySlug(slug)
      .then(async (cat) => {
        setCategory(cat)
        if (cat) {
          const postsData = await fetchPublishedPosts({ categoryId: cat.id })
          setPosts(postsData)
        }
      })
      .finally(() => setIsLoading(false))
  }, [slug])

  if (isLoading) return <Spinner />
  if (!category) return <EmptyState title="Categoria não encontrada" />

  return (
    <div>
      <h1>{category.name}</h1>
      {category.description && <p>{category.description}</p>}

      {posts.length === 0 ? (
        <EmptyState title="Nenhum artigo nesta categoria" />
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => {
            const previewText = getPostPreviewText(post.content)

            return (
            <Card key={post.id} className={styles.postCard}>
              <div className={styles.postContent}>
                <Link to={`/artigos/${post.slug}`}>
                  <h3>{post.title}</h3>
                </Link>
                {previewText && <p>{previewText}</p>}
                <time>{formatDate(post.published_at ?? post.created_at)}</time>
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
