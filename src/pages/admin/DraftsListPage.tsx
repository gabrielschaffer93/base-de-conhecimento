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
import type { PostWithRelations } from '@/types/database'
import styles from './PostsListPage.module.css'

function formatDraftsTotal(count: number, hasSearch: boolean): string {
  const formatted = formatDashboardNumber(count)
  const noun = count === 1 ? 'rascunho' : 'rascunhos'

  if (hasSearch) {
    const suffix = count === 1 ? 'encontrado' : 'encontrados'
    return `${formatted} ${noun} ${suffix}`
  }

  return `${formatted} ${noun} no total`
}

export function DraftsListPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [actionPostId, setActionPostId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadDrafts = useCallback(() => {
    setIsLoading(true)
    return fetchAdminPosts({
      search: debouncedSearch || undefined,
      status: 'draft',
    })
      .then(setPosts)
      .finally(() => setIsLoading(false))
  }, [debouncedSearch])

  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Deseja excluir "${title}"?`)) return
    await deletePost(id)
    loadDrafts()
  }

  const handlePublish = async (post: PostWithRelations) => {
    setActionPostId(post.id)
    try {
      await updatePostStatus(post.id, 'published')
      loadDrafts()
    } finally {
      setActionPostId(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Rascunhos"
        description="Posts salvos automaticamente ou ainda não publicados — continue editando quando quiser"
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
            placeholder="Buscar rascunho por título ou slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {isLoading && posts.length === 0 ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState
          title="Nenhum rascunho"
          description="Rascunhos aparecem aqui quando você sai da edição sem publicar ou salva manualmente como rascunho."
          action={
            <Link to="/admin/posts/new">
              <Button>Criar post</Button>
            </Link>
          }
        />
      ) : (
        <Card className={`${styles.tableCard} ${isLoading ? styles.tableCardLoading : ''}`}>
          <p className={styles.totalCount}>{formatDraftsTotal(posts.length, Boolean(debouncedSearch))}</p>
          <PostsAdminTable
            posts={posts}
            actionPostId={actionPostId}
            editBasePath="/admin/drafts"
            onPublish={handlePublish}
            onDelete={handleDelete}
            hideStatusColumn
          />
        </Card>
      )}
    </div>
  )
}
