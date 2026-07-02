const DATA_URL_IMAGE_SRC_REGEX = /<img[^>]+src=["'](data:image\/[^"']+)["']/gi
const HAS_DATA_URL_IMAGE_REGEX = /<img[^>]+src=["']data:image\/[^"']+["']/i
const HAS_HTML_IMAGE_REGEX = /<img[\s>]/i
const HAS_GOOGLE_IMAGE_REGEX = /googleusercontent\.com/i
const HAS_BACKGROUND_IMAGE_REGEX = /background-image:\s*url/i

export function normalizeImageFile(file: File, index = 0): File {
  const type = file.type?.startsWith('image/') ? file.type : 'image/png'
  const extension = type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png'
  const hasUsableName = file.name && !/^image\.(png|jpe?g|gif|webp)$/i.test(file.name)
  const name = hasUsableName ? file.name : `pasted-image-${Date.now()}-${index}.${extension}`

  if (file.type === type && file.name === name) return file
  return new File([file], name, { type })
}

export function getClipboardImageFiles(clipboardData: DataTransfer): File[] {
  const images: File[] = []
  const seen = new Set<string>()

  const add = (file: File | null) => {
    if (!file) return

    const type = file.type?.startsWith('image/') ? file.type : 'image/png'
    if (!type.startsWith('image/')) return

    const key = `${file.name}-${file.size}-${file.lastModified}-${type}`
    if (seen.has(key)) return

    seen.add(key)
    images.push(normalizeImageFile(file, images.length))
  }

  for (const file of Array.from(clipboardData.files)) {
    add(file)
  }

  for (const item of Array.from(clipboardData.items)) {
    if (item.type.startsWith('image/')) {
      add(item.getAsFile())
    }
  }

  return images
}

export function clipboardHasImages(clipboardData: DataTransfer): boolean {
  if (getClipboardImageFiles(clipboardData).length > 0) return true

  for (const item of Array.from(clipboardData.items)) {
    if (item.type.startsWith('image/')) return true
  }

  const html = clipboardData.getData('text/html')
  if (!html) return false

  if (HAS_DATA_URL_IMAGE_REGEX.test(html)) return true
  if (HAS_HTML_IMAGE_REGEX.test(html)) return true
  if (HAS_GOOGLE_IMAGE_REGEX.test(html)) return true
  if (HAS_BACKGROUND_IMAGE_REGEX.test(html)) return true

  return false
}

function isRichDocumentPaste(clipboardData: DataTransfer): boolean {
  const plainText = clipboardData.getData('text/plain').trim()
  const html = clipboardData.getData('text/html').trim()

  if (plainText.length === 0) return false

  if (html.length > 0) {
    const hasDocumentStructure = /<(?:p|div|h[1-6]|ul|ol|li|table|span|br|meta|body)[\s/>]/i.test(html)
    if (hasDocumentStructure) return true
  }

  return plainText.length > 20
}

/** Only take over paste for image-only clipboard (screenshots). Rich docs keep native HTML paste. */
export function shouldInterceptImagePaste(clipboardData: DataTransfer): boolean {
  if (!clipboardHasImages(clipboardData)) return false
  if (isRichDocumentPaste(clipboardData)) return false

  const plainText = clipboardData.getData('text/plain').trim()
  const html = clipboardData.getData('text/html').trim()
  const imageFiles = getClipboardImageFiles(clipboardData)

  if (imageFiles.length > 0 && plainText.length === 0 && html.length === 0) return true
  if (imageFiles.length > 0 && plainText.length <= 5) return true
  if (html && plainText.length === 0 && HAS_DATA_URL_IMAGE_REGEX.test(html)) return true

  return false
}

export function clipboardHasEmbeddedDataUrlImages(clipboardData: DataTransfer): boolean {
  const html = clipboardData.getData('text/html')
  return Boolean(html && HAS_DATA_URL_IMAGE_REGEX.test(html))
}

/** Rich paste from Google Docs / Word with images that TipTap cannot handle natively. */
export function shouldProcessRichDocumentPaste(clipboardData: DataTransfer): boolean {
  if (!isRichDocumentPaste(clipboardData)) return false
  return clipboardHasImages(clipboardData)
}

export async function dataUrlToImageFile(dataUrl: string, index: number): Promise<File | null> {
  try {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    if (!blob.type.startsWith('image/') && !dataUrl.startsWith('data:image/')) return null

    const mimeMatch = dataUrl.match(/^data:(image\/[^;]+);/)
    const type = blob.type?.startsWith('image/') ? blob.type : mimeMatch?.[1] ?? 'image/png'

    return normalizeImageFile(new File([blob], `pasted-image-${Date.now()}-${index}`, { type }), index)
  } catch {
    return null
  }
}

async function extractImageFilesFromHtml(html: string): Promise<File[]> {
  const files: File[] = []
  const seen = new Set<string>()

  for (const match of html.matchAll(DATA_URL_IMAGE_SRC_REGEX)) {
    const dataUrl = match[1]
    if (!dataUrl || seen.has(dataUrl)) continue

    seen.add(dataUrl)
    const file = await dataUrlToImageFile(dataUrl, files.length)
    if (file) files.push(file)
  }

  return files
}

export async function getClipboardImages(clipboardData: DataTransfer): Promise<File[]> {
  const fromFiles = getClipboardImageFiles(clipboardData)
  if (fromFiles.length > 0) return fromFiles

  for (const item of Array.from(clipboardData.items)) {
    if (!item.type.startsWith('image/')) continue
    const file = item.getAsFile()
    if (file) return [normalizeImageFile(file, 0)]
  }

  const html = clipboardData.getData('text/html')
  if (html) {
    const fromHtml = await extractImageFilesFromHtml(html)
    if (fromHtml.length > 0) return fromHtml
  }

  return []
}
