import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { PostsAdminTable } from '@/components/posts/PostsAdminTable'
import { deletePost, fetchAdminPosts, updatePostStatus } from '@/features/posts/postsService'
import type { PostStatus, PostWithRelations } from '@/types/database'
import styles from './PostsListPage.module.css'

export function PostsListPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [actionPostId, setActionPostId] = useState<string | null>(null)

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

  const handleArchive = async (post: PostWithRelations) => {
    if (
      !window.confirm(
        `Arquivar "${post.title}"? O artigo deixará de aparecer no site público.`,
      )
    ) {
      return
    }

    setActionPostId(post.id)
    try {
      await updatePostStatus(post.id, 'archived')
      reloadPosts()
    } finally {
      setActionPostId(null)
    }
  }

  const handleRestore = async (post: PostWithRelations) => {
    setActionPostId(post.id)
    try {
      await updatePostStatus(post.id, 'published')
      reloadPosts()
    } finally {
      setActionPostId(null)
    }
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
        <Card className={styles.tableCard}>
          <PostsAdminTable
            posts={posts}
            actionPostId={actionPostId}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        </Card>
      )}
    </div>
  )
}
