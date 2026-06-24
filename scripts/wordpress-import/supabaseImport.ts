import type { SupabaseClient } from '@supabase/supabase-js'

import { slugify } from './utils.js'

function throwIfError(error: { message: string; details?: string; hint?: string; code?: string } | null) {
  if (error) {
    const parts = [error.message, error.details, error.hint, error.code].filter(Boolean)
    throw new Error(parts.join(' | '))
  }
}

async function ensureCategory(supabase: SupabaseClient, name: string): Promise<string> {
  const slug = slugify(name)
  const { data: existing, error: selectError } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (selectError) throwIfError(selectError)
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, sort_order: 0 })
    .select('id')
    .single()

  if (error) throwIfError(error)
  return data.id
}

async function ensureTag(supabase: SupabaseClient, name: string): Promise<string> {
  const slug = slugify(name)
  const { data: existing, error: selectError } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (selectError) throwIfError(selectError)
  if (existing) return existing.id

  const { data, error } = await supabase.from('tags').insert({ name, slug }).select('id').single()
  if (error) throwIfError(error)
  return data.id
}

export interface ImportPostInput {
  title: string
  slug: string
  excerpt: string | null
  content: Record<string, unknown>
  categoryName: string | null
  tagNames: string[]
  publishedAt: string | null
}

export interface ImportPostResult {
  postId: string
  action: 'created' | 'updated'
  categoryName: string | null
  tagNames: string[]
}

export async function importPost(
  supabase: SupabaseClient,
  input: ImportPostInput,
): Promise<ImportPostResult> {
  const categoryId = input.categoryName ? await ensureCategory(supabase, input.categoryName) : null
  const tagIds = await Promise.all(input.tagNames.map((name) => ensureTag(supabase, name)))

  const { data: existing, error: existingError } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', input.slug)
    .maybeSingle()

  if (existingError) throwIfError(existingError)

  const publishedAt = input.publishedAt ?? new Date().toISOString()
  const payload = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content: input.content,
    status: 'published' as const,
    category_id: categoryId,
    author_id: null,
    featured_image_url: null,
    meta_title: input.title,
    meta_description: input.excerpt,
    published_at: publishedAt,
  }

  let postId: string
  let action: 'created' | 'updated'

  if (existing) {
    const { data, error } = await supabase
      .from('posts')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single()

    if (error) throwIfError(error)
    postId = data.id
    action = 'updated'
  } else {
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...payload, created_at: publishedAt })
      .select('id')
      .single()
    if (error) throwIfError(error)
    postId = data.id
    action = 'created'
  }

  await supabase.from('post_tags').delete().eq('post_id', postId)

  if (tagIds.length > 0) {
    const { error: tagLinkError } = await supabase.from('post_tags').insert(
      tagIds.map((tagId) => ({
        post_id: postId,
        tag_id: tagId,
      })),
    )

    if (tagLinkError) throwIfError(tagLinkError)
  }

  return {
    postId,
    action,
    categoryName: input.categoryName,
    tagNames: input.tagNames,
  }
}
