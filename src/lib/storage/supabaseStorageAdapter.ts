import { supabase } from '@/lib/supabase/client'
import type { StorageAdapter, UploadResult } from '@/lib/storage/storageAdapter'

export class SupabaseStorageAdapter implements StorageAdapter {
  async upload(file: File, bucket: string, path: string): Promise<UploadResult> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) throw error

    return {
      url: this.getPublicUrl(bucket, path),
      path,
    }
  }

  async delete(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }
}

export function buildStoragePath(filename: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uuid = crypto.randomUUID()
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${year}/${month}/${uuid}-${safeName}`
}

export function getBucketForMimeType(mimeType: string): string {
  if (mimeType.startsWith('video/')) return 'media-videos'
  return 'media-images'
}

export function getMediaTypeFromMime(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}

export const storageAdapter: StorageAdapter = new SupabaseStorageAdapter()
