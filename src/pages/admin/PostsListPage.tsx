import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { deletePost, fetchAdminPosts } from '@/features/posts/postsService'
import { getStatusLabel } from '@/lib/utils'
import type { PostStatus, PostWithRelations } from '@/types/database'
import styles from './PostsListPage.module.css'

export function PostsListPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)

  const reloadPosts = () => {
    setIsLoading(true)
    fetchAdminPosts({ search: search || undefined, status: statusFilter || undefined })
      .then(setPosts)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchAdminPosts({ status: statusFilter || undefined })
      .then(setPosts)
      .finally(() => setIsLoading(false))
  }, [statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    reloadPosts()
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Deseja excluir "${title}"?`)) return
    await deletePost(id)
    reloadPosts()
  }

  const statusVariant = (status: PostStatus) => {
    if (status === 'published') return 'success'
    if (status === 'draft') return 'warning'
    return 'default'
  }

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Gerencie artigos e conteúdos da central de conhecimento"
        actions={
          <Link to="/admin/posts/new">
            <Button>Novo post</Button>
          </Link>
        }
      />

      <Card className={styles.filters}>
        <form onSubmit={handleSearch} className={styles.filterRow}>
          <Input
            name="search"
            placeholder="Buscar por título ou slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PostStatus | '')}
            className={styles.select}
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState
          title="Nenhum post encontrado"
          action={
            <Link to="/admin/posts/new">
              <Button>Criar primeiro post</Button>
            </Link>
          }
        />
      ) : (
        <div className={styles.list}>
          {posts.map((post) => (
            <Card key={post.id} className={styles.postRow}>
              <div className={styles.postInfo}>
                <Link to={`/admin/posts/${post.id}`}>
                  <h3>{post.title}</h3>
                </Link>
                <span className={styles.slug}>/{post.slug}</span>
              </div>
              <Badge variant={statusVariant(post.status)}>{getStatusLabel(post.status)}</Badge>
              <div className={styles.actions}>
                {post.status === 'published' && (
                  <a href={`/artigos/${post.slug}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </a>
                )}
                <Link to={`/admin/posts/${post.id}`}>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => handleDelete(post.id, post.title)}>
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
