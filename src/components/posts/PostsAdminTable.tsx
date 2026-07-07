import { Link } from 'react-router-dom'
import {
  formatRelativeTime,
  formatShortDate,
  getShortDisplayName,
  getStatusLabel,
} from '@/lib/utils'
import { getPostPublicPath } from '@/lib/routes'
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

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12C4.5 7.5 8 5 12 5s7.5 2.5 9.5 7c-2 4.5-5.5 7-9.5 7s-7.5-2.5-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L16.5 4.5a2.1 2.1 0 0 0-3 0L3 15v5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ArchiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 11h6M10 4h4l1 3H9l1-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 13.7-5.7M20 4v5h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12a8 8 0 0 1-13.7 5.7M4 20v-5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M7 7l1 12h8l1-12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface ActionIconButtonProps {
  label: string
  onClick?: () => void
  href?: string
  to?: string
  variant?: 'default' | 'danger' | 'accent'
  isLoading?: boolean
  disabled?: boolean
  children: React.ReactNode
}

function ActionIconButton({
  label,
  onClick,
  href,
  to,
  variant = 'default',
  isLoading = false,
  disabled = false,
  children,
}: ActionIconButtonProps) {
  const variantClass =
    variant === 'danger'
      ? styles.actionButtonDanger
      : variant === 'accent'
        ? styles.actionButtonAccent
        : ''

  const className = `${styles.actionButton} ${variantClass}`.trim()

  const content = isLoading ? <span className={styles.actionSpinner} aria-hidden="true" /> : children

  if (to) {
    return (
      <Link to={to} className={className} aria-label={label} title={label}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        className={className}
        aria-label={label}
        title={label}
        target="_blank"
        rel="noreferrer"
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {content}
    </button>
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
  editBasePath?: string
  hideStatusColumn?: boolean
  onPublish?: (post: PostWithRelations) => void
  onArchive?: (post: PostWithRelations) => void
  onRestore?: (post: PostWithRelations) => void
  onDelete?: (id: string, title: string) => void
}

export function PostsAdminTable({
  posts,
  actionPostId = null,
  editBasePath = '/admin/posts',
  hideStatusColumn = false,
  onPublish,
  onArchive,
  onRestore,
  onDelete,
}: PostsAdminTableProps) {
  const showExtendedActions = Boolean(onPublish || onArchive || onRestore || onDelete)

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Título e categoria</th>
            {!hideStatusColumn && <th>Status</th>}
            <th>Autor</th>
            <th>Última atualização</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => {
            const subtitle = getPostSubtitle(post)
            const isActionLoading = actionPostId === post.id

            return (
              <tr key={post.id}>
                <td>
                  <div className={styles.titleCell}>
                    <span className={styles.postIcon}>
                      <PostDocumentIcon />
                    </span>
                    <div className={styles.titleContent}>
                      <Link to={`${editBasePath}/${post.id}`} className={styles.postTitle}>
                        {post.title}
                      </Link>
                      {subtitle && <span className={styles.postSubtitle}>{subtitle}</span>}
                    </div>
                  </div>
                </td>
                {!hideStatusColumn && (
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(post.status)}`}>
                      <span className={styles.statusDot} aria-hidden="true" />
                      {getStatusLabel(post.status).toUpperCase()}
                    </span>
                  </td>
                )}
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
                      <ActionIconButton
                        label="Ver artigo"
                        href={getPostPublicPath(post.slug)}
                      >
                        <ViewIcon />
                      </ActionIconButton>
                    )}
                    <ActionIconButton label="Editar" to={`${editBasePath}/${post.id}`}>
                      <EditIcon />
                    </ActionIconButton>
                    {showExtendedActions && onPublish && post.status === 'draft' && (
                      <ActionIconButton
                        label="Publicar"
                        variant="accent"
                        isLoading={isActionLoading}
                        onClick={() => onPublish(post)}
                      >
                        <RestoreIcon />
                      </ActionIconButton>
                    )}
                    {showExtendedActions && post.status === 'archived' && onRestore && (
                      <ActionIconButton
                        label="Republicar"
                        variant="accent"
                        isLoading={isActionLoading}
                        onClick={() => onRestore(post)}
                      >
                        <RestoreIcon />
                      </ActionIconButton>
                    )}
                    {showExtendedActions && post.status !== 'archived' && onArchive && (
                      <ActionIconButton
                        label="Arquivar"
                        isLoading={isActionLoading}
                        onClick={() => onArchive(post)}
                      >
                        <ArchiveIcon />
                      </ActionIconButton>
                    )}
                    {showExtendedActions && onDelete && (
                      <ActionIconButton
                        label="Excluir"
                        variant="danger"
                        onClick={() => onDelete(post.id, post.title)}
                      >
                        <TrashIcon />
                      </ActionIconButton>
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
