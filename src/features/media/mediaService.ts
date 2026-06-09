import { supabase } from '@/lib/supabase/client'
import {
  buildStoragePath,
  getBucketForMimeType,
  getMediaTypeFromMime,
  storageAdapter,
} from '@/lib/storage/supabaseStorageAdapter'
import type { MediaAsset } from '@/types/database'

export const MEDIA_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const
export const MEDIA_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

export async function fetchMediaAssets(type?: string): Promise<MediaAsset[]> {
  let query = supabase.from('media_assets').select('*').order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function uploadMedia(file: File, userId: string, altText?: string): Promise<MediaAsset> {
  const bucket = getBucketForMimeType(file.type)
  const path = buildStoragePath(file.name)
  const { url } = await storageAdapter.upload(file, bucket, path)

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      filename: path.split('/').pop() ?? file.name,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: path,
      public_url: url,
      type: getMediaTypeFromMime(file.type),
      uploaded_by: userId,
      alt_text: altText ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMedia(asset: MediaAsset): Promise<void> {
  const bucket = asset.type === 'video' ? 'media-videos' : 'media-images'
  await storageAdapter.delete(bucket, asset.storage_path)
  const { error } = await supabase.from('media_assets').delete().eq('id', asset.id)
  if (error) throw error
}
