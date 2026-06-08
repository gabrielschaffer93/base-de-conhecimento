export interface UploadResult {
  url: string
  path: string
}

export interface StorageAdapter {
  upload(file: File, bucket: string, path: string): Promise<UploadResult>
  delete(bucket: string, path: string): Promise<void>
  getPublicUrl(bucket: string, path: string): string
}
