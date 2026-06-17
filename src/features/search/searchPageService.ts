import { fetchCategories } from '@/features/categories/categoriesService'
import { supabase } from '@/lib/supabase/client'
import type { Category, Tag } from '@/types/database'

const FILTER_CATEGORY_LIMIT = 8
const TRENDING_SEARCH_LIMIT = 4
const POPULAR_TAG_LIMIT = 6

export interface SearchPageSidebarData {
  filterCategories: Category[]
  trendingSearches: { label: string; query: string }[]
  popularTags: Tag[]
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
      return a.category.name.localeCompare(b.category.name, 'pt-BR')
    })
}

export async function fetchSearchPageSidebarData(): Promise<SearchPageSidebarData> {
  const [categories, postsResult] = await Promise.all([
    fetchCategories(),
    supabase
      .from('posts')
      .select('category_id, post_tags(tag_id, tags(id, name, slug))')
      .eq('status', 'published'),
  ])

  if (postsResult.error) throw postsResult.error

  const postCountByCategory = new Map<string, number>()
  const tagCount = new Map<string, Tag & { count: number }>()

  for (const post of postsResult.data ?? []) {
    if (post.category_id) {
      postCountByCategory.set(
        post.category_id,
        (postCountByCategory.get(post.category_id) ?? 0) + 1,
      )
    }

    const postTags = (post.post_tags as unknown as { tags: Tag | null }[]) ?? []
    for (const row of postTags) {
      const tag = row.tags
      if (!tag) continue
      const existing = tagCount.get(tag.id)
      if (existing) {
        existing.count += 1
      } else {
        tagCount.set(tag.id, { ...tag, count: 1 })
      }
    }
  }

  const rankedCategories = rankCategoriesByPostCount(categories, postCountByCategory)
  const filterCategories = rankedCategories
    .slice(0, FILTER_CATEGORY_LIMIT)
    .map(({ category }) => category)

  const trendingSearches = rankedCategories.slice(0, TRENDING_SEARCH_LIMIT).map(({ category }) => ({
    label: category.name,
    query: category.name,
  }))

  const popularTags = [...tagCount.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.name.localeCompare(b.name, 'pt-BR')
    })
    .slice(0, POPULAR_TAG_LIMIT)
    .map(({ id, name, slug }) => ({ id, name, slug }))

  return {
    filterCategories,
    trendingSearches,
    popularTags,
  }
}
