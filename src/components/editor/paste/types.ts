export interface UploadedPasteImage {
  publicUrl: string
  originalName: string
}

export type PasteImageUploadFn = (file: File, altText?: string) => Promise<UploadedPasteImage>

export type PasteSource = 'google-docs' | 'microsoft-word' | 'wordpress' | 'generic'
