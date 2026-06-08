import { supabase } from '@/lib/supabase/client'

const AVATAR_BUCKET = 'media-images'

export function extractAvatarPath(avatarUrl: string): string {
  if (!avatarUrl.startsWith('http')) return avatarUrl.split('?')[0]

  const marker = `/public/${AVATAR_BUCKET}/`
  const publicIndex = avatarUrl.indexOf(marker)
  if (publicIndex !== -1) {
    return avatarUrl.slice(publicIndex + marker.length).split('?')[0]
  }

  const objectMarker = `/object/${AVATAR_BUCKET}/`
  const objectIndex = avatarUrl.indexOf(objectMarker)
  if (objectIndex !== -1) {
    return avatarUrl.slice(objectIndex + objectMarker.length).split('?')[0]
  }

  return avatarUrl
}

export async function getAvatarDisplayUrl(avatarUrl: string | null): Promise<string | null> {
  if (!avatarUrl?.trim()) return null

  const path = extractAvatarPath(avatarUrl)
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function getAvatarSignedUrl(avatarUrl: string | null): Promise<string | null> {
  if (!avatarUrl?.trim()) return null

  const path = extractAvatarPath(avatarUrl)
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function updateOwnProfile(input: {
  fullName?: string
  avatarUrl?: string | null
}): Promise<import('@/types/database').Profile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw userError ?? new Error('Not authenticated')

  const updates: { full_name?: string; avatar_url?: string | null } = {}

  if (input.fullName !== undefined) updates.full_name = input.fullName
  if (input.avatarUrl !== undefined) {
    updates.avatar_url = input.avatarUrl ? extractAvatarPath(input.avatarUrl) : null
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension

  if (!['jpg', 'png', 'webp', 'gif'].includes(normalizedExtension)) {
    throw new Error('Formato não suportado. Use JPG, PNG, WebP ou GIF.')
  }

  const path = `avatars/${userId}/avatar.${normalizedExtension}`
  const contentType = file.type || `image/${normalizedExtension === 'jpg' ? 'jpeg' : normalizedExtension}`

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType,
  })

  if (error) throw error
  return path
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export { getErrorMessage }
