import type { StorageAdapter, UploadResult } from '@/lib/storage/storageAdapter'

/**
 * Stub adapter for future Loft internal storage migration.
 * Implement this class when migrating off Supabase Storage.
 * See docs/MIGRATION-LOFT.md for the migration checklist.
 */
export class LoftStorageAdapter implements StorageAdapter {
  async upload(file: File, bucket: string, path: string): Promise<UploadResult> {
    void file
    void bucket
    void path
    throw new Error('LoftStorageAdapter is not implemented yet. Use SupabaseStorageAdapter.')
  }

  async delete(bucket: string, path: string): Promise<void> {
    void bucket
    void path
    throw new Error('LoftStorageAdapter is not implemented yet. Use SupabaseStorageAdapter.')
  }

  getPublicUrl(bucket: string, path: string): string {
    void bucket
    void path
    throw new Error('LoftStorageAdapter is not implemented yet. Use SupabaseStorageAdapter.')
  }
}
