import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  buildDashboardStatCards,
  DashboardStatCard,
} from '@/components/dashboard/DashboardStatCard'
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

  const statCards = buildDashboardStatCards({
    totalPosts: stats?.totalPosts ?? 0,
    publishedPosts: stats?.publishedPosts ?? 0,
    draftPosts: stats?.draftPosts ?? 0,
    archivedPosts: stats?.archivedPosts ?? 0,
    activeUsers: stats?.activeUsers ?? 0,
    totalUsers: stats?.totalUsers ?? 0,
  })

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da central de conhecimento" />

      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <DashboardStatCard key={card.label} {...card} />
        ))}
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
