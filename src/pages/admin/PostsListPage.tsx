import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { PostsAdminTable } from '@/components/posts/PostsAdminTable'
import { deletePost, fetchAdminPosts, updatePostStatus } from '@/features/posts/postsService'
import { formatDashboardNumber } from '@/lib/utils'
import type { PostStatus, PostWithRelations } from '@/types/database'
import styles from './PostsListPage.module.css'

function formatPostsTotal(count: number, hasFilters: boolean): string {
  const formatted = formatDashboardNumber(count)
  const noun = count === 1 ? 'artigo' : 'artigos'

  if (hasFilters) {
    const suffix = count === 1 ? 'encontrado' : 'encontrados'
    return `${formatted} ${noun} ${suffix}`
  }

  return `${formatted} ${noun} no total`
}

export function PostsListPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PostStatus | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [actionPostId, setActionPostId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadPosts = useCallback(() => {
    setIsLoading(true)
    return fetchAdminPosts({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
    })
      .then(setPosts)
      .finally(() => setIsLoading(false))
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Deseja excluir "${title}"?`)) return
    await deletePost(id)
    loadPosts()
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
      loadPosts()
    } finally {
      setActionPostId(null)
    }
  }

  const handleRestore = async (post: PostWithRelations) => {
    setActionPostId(post.id)
    try {
      await updatePostStatus(post.id, 'published')
      loadPosts()
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
        <div className={styles.filterRow}>
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
        </div>
      </Card>

      {isLoading && posts.length === 0 ? (
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
        <Card className={`${styles.tableCard} ${isLoading ? styles.tableCardLoading : ''}`}>
          <p className={styles.totalCount}>
            {formatPostsTotal(posts.length, Boolean(debouncedSearch || statusFilter))}
          </p>
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
