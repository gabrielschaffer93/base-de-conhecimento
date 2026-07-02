import { supabase } from '@/lib/supabase/client'
import { buildExcerptFromContent } from '@/lib/utils'
import { fetchCategoryBySlug } from '@/features/categories/categoriesService'
import { getPostContentSignals, type SearchContentType } from '@/lib/postContent'
import {
  buildPostPayload,
  getAutoSaveStatus,
  hasMinimumAutoSaveContent,
} from '@/features/posts/postFormUtils'
import type { DashboardStats, Post, PostFormData, PostStatus, PostWithRelations, PostsPerMonthPoint } from '@/types/database'

export interface RelatedPostsData {
  categoryPosts: PostWithRelations[]
  tagPosts: PostWithRelations[]
}

export type SearchSort = 'relevance' | 'recent'

export interface SearchPostsOptions {
  search?: string
  categorySlug?: string
  tagSlug?: string
  contentType?: SearchContentType
  sort?: SearchSort
  page?: number
  pageSize?: number
}

export interface SearchPostsResult {
  posts: PostWithRelations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function getPostSaveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message

  if (error && typeof error === 'object') {
    const dbError = error as { code?: string; message?: string; details?: string }

    if (dbError.code === '23505') {
      return 'Este slug já está em uso por outro post. Altere o slug e tente novamente.'
    }

    if (dbError.code === '42501' || dbError.message?.includes('row-level security')) {
      return 'Sem permissão para salvar posts. Verifique seu perfil de acesso.'
    }

    if (dbError.message?.includes('invalid input syntax for type uuid')) {
      return 'Identificador inválido. Crie um novo post ou abra um existente pela lista de posts.'
    }

    if (dbError.message) return dbError.message
  }

  return 'Erro ao salvar o post. Tente novamente.'
}

export async function findPostSummaryBySlug(
  slug: string,
): Promise<{ id: string; title: string; status: PostStatus } | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, status')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function isSlugTaken(slug: string, excludePostId?: string): Promise<boolean> {
  let query = supabase.from('posts').select('id').eq('slug', slug)

  if (excludePostId) {
    query = query.neq('id', excludePostId)
  }

  const { data, error } = await query.limit(1)
  if (error) throw error
  return (data?.length ?? 0) > 0
}

const POST_SELECT = `
  *,
  author:profiles!posts_author_id_fkey(id, email, full_name, avatar_url, role, is_active, created_at, updated_at),
  category:categories(id, name, slug, description, parent_id, sort_order, created_at)
`

export async function fetchPublishedPosts(options?: {
  search?: string
  categoryId?: string
  limit?: number
  offset?: number
}): Promise<PostWithRelations[]> {
  let query = supabase
    .from('posts')
    .select(`${POST_SELECT}, post_tags(tag_id, tags(id, name, slug))`)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }

  if (options?.search) {
    query = query.or(
      `title.ilike.%${options.search}%,excerpt.ilike.%${options.search}%`,
    )
  }

  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map(mapPostWithTags)
}

export async function searchPublishedPosts(
  options: SearchPostsOptions = {},
): Promise<SearchPostsResult> {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = options.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let categoryId: string | undefined
  if (options.categorySlug) {
    const category = await fetchCategoryBySlug(options.categorySlug)
    if (!category) {
      return { posts: [], total: 0, page, pageSize, totalPages: 0 }
    }
    categoryId = category.id
  }

  const tagRelation = options.tagSlug
    ? 'post_tags!inner(tag_id, tags!inner(id, name, slug))'
    : 'post_tags(tag_id, tags(id, name, slug))'

  let query = supabase
    .from('posts')
    .select(`${POST_SELECT}, ${tagRelation}`, { count: 'exact' })
    .eq('status', 'published')

  if (categoryId) query = query.eq('category_id', categoryId)
  if (options.tagSlug) query = query.eq('post_tags.tags.slug', options.tagSlug)

  const searchTerm = options.search?.trim()
  if (searchTerm) {
    query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`)
  }

  const sortColumn = options.sort === 'recent' ? 'published_at' : 'published_at'
  query = query.order(sortColumn, { ascending: false, nullsFirst: false })

  if (options.contentType === 'videos' || options.contentType === 'tutorials') {
    const { data, error } = await query.limit(1000)
    if (error) throw error

    const filtered = (data ?? [])
      .map(mapPostWithTags)
      .filter((post) => {
        const signals = getPostContentSignals(
          post.content,
          post.title,
          post.slug,
          post.excerpt,
        )
        return options.contentType === 'videos' ? signals.hasVideo : signals.hasTutorial
      })

    const total = filtered.length
    const posts = filtered.slice(from, to + 1)

    return {
      posts,
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    }
  }

  const { data, error, count } = await query.range(from, to)
  if (error) throw error

  const total = count ?? 0
  return {
    posts: (data ?? []).map(mapPostWithTags),
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  }
}

export async function fetchLatestPublishedPost(): Promise<PostWithRelations | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`${POST_SELECT}, post_tags(tag_id, tags(id, name, slug))`)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapPostWithTags(data)
}

export async function fetchPostBySlug(slug: string, includeDrafts = false): Promise<PostWithRelations | null> {
  let query = supabase
    .from('posts')
    .select(`${POST_SELECT}, post_tags(tag_id, tags(id, name, slug))`)
    .eq('slug', slug)

  if (!includeDrafts) {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query.single()
  if (error) return null
  return mapPostWithTags(data)
}

export async function fetchRelatedPosts(
  postId: string,
  categoryId: string | null | undefined,
  tagIds: string[],
  limit = 5,
): Promise<RelatedPostsData> {
  const categoryPostsPromise = categoryId
    ? fetchPublishedPosts({ categoryId, limit: limit + 1 }).then((posts) =>
        posts.filter((post) => post.id !== postId).slice(0, limit),
      )
    : Promise.resolve<PostWithRelations[]>([])

  const tagPostsPromise =
    tagIds.length > 0
      ? supabase
          .from('posts')
          .select(`${POST_SELECT}, post_tags!inner(tag_id)`)
          .eq('status', 'published')
          .neq('id', postId)
          .in('post_tags.tag_id', tagIds)
          .order('published_at', { ascending: false })
          .limit(limit + 5)
          .then(({ data, error }) => {
            if (error) throw error

            const seen = new Set<string>()
            return (data ?? [])
              .map(mapPostWithTags)
              .filter((post) => {
                if (seen.has(post.id)) return false
                seen.add(post.id)
                return true
              })
              .slice(0, limit)
          })
      : Promise.resolve<PostWithRelations[]>([])

  const [categoryPosts, tagPosts] = await Promise.all([categoryPostsPromise, tagPostsPromise])
  const categoryIds = new Set(categoryPosts.map((post) => post.id))

  return {
    categoryPosts,
    tagPosts: tagPosts.filter((post) => !categoryIds.has(post.id)),
  }
}

export async function fetchAdminPosts(filters?: {
  status?: PostStatus
  search?: string
}): Promise<PostWithRelations[]> {
  let query = supabase
    .from('posts')
    .select(`${POST_SELECT}, post_tags(tag_id, tags(id, name, slug))`)
    .order('updated_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapPostWithTags)
}

export async function fetchPostById(id: string): Promise<PostWithRelations | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`${POST_SELECT}, post_tags(tag_id, tags(id, name, slug))`)
    .eq('id', id)
    .single()

  if (error) return null
  return mapPostWithTags(data)
}

export async function createPost(form: PostFormData, authorId: string): Promise<Post> {
  const publishedAt = form.status === 'published' ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: form.title,
      slug: form.slug,
      excerpt: buildExcerptFromContent(form.content),
      content: form.content,
      status: form.status,
      category_id: form.category_id,
      author_id: authorId,
      featured_image_url: form.featured_image_url,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      published_at: publishedAt,
    })
    .select()
    .single()

  if (error) throw error

  try {
    await syncPostTags(data.id, form.tag_ids)
  } catch (tagError) {
    await supabase.from('posts').delete().eq('id', data.id)
    throw tagError
  }

  return data
}

export async function updatePost(id: string, form: PostFormData): Promise<Post> {
  const { data: existing } = await supabase.from('posts').select('published_at, status').eq('id', id).single()

  let publishedAt = existing?.published_at ?? null
  if (form.status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('posts')
    .update({
      title: form.title,
      slug: form.slug,
      excerpt: buildExcerptFromContent(form.content),
      content: form.content,
      status: form.status,
      category_id: form.category_id,
      featured_image_url: form.featured_image_url,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await syncPostTags(id, form.tag_ids)
  return data
}

export async function autoSavePostDraft(
  form: PostFormData,
  authorId: string,
  existingPostId?: string | null,
): Promise<Post | null> {
  if (!hasMinimumAutoSaveContent(form)) return null

  const status = getAutoSaveStatus(form.status)
  const payload = buildPostPayload(form, status)

  if (!payload.slug) return null

  let slugTaken = await isSlugTaken(payload.slug, existingPostId ?? undefined)
  if (slugTaken) {
    payload.slug = `${payload.slug}-${Date.now().toString(36).slice(-4)}`
    slugTaken = await isSlugTaken(payload.slug, existingPostId ?? undefined)
    if (slugTaken) return null
  }

  if (existingPostId) {
    return updatePost(existingPostId, payload)
  }

  return createPost(payload, authorId)
}

export async function updatePostStatus(id: string, status: PostStatus): Promise<Post> {
  const { data: existing } = await supabase.from('posts').select('published_at').eq('id', id).single()

  let publishedAt = existing?.published_at ?? null
  if (status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('posts')
    .update({
      status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

function formatMonthChartLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace('.', '')
  const yearLabel = String(year).slice(-2)
  return `${monthLabel}/${yearLabel}`
}

function buildPostsPerMonthSeries(
  dateValues: string[],
  months = 12,
): PostsPerMonthPoint[] {
  const now = new Date()
  const buckets = new Map<string, number>()

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    buckets.set(monthKey, 0)
  }

  for (const dateValue of dateValues) {
    const date = new Date(dateValue)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!buckets.has(monthKey)) continue
    buckets.set(monthKey, (buckets.get(monthKey) ?? 0) + 1)
  }

  return [...buckets.entries()].map(([monthKey, count]) => ({
    monthKey,
    label: formatMonthChartLabel(monthKey),
    count,
  }))
}

export async function fetchPostsPerMonth(months = 12): Promise<PostsPerMonthPoint[]> {
  const { data, error } = await supabase.from('posts').select('created_at, published_at')
  if (error) throw error

  const dateValues = (data ?? []).map((post) => post.published_at ?? post.created_at)
  return buildPostsPerMonthSeries(dateValues, months)
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [postsResult, usersResult] = await Promise.all([
    supabase.from('posts').select('status'),
    supabase.from('profiles').select('is_active'),
  ])

  const posts = postsResult.data ?? []
  const users = usersResult.data ?? []
  return {
    totalPosts: posts.length,
    draftPosts: posts.filter((p) => p.status === 'draft').length,
    publishedPosts: posts.filter((p) => p.status === 'published').length,
    archivedPosts: posts.filter((p) => p.status === 'archived').length,
    activeUsers: users.filter((u) => u.is_active).length,
    totalUsers: users.length,
  }
}

async function syncPostTags(postId: string, tagIds: string[]): Promise<void> {
  await supabase.from('post_tags').delete().eq('post_id', postId)
  if (tagIds.length === 0) return

  const { error } = await supabase.from('post_tags').insert(
    tagIds.map((tag_id) => ({ post_id: postId, tag_id })),
  )
  if (error) throw error
}

function mapPostWithTags(raw: Record<string, unknown>): PostWithRelations {
  const postTags = (raw.post_tags as { tags: { id: string; name: string; slug: string } | null }[]) ?? []
  const tags = postTags.map((pt) => pt.tags).filter(Boolean) as { id: string; name: string; slug: string }[]

  const { post_tags: _postTags, ...post } = raw
  void _postTags
  return { ...(post as unknown as PostWithRelations), tags }
}
