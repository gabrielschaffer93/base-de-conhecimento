import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/ui/PageHeader'
import { PostsAdminTable } from '@/components/posts/PostsAdminTable'
import { fetchDashboardStats, fetchAdminPosts } from '@/features/posts/postsService'
import type { DashboardStats, PostWithRelations } from '@/types/database'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPosts, setRecentPosts] = useState<PostWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchAdminPosts()])
      .then(([statsData, postsData]) => {
        setStats(statsData)
        setRecentPosts(postsData.slice(0, 5))
      })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Spinner />

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da central de conhecimento" />

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{stats?.totalPosts ?? 0}</span>
          <span className={styles.statLabel}>Total de posts</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{stats?.publishedPosts ?? 0}</span>
          <span className={styles.statLabel}>Publicados</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{stats?.draftPosts ?? 0}</span>
          <span className={styles.statLabel}>Rascunhos</span>
        </Card>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{stats?.activeUsers ?? 0}</span>
          <span className={styles.statLabel}>Usuários ativos</span>
        </Card>
      </div>

      <Card className={styles.postsCard}>
        <h2 className={styles.postsTitle}>Posts recentes</h2>
        {recentPosts.length === 0 ? (
          <p className={styles.emptyMessage}>Nenhum post criado ainda.</p>
        ) : (
          <PostsAdminTable posts={recentPosts} />
        )}
      </Card>
    </div>
  )
}
