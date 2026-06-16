import { supabase } from '@/lib/supabase/client'
import { fetchCategories } from '@/features/categories/categoriesService'
import { fetchLatestPublishedPost } from '@/features/posts/postsService'
import type { Category, PostWithRelations, Tag } from '@/types/database'

const POST_SELECT = `
  *,
  author:profiles!posts_author_id_fkey(id, email, full_name, avatar_url, role, is_active, created_at, updated_at),
  category:categories(id, name, slug, description, parent_id, sort_order, created_at)
`

export interface WeeklyHighlight {
  post: PostWithRelations
}

const FEATURED_TOPIC_COUNT = 6
const WEEKLY_HIGHLIGHT_COUNT = 2
const POPULAR_CATEGORY_COUNT = 4
const FEATURED_TAG_COUNT = 8

export interface PopularCategory {
  category: Category
  postCount: number
}

export interface FeaturedTag {
  tag: Tag
  postCount: number
}

export interface HomePageData {
  latestPost: PostWithRelations | null
  topicCategories: Category[]
  popularCategories: PopularCategory[]
  featuredTags: FeaturedTag[]
  weeklyHighlights: WeeklyHighlight[]
}

function buildCategoryPostMaps(publishedPosts: PostWithRelations[]) {
  const postCountByCategory = new Map<string, number>()

  for (const post of publishedPosts) {
    if (!post.category_id) continue
    postCountByCategory.set(post.category_id, (postCountByCategory.get(post.category_id) ?? 0) + 1)
  }

  return { postCountByCategory }
}

function rankCategoriesByPostCount(
  categories: Category[],
  postCountByCategory: Map<string, number>,
) {
  return categories
    .map((category) => ({
      category,
      postCount: postCountByCategory.get(category.id) ?? 0,
    }))
    .filter((item) => item.postCount > 0)
    .sort((a, b) => {
      if (b.postCount !== a.postCount) return b.postCount - a.postCount
      return a.category.sort_order - b.category.sort_order
    })
}

function buildTagPostCounts(publishedPosts: PostWithRelations[]): FeaturedTag[] {
  const countByTagId = new Map<string, FeaturedTag>()

  for (const post of publishedPosts) {
    for (const tag of post.tags ?? []) {
      const existing = countByTagId.get(tag.id)
      if (existing) {
        existing.postCount += 1
      } else {
        countByTagId.set(tag.id, { tag, postCount: 1 })
      }
    }
  }

  return [...countByTagId.values()].sort((a, b) => {
    if (b.postCount !== a.postCount) return b.postCount - a.postCount
    return a.tag.name.localeCompare(b.tag.name, 'pt-BR')
  })
}

function sortPostsByRecency(posts: PostWithRelations[]) {
  return [...posts].sort((a, b) => {
    const dateA = a.published_at ?? a.created_at
    const dateB = b.published_at ?? b.created_at
    return dateB.localeCompare(dateA)
  })
}

export async function fetchHomePageData(): Promise<HomePageData> {
  const [categories, latestPost, postsResult] = await Promise.all([
    fetchCategories(),
    fetchLatestPublishedPost(),
    supabase
      .from('posts')
      .select(`${POST_SELECT}, post_tags(tag_id, tags(id, name, slug))`)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
  ])

  if (postsResult.error) throw postsResult.error

  const publishedPosts = (postsResult.data ?? []).map(mapPostWithTags)
  const { postCountByCategory } = buildCategoryPostMaps(publishedPosts)

  const rankedCategories = rankCategoriesByPostCount(categories, postCountByCategory)

  const topicCategories = rankedCategories
    .slice(0, FEATURED_TOPIC_COUNT)
    .map(({ category }) => category)

  const popularCategories = rankedCategories
    .slice(0, POPULAR_CATEGORY_COUNT)
    .map(({ category, postCount }) => ({ category, postCount }))

  const featuredTags = buildTagPostCounts(publishedPosts).slice(0, FEATURED_TAG_COUNT)

  const weeklyHighlights = sortPostsByRecency(publishedPosts)
    .slice(0, WEEKLY_HIGHLIGHT_COUNT)
    .map((post) => ({ post }))

  return {
    latestPost,
    topicCategories,
    popularCategories,
    featuredTags,
    weeklyHighlights,
  }
}

function mapPostWithTags(raw: Record<string, unknown>): PostWithRelations {
  const postTags = (raw.post_tags as { tags: { id: string; name: string; slug: string } | null }[]) ?? []
  const tags = postTags.map((pt) => pt.tags).filter(Boolean) as { id: string; name: string; slug: string }[]

  const { post_tags: _postTags, ...post } = raw
  void _postTags
  return { ...(post as unknown as PostWithRelations), tags }
}

export async function fetchEmptyCategoryIds(): Promise<Set<string>> {
  const [categories, postsResult] = await Promise.all([
    fetchCategories(),
    supabase.from('posts').select('category_id').eq('status', 'published'),
  ])

  if (postsResult.error) throw postsResult.error

  const postCountByCategory = new Map<string, number>()
  for (const post of postsResult.data ?? []) {
    if (!post.category_id) continue
    postCountByCategory.set(post.category_id, (postCountByCategory.get(post.category_id) ?? 0) + 1)
  }

  return new Set(
    categories.filter((category) => (postCountByCategory.get(category.id) ?? 0) === 0).map((c) => c.id),
  )
}
