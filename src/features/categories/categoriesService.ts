import { supabase } from '@/lib/supabase/client'
import type { Category } from '@/types/database'
import { slugify } from '@/lib/utils'

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).single()
  if (error) return null
  return data
}

export async function createCategory(input: {
  name: string
  description?: string
  parent_id?: string | null
}): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name,
      slug: slugify(input.name),
      description: input.description ?? null,
      parent_id: input.parent_id ?? null,
      sort_order: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(
  id: string,
  input: { name: string; description?: string; parent_id?: string | null },
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: input.name,
      slug: slugify(input.name),
      description: input.description ?? null,
      parent_id: input.parent_id ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
