import { supabase } from '@/lib/supabase/client'
import type { Tag } from '@/types/database'
import { slugify } from '@/lib/utils'

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export async function createTag(name: string): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, slug: slugify(name) })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTag(id: string, name: string): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .update({ name, slug: slugify(name) })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', id)
  if (error) throw error
}
