import {
  dataUrlToImageFile,
  getClipboardImageFiles,
} from '@/components/editor/clipboardImages'
import type { PasteImageUploadFn, UploadedPasteImage } from '@/components/editor/paste/types'

const BACKGROUND_IMAGE_URL_REGEX = /background-image:\s*url\(['"]?([^'")]+)['"]?\)/i

export function unwrapImagesFromSpans(doc: Document): void {
  doc.querySelectorAll('span img').forEach((img) => {
    const span = img.parentElement
    if (!span || span.tagName !== 'SPAN') return

    const parent = span.parentElement
    if (!parent) return

    parent.insertBefore(img, span)

    const spanText = span.textContent?.replace(img.textContent ?? '', '').trim() ?? ''
    if (!spanText && span.children.length === 0) {
      span.remove()
    }
  })
}

/** TipTap images are block nodes and cannot stay inside <p>. */
export function elevateImagesToBlockLevel(doc: Document): void {
  Array.from(doc.querySelectorAll('img')).forEach((img) => {
    const paragraph = img.closest('p')
    if (!paragraph?.parentElement) return

    const parent = paragraph.parentElement
    const textClone = paragraph.cloneNode(true) as HTMLElement
    textClone.querySelectorAll('img').forEach((node) => node.remove())
    const hasText = Boolean(textClone.textContent?.trim())

    img.remove()

    if (hasText) {
      parent.insertBefore(img, paragraph.nextSibling)
      return
    }

    parent.insertBefore(img, paragraph)
    if (!paragraph.textContent?.trim()) paragraph.remove()
  })
}

function findImagePlaceholders(doc: Document): Element[] {
  const placeholders: Element[] = []

  doc.querySelectorAll('span[style], div[style], p[style]').forEach((element) => {
    if (element.querySelector('img')) return

    const style = element.getAttribute('style') ?? ''
    const hasDimensions = /width:\s*\d+px/i.test(style) && /height:\s*\d+px/i.test(style)
    const hasBackground = BACKGROUND_IMAGE_URL_REGEX.test(style)
    const isEmpty = (element.textContent?.trim() ?? '') === ''

    if ((hasDimensions || hasBackground) && isEmpty) {
      placeholders.push(element)
    }
  })

  return placeholders
}

async function safeUpload(
  upload: PasteImageUploadFn,
  file: File,
  altText?: string,
): Promise<UploadedPasteImage | null> {
  try {
    return await upload(file, altText ?? file.name)
  } catch (error) {
    console.warn('[paste] Image upload failed, keeping original source', error)
    return null
  }
}

async function uploadImageSource(
  src: string,
  index: number,
  upload: PasteImageUploadFn,
): Promise<string | null> {
  const trimmed = src.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) return trimmed

  if (trimmed.startsWith('data:image/')) {
    const file = await dataUrlToImageFile(trimmed, index)
    if (!file) return trimmed
    const asset = await safeUpload(upload, file, file.name)
    return asset?.publicUrl ?? trimmed
  }

  return null
}

async function assignClipboardImageToElement(
  element: Element,
  file: File,
  upload: PasteImageUploadFn,
): Promise<void> {
  const asset = await safeUpload(upload, file, file.name)
  if (!asset) return

  const img = element.ownerDocument.createElement('img')
  img.setAttribute('src', asset.publicUrl)
  img.setAttribute('alt', asset.originalName)
  element.replaceWith(img)
}

async function convertBackgroundImageElements(doc: Document, upload: PasteImageUploadFn): Promise<void> {
  const elements = Array.from(doc.querySelectorAll('[style*="background-image"]'))

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index]
    if (element.querySelector('img')) continue

    const style = element.getAttribute('style') ?? ''
    const match = style.match(BACKGROUND_IMAGE_URL_REGEX)
    const source = match?.[1]?.trim()
    if (!source) continue

    const uploadedUrl = await uploadImageSource(source, index, upload)
    if (!uploadedUrl) continue

    const img = doc.createElement('img')
    img.setAttribute('src', uploadedUrl)
    img.setAttribute('alt', `pasted-image-${index + 1}`)
    element.replaceWith(img)
  }
}

async function processImgElements(
  doc: Document,
  clipboardImages: File[],
  upload: PasteImageUploadFn,
): Promise<number> {
  let clipboardIndex = 0
  const images = Array.from(doc.querySelectorAll('img'))

  for (let index = 0; index < images.length; index += 1) {
    const img = images[index]
    const src = img.getAttribute('src')?.trim() ?? ''

    if (!src || src.startsWith('file:') || src.startsWith('images/')) {
      const file = clipboardImages[clipboardIndex]
      if (!file) continue

      clipboardIndex += 1
      const asset = await safeUpload(upload, file, file.name)
      if (!asset) continue

      img.setAttribute('src', asset.publicUrl)
      img.setAttribute('alt', asset.originalName)
      continue
    }

    const uploadedUrl = await uploadImageSource(src, index, upload)
    if (!uploadedUrl) continue

    img.setAttribute('src', uploadedUrl)
    img.removeAttribute('srcset')
    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', `pasted-image-${index + 1}`)
    }
  }

  return clipboardIndex
}

export function removeBrokenImages(doc: Document): void {
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src')?.trim() ?? ''
    if (!src || src.startsWith('file:') || src.startsWith('images/')) img.remove()
  })
}

export function normalizePasteImageStructure(doc: Document): void {
  unwrapImagesFromSpans(doc)
  elevateImagesToBlockLevel(doc)
}

export async function processPasteImages(
  doc: Document,
  clipboardData: DataTransfer,
  upload: PasteImageUploadFn,
): Promise<void> {
  const clipboardImages = getClipboardImageFiles(clipboardData)

  await convertBackgroundImageElements(doc, upload)
  elevateImagesToBlockLevel(doc)

  let clipboardIndex = await processImgElements(doc, clipboardImages, upload)

  const placeholders = findImagePlaceholders(doc)
  for (const placeholder of placeholders) {
    const file = clipboardImages[clipboardIndex]
    if (!file) break

    clipboardIndex += 1
    await assignClipboardImageToElement(placeholder, file, upload)
  }

  elevateImagesToBlockLevel(doc)
  removeBrokenImages(doc)
}
