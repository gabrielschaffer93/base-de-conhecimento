import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { fetchPublishedPosts } from '@/features/posts/postsService'
import { fetchCategories } from '@/features/categories/categoriesService'
import { formatDate, truncate } from '@/lib/utils'
import type { Category, PostWithRelations } from '@/types/database'
import styles from './HomePage.module.css'

export function HomePage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchPublishedPosts({ limit: 12 }), fetchCategories()])
      .then(([postsData, categoriesData]) => {
        setPosts(postsData)
        setCategories(categoriesData)
      })
      .catch(() => setError('Não foi possível carregar os artigos.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Spinner />
  if (error) return <EmptyState title="Erro" description={error} />

  return (
    <div>
      <section className={styles.hero}>
        <h1>Central de Conhecimento</h1>
        <p>Encontre artigos, tutoriais e documentação para o seu dia a dia.</p>
      </section>

      {categories.length > 0 && (
        <section className={styles.categories}>
          <h2>Categorias</h2>
          <div className={styles.categoryList}>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/categorias/${cat.slug}`} className={styles.categoryChip}>
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Artigos recentes</h2>
        {posts.length === 0 ? (
          <EmptyState
            title="Nenhum artigo publicado"
            description="Os conteúdos aparecerão aqui assim que forem publicados no painel."
          />
        ) : (
          <div className={styles.grid}>
            {posts.map((post) => (
              <Card key={post.id} className={styles.postCard}>
                {post.featured_image_url && (
                  <img src={post.featured_image_url} alt="" className={styles.thumbnail} />
                )}
                <div className={styles.postContent}>
                  {post.category && (
                    <span className={styles.category}>{post.category.name}</span>
                  )}
                  <Link to={`/artigos/${post.slug}`}>
                    <h3>{post.title}</h3>
                  </Link>
                  {post.excerpt && <p>{truncate(post.excerpt, 140)}</p>}
                  <time dateTime={post.published_at ?? post.created_at}>
                    {formatDate(post.published_at ?? post.created_at)}
                  </time>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
