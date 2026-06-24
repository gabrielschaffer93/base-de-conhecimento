import { supabase } from '@/lib/supabase/client'
import type { DashboardAnalytics } from '@/types/database'

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  const message = (error as { message?: string }).message ?? ''
  return code === '42P01' || code === 'PGRST205' || message.includes('does not exist')
}

export async function recordPostView(postId: string, visitorKey: string): Promise<void> {
  const { error } = await supabase.rpc('record_post_view', {
    p_post_id: postId,
    p_visitor_key: visitorKey,
  })
  if (error && !isMissingTableError(error)) {
    console.warn('Failed to record post view', error)
  }
}

export async function recordSearchEvent(
  query: string,
  resultsCount: number,
  visitorKey: string,
): Promise<void> {
  const { error } = await supabase.rpc('record_search_event', {
    p_query_text: query,
    p_results_count: resultsCount,
    p_visitor_key: visitorKey,
  })
  if (error && !isMissingTableError(error)) {
    console.warn('Failed to record search event', error)
  }
}

export async function recordReadingSession(
  postId: string,
  visitorKey: string,
  durationSeconds: number,
): Promise<void> {
  const { error } = await supabase.rpc('record_reading_session', {
    p_post_id: postId,
    p_visitor_key: visitorKey,
    p_duration_seconds: Math.round(durationSeconds),
  })
  if (error && !isMissingTableError(error)) {
    console.warn('Failed to record reading session', error)
  }
}

function getAuthorDisplayName(
  author:
    | { full_name: string | null; email: string }
    | { full_name: string | null; email: string }[]
    | null
    | undefined,
): string | null {
  const profile = Array.isArray(author) ? author[0] : author
  if (!profile) return null
  const fullName = profile.full_name?.trim()
  if (fullName) return fullName
  return profile.email?.trim() || null
}

const EMPTY_ANALYTICS: DashboardAnalytics = {
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

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  try {
    const [
      viewsResult,
      readingResult,
      searchResult,
      feedbackResult,
      postsResult,
      categoriesResult,
      tagsResult,
      postTagsResult,
    ] = await Promise.all([
      supabase.from('post_view_events').select('post_id'),
      supabase.from('post_reading_sessions').select('duration_seconds'),
      supabase.from('search_events').select('query_text, results_count'),
      supabase.from('post_feedback').select('vote'),
      supabase
        .from('posts')
        .select(
          'id, title, slug, status, author_id, category_id, updated_at, author:profiles!posts_author_id_fkey(full_name, email)',
        )
        .eq('status', 'published'),
      supabase.from('categories').select('id, name, slug'),
      supabase.from('tags').select('id, name, slug'),
      supabase.from('post_tags').select('post_id, tag_id'),
    ])

    const firstError =
      viewsResult.error ?? readingResult.error ?? searchResult.error ?? feedbackResult.error

    if (firstError && isMissingTableError(firstError)) {
      return EMPTY_ANALYTICS
    }

    if (postsResult.error) throw postsResult.error

    const publishedPosts = postsResult.data ?? []
    const publishedPostIds = new Set(publishedPosts.map((post) => post.id))
    const postMap = new Map(publishedPosts.map((post) => [post.id, post]))

    const viewCounts = new Map<string, number>()
    for (const row of viewsResult.data ?? []) {
      if (!publishedPostIds.has(row.post_id)) continue
      viewCounts.set(row.post_id, (viewCounts.get(row.post_id) ?? 0) + 1)
    }

    const totalViews = [...viewCounts.values()].reduce((sum, count) => sum + count, 0)

    const readingDurations = (readingResult.data ?? []).map((row) => row.duration_seconds)
    const averageReadingSeconds =
      readingDurations.length > 0
        ? Math.round(readingDurations.reduce((sum, value) => sum + value, 0) / readingDurations.length)
        : null

    const mostViewedPosts = [...viewCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([postId, viewCount]) => {
        const post = postMap.get(postId)
        return {
          postId,
          title: post?.title ?? 'Artigo removido',
          slug: post?.slug ?? '',
          viewCount,
        }
      })

    const neverViewedAll = publishedPosts.filter((post) => !viewCounts.has(post.id))
    const neverViewedCount = neverViewedAll.length
    const neverViewedPosts = neverViewedAll.slice(0, 8).map((post) => ({
        postId: post.id,
        title: post.title,
        slug: post.slug,
      }))

    const searchTermCounts = new Map<string, { count: number; label: string }>()
    const zeroResultCounts = new Map<string, { count: number; label: string }>()

    for (const row of searchResult.data ?? []) {
      const normalized = normalizeQuery(row.query_text)
      if (!normalized) continue

      const current = searchTermCounts.get(normalized) ?? { count: 0, label: row.query_text.trim() }
      current.count += 1
      searchTermCounts.set(normalized, current)

      if (row.results_count === 0) {
        const zero = zeroResultCounts.get(normalized) ?? { count: 0, label: row.query_text.trim() }
        zero.count += 1
        zeroResultCounts.set(normalized, zero)
      }
    }

    const topSearchTerms = [...searchTermCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => ({ term: item.label, count: item.count }))

    const zeroResultSearches = [...zeroResultCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => ({ term: item.label, count: item.count }))

    const feedbackLikes = (feedbackResult.data ?? []).filter((row) => row.vote === 1).length
    const feedbackDislikes = (feedbackResult.data ?? []).filter((row) => row.vote === -1).length
    const votedTotal = feedbackLikes + feedbackDislikes
    const resolutionRate = votedTotal > 0 ? Math.round((feedbackLikes / votedTotal) * 100) : null

    const authorCounts = new Map<string, { count: number; name: string }>()
    for (const post of publishedPosts) {
      if (!post.author_id) continue

      const name = getAuthorDisplayName(
        post.author as unknown as { full_name: string | null; email: string } | null,
      )
      if (!name) continue

      const current = authorCounts.get(post.author_id) ?? { count: 0, name }
      current.count += 1
      authorCounts.set(post.author_id, current)
    }

    const topAuthors = [...authorCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => ({ name: item.name, postCount: item.count }))

    const categoryMap = new Map((categoriesResult.data ?? []).map((category) => [category.id, category]))
    const categoryCounts = new Map<string, number>()
    for (const post of publishedPosts) {
      if (!post.category_id) continue
      categoryCounts.set(post.category_id, (categoryCounts.get(post.category_id) ?? 0) + 1)
    }

    const contentByCategory = [...categoryCounts.entries()]
      .map(([categoryId, postCount]) => {
        const category = categoryMap.get(categoryId)
        return {
          name: category?.name ?? 'Sem categoria',
          slug: category?.slug ?? '',
          postCount,
        }
      })
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 8)

    const tagMap = new Map((tagsResult.data ?? []).map((tag) => [tag.id, tag]))
    const tagCounts = new Map<string, number>()
    for (const row of postTagsResult.data ?? []) {
      if (!publishedPostIds.has(row.post_id)) continue
      tagCounts.set(row.tag_id, (tagCounts.get(row.tag_id) ?? 0) + 1)
    }

    const contentByTag = [...tagCounts.entries()]
      .map(([tagId, postCount]) => {
        const tag = tagMap.get(tagId)
        return {
          name: tag?.name ?? 'Tag removida',
          slug: tag?.slug ?? '',
          postCount,
        }
      })
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 8)

    return {
      totalViews,
      averageReadingSeconds,
      mostViewedPosts,
      neverViewedPosts,
      neverViewedCount,
      topSearchTerms,
      zeroResultSearches,
      feedbackLikes,
      feedbackDislikes,
      resolutionRate,
      topAuthors,
      contentByCategory,
      contentByTag,
      analyticsAvailable: true,
    }
  } catch (error) {
    if (isMissingTableError(error)) return EMPTY_ANALYTICS
    throw error
  }
}
