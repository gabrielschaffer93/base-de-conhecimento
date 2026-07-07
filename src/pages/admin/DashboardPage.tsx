import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/ui/PageHeader'
import { DashboardAnalyticsSection } from '@/components/dashboard/DashboardAnalyticsSection'
import {
  buildDashboardStatCards,
  DashboardStatCard,
} from '@/components/dashboard/DashboardStatCard'
import { DashboardMiniStat, formatReadingDuration } from '@/components/dashboard/DashboardMiniStat'
import { DashboardRankedList } from '@/components/dashboard/DashboardRankedList'
import { PostsPerMonthChart } from '@/components/dashboard/PostsPerMonthChart'
import { PostsAdminTable } from '@/components/posts/PostsAdminTable'
import { fetchDashboardAnalytics } from '@/features/analytics/analyticsService'
import { fetchDashboardStats, fetchAdminPosts, fetchPostsPerMonth } from '@/features/posts/postsService'
import type { DashboardAnalytics, DashboardStats, PostWithRelations, PostsPerMonthPoint } from '@/types/database'
import { formatDashboardNumber } from '@/lib/utils'
import { getPostPublicPath } from '@/lib/routes'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [recentPosts, setRecentPosts] = useState<PostWithRelations[]>([])
  const [postsPerMonth, setPostsPerMonth] = useState<PostsPerMonthPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchAdminPosts(),
      fetchDashboardAnalytics(),
      fetchPostsPerMonth(),
    ])
      .then(([statsData, postsData, analyticsData, postsPerMonthData]) => {
        setStats(statsData)
        setRecentPosts(postsData.slice(0, 5))
        setAnalytics(analyticsData)
        setPostsPerMonth(postsPerMonthData)
      })
      .catch(() => setAnalyticsError('Não foi possível carregar todas as métricas do dashboard.'))
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

  const metrics = analytics ?? {
    totalViews: 0,
    averageReadingSeconds: null,
    mostViewedPosts: [],
    neverViewedPosts: [],
    neverViewedCount: 0,
    topSearchTerms: [],
    zeroResultSearches: [],
    feedbackLikes: 0,
    feedbackDislikes: 0,
    resolutionRate: null,
    topAuthors: [],
    contentByCategory: [],
    contentByTag: [],
    analyticsAvailable: false,
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da central de conhecimento e métricas de consumo, busca, qualidade e equipe"
      />

      {!metrics.analyticsAvailable && (
        <Card className={styles.notice}>
          <p>
            As métricas de consumo e busca ainda não estão disponíveis. Execute a migration{' '}
            <code>20250616150000_analytics_dashboard.sql</code> no Supabase para ativar o
            rastreamento.
          </p>
        </Card>
      )}

      {analyticsError && (
        <Card className={styles.noticeError}>
          <p>{analyticsError}</p>
        </Card>
      )}

      <DashboardAnalyticsSection title="Visão geral">
        <div className={styles.statsGrid}>
          {statCards.map((card) => (
            <DashboardStatCard key={card.label} {...card} />
          ))}
        </div>
        <PostsPerMonthChart data={postsPerMonth} />
      </DashboardAnalyticsSection>

      <DashboardAnalyticsSection
        title="Consumo"
        description="Como os leitores estão consumindo os artigos publicados"
      >
        <div className={styles.miniStatsGrid}>
          <DashboardMiniStat
            label="Visualizações totais"
            value={formatDashboardNumber(metrics.totalViews)}
          />
          <DashboardMiniStat
            label="Tempo médio de leitura"
            value={formatReadingDuration(metrics.averageReadingSeconds)}
            hint="Com base em sessões reais no artigo"
          />
          <DashboardMiniStat
            label="Artigos mais acessados"
            value={formatDashboardNumber(metrics.mostViewedPosts.length)}
            hint="Top exibido abaixo"
          />
          <DashboardMiniStat
            label="Artigos nunca acessados"
            value={formatDashboardNumber(metrics.neverViewedCount)}
            tone={metrics.neverViewedCount > 0 ? 'warning' : 'default'}
          />
        </div>

        <div className={styles.listsGrid}>
          <DashboardRankedList
            title="Artigos mais acessados"
            emptyMessage="Ainda não há visualizações registradas."
            valueLabel="views"
            items={metrics.mostViewedPosts.map((post) => ({
              key: post.postId,
              label: post.title,
              value: post.viewCount ?? 0,
              href: post.slug ? getPostPublicPath(post.slug) : undefined,
            }))}
          />
          <DashboardRankedList
            title="Artigos nunca acessados"
            emptyMessage="Todos os artigos publicados já receberam pelo menos uma visualização."
            valueLabel="views"
            items={metrics.neverViewedPosts.map((post) => ({
              key: post.postId,
              label: post.title,
              value: 0,
              href: post.slug ? getPostPublicPath(post.slug) : undefined,
            }))}
          />
        </div>
      </DashboardAnalyticsSection>

      <DashboardAnalyticsSection
        title="Busca"
        description="O que os usuários procuram e onde ainda faltam conteúdos"
      >
        <div className={styles.listsGrid}>
          <DashboardRankedList
            title="Termos mais buscados"
            emptyMessage="Nenhuma busca registrada ainda."
            items={metrics.topSearchTerms.map((item) => ({
              key: item.term,
              label: item.term,
              value: item.count,
            }))}
          />
          <DashboardRankedList
            title="Buscas sem resultado"
            emptyMessage="Nenhuma lacuna de conteúdo identificada nas buscas."
            items={metrics.zeroResultSearches.map((item) => ({
              key: item.term,
              label: item.term,
              value: item.count,
              meta: 'Oportunidade de novo conteúdo',
            }))}
          />
        </div>
      </DashboardAnalyticsSection>

      <DashboardAnalyticsSection
        title="Qualidade"
        description="Satisfação dos leitores com os artigos"
      >
        <div className={styles.miniStatsGrid}>
          <DashboardMiniStat
            label="Avaliações positivas"
            value={formatDashboardNumber(metrics.feedbackLikes)}
            tone="positive"
          />
          <DashboardMiniStat
            label="Avaliações negativas"
            value={formatDashboardNumber(metrics.feedbackDislikes)}
            tone="negative"
          />
          <DashboardMiniStat
            label="Taxa de resolução"
            value={metrics.resolutionRate !== null ? `${metrics.resolutionRate}%` : '—'}
            hint="% de leitores que marcaram Gostei"
            tone={
              metrics.resolutionRate !== null && metrics.resolutionRate >= 70
                ? 'positive'
                : metrics.resolutionRate !== null && metrics.resolutionRate < 50
                  ? 'negative'
                  : 'default'
            }
          />
        </div>
      </DashboardAnalyticsSection>

      <DashboardAnalyticsSection
        title="Equipe"
        description="Produção editorial por pessoa, categoria e tag"
      >
        <div className={styles.listsGrid}>
          <DashboardRankedList
            title="Quem mais publica"
            emptyMessage="Nenhum artigo publicado com autor definido."
            valueLabel="artigos"
            items={metrics.topAuthors.map((author) => ({
              key: `${author.name}-${author.postCount}`,
              label: author.name,
              value: author.postCount,
            }))}
          />
          <DashboardRankedList
            title="Conteúdo por categoria"
            emptyMessage="Nenhuma categoria com artigos publicados."
            valueLabel="artigos"
            items={metrics.contentByCategory.map((item) => ({
              key: item.slug || item.name,
              label: item.name,
              value: item.postCount,
              href: item.slug ? `/categorias/${item.slug}` : undefined,
            }))}
          />
          <DashboardRankedList
            title="Conteúdo por tag"
            emptyMessage="Nenhuma tag associada a artigos publicados."
            valueLabel="artigos"
            items={metrics.contentByTag.map((item) => ({
              key: item.slug || item.name,
              label: item.name,
              value: item.postCount,
            }))}
          />
        </div>
      </DashboardAnalyticsSection>

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
