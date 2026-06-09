import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  formatRelativeTime,
  formatShortDate,
  getShortDisplayName,
  getStatusLabel,
} from '@/lib/utils'
import type { PostStatus, PostWithRelations } from '@/types/database'
import styles from './PostsAdminTable.module.css'

function PostDocumentIcon() {
  return (
    <svg className={styles.postIconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M16 4v4h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function getPostSubtitle(post: PostWithRelations): string | null {
  const parts: string[] = []
  if (post.category?.name) parts.push(post.category.name)
  post.tags?.forEach((tag) => parts.push(tag.name))
  return parts.length > 0 ? parts.join(' • ') : null
}

function getStatusClass(status: PostStatus): string {
  if (status === 'published') return styles.statusPublished
  if (status === 'draft') return styles.statusDraft
  return styles.statusArchived
}

interface PostsAdminTableProps {
  posts: PostWithRelations[]
  actionPostId?: string | null
  onArchive?: (post: PostWithRelations) => void
  onRestore?: (post: PostWithRelations) => void
  onDelete?: (id: string, title: string) => void
}

export function PostsAdminTable({
  posts,
  actionPostId = null,
  onArchive,
  onRestore,
  onDelete,
}: PostsAdminTableProps) {
  const showExtendedActions = Boolean(onArchive || onRestore || onDelete)

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Título e categoria</th>
            <th>Status</th>
            <th>Autor</th>
            <th>Última atualização</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const subtitle = getPostSubtitle(post)

            return (
              <tr key={post.id}>
                <td>
                  <div className={styles.titleCell}>
                    <span className={styles.postIcon}>
                      <PostDocumentIcon />
                    </span>
                    <div className={styles.titleContent}>
                      <Link to={`/admin/posts/${post.id}`} className={styles.postTitle}>
                        {post.title}
                      </Link>
                      {subtitle && <span className={styles.postSubtitle}>{subtitle}</span>}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${getStatusClass(post.status)}`}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {getStatusLabel(post.status).toUpperCase()}
                  </span>
                </td>
                <td className={styles.authorCell}>
                  {getShortDisplayName(post.author?.full_name, post.author?.email)}
                </td>
                <td>
                  <div className={styles.dateCell}>
                    <time dateTime={post.updated_at}>{formatShortDate(post.updated_at)}</time>
                    <span className={styles.dateRelative}>{formatRelativeTime(post.updated_at)}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.actionsCell}>
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
                    {showExtendedActions && post.status === 'archived' && onRestore && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionPostId === post.id}
                        onClick={() => onRestore(post)}
                      >
                        Republicar
                      </Button>
                    )}
                    {showExtendedActions && post.status !== 'archived' && onArchive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={actionPostId === post.id}
                        onClick={() => onArchive(post)}
                      >
                        Arquivar
                      </Button>
                    )}
                    {showExtendedActions && onDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(post.id, post.title)}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
