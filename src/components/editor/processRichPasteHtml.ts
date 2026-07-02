import {
  dataUrlToImageFile,
  getClipboardImageFiles,
  normalizeImageFile,
} from '@/components/editor/clipboardImages'

export interface UploadedPasteImage {
  publicUrl: string
  originalName: string
}

export type PasteImageUploadFn = (file: File, altText?: string) => Promise<UploadedPasteImage>

const BACKGROUND_IMAGE_URL_REGEX = /background-image:\s*url\(['"]?([^'")]+)['"]?\)/i
const GOOGLE_DOCS_GUID_SELECTOR = 'b[id^="docs-internal-guid"]'
const ORPHAN_LIST_MARKER_REGEX = /^[\d]+[.)]?$/
const ORPHAN_BULLET_REGEX = /^[.·•●∙◦○\-–—\u00b7\u2022\u2023\u25e6\u2043\uf0b7]$/
const TEMPLATE_LABEL_REGEX = /^(titulo|título|title|subtitulo|subtítulo|subtitle)$/i

function isOrphanListMarker(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (ORPHAN_LIST_MARKER_REGEX.test(trimmed)) return true
  if (ORPHAN_BULLET_REGEX.test(trimmed)) return true
  return trimmed.length <= 2 && /^[.\s·•●∙◦○\-–—]+$/u.test(trimmed)
}

function unwrapGoogleDocsRoot(doc: Document): void {
  doc.querySelectorAll(GOOGLE_DOCS_GUID_SELECTOR).forEach((wrapper) => {
    const parent = wrapper.parentNode
    if (!parent) return

    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper)
    }

    parent.removeChild(wrapper)
  })
}

function cleanupPasteDocument(doc: Document): void {
  doc.querySelectorAll('meta, link, title, style, script').forEach((node) => node.remove())
}

function removeTemplateNoise(doc: Document): void {
  doc.querySelectorAll('p, li').forEach((element) => {
    const text = element.textContent?.trim() ?? ''
    if (TEMPLATE_LABEL_REGEX.test(text)) element.remove()
  })

  let first = doc.body.firstElementChild
  while (first) {
    const text = first.textContent?.trim() ?? ''
    const isLeadingMarker = isOrphanListMarker(text) && !first.querySelector('img')
    if (!isLeadingMarker) break

    const next = first.nextElementSibling
    first.remove()
    first = next ?? null
  }
}

function stripGoogleDocsTypography(doc: Document): void {
  doc.querySelectorAll('[style]').forEach((element) => {
    const style = element
      .getAttribute('style')
      ?.replace(/font-size:\s*[^;]+;?/gi, '')
      .replace(/font-family:\s*[^;]+;?/gi, '')
      .replace(/color:\s*[^;]+;?/gi, '')
      .replace(/background-color:\s*[^;]+;?/gi, '')
      .replace(/line-height:\s*[^;]+;?/gi, '')
      .replace(/margin-top:\s*[^;]+;?/gi, '')
      .replace(/margin-bottom:\s*[^;]+;?/gi, '')
      .replace(/padding:\s*[^;]+;?/gi, '')
      .replace(/text-indent:\s*[^;]+;?/gi, '')
      .trim()

    if (style) element.setAttribute('style', style)
    else element.removeAttribute('style')
  })
}

function unwrapRedundantSpans(doc: Document): void {
  let changed = true

  while (changed) {
    changed = false

    doc.querySelectorAll('span').forEach((span) => {
      if (span.attributes.length > 0 || !span.parentElement) return

      while (span.firstChild) {
        span.parentElement.insertBefore(span.firstChild, span)
      }

      span.remove()
      changed = true
    })
  }
}

function isLooseListItemParagraph(element: Element): boolean {
  if (element.tagName !== 'P') return false

  const text = element.textContent?.trim() ?? ''
  if (!text || isOrphanListMarker(text)) return false

  if (/^para (receber|enviar)/i.test(text)) return false

  if (/^configuração de/i.test(text) && /:\s/.test(text)) return true

  const firstBold = element.querySelector(':scope b, :scope strong')
  if (!firstBold) return false

  const boldText = firstBold.textContent?.trim() ?? ''
  if (!boldText.endsWith(':') || boldText.length > 100) return false
  if (/^para /i.test(boldText)) return false

  const boldIndex = text.indexOf(boldText)
  return boldIndex >= 0 && boldIndex <= 3 && text.length > boldText.length + 15
}

function reconstructLooseNumberedLists(doc: Document): void {
  let changed = true

  while (changed) {
    changed = false
    const children = Array.from(doc.body.children)

    for (let index = 0; index < children.length; index += 1) {
      const current = children[index]
      if (current.tagName !== 'P' || !isLooseListItemParagraph(current)) continue

      const group: Element[] = [current]
      let nextIndex = index + 1

      while (nextIndex < children.length) {
        const next = children[nextIndex]
        if (!(next instanceof Element)) break

        if (next.tagName === 'P' && isOrphanListMarker(next.textContent?.trim() ?? '')) {
          next.remove()
          nextIndex += 1
          continue
        }

        if (next.tagName === 'P' && isLooseListItemParagraph(next)) {
          group.push(next)
          nextIndex += 1
          continue
        }

        break
      }

      if (group.length < 2) continue

      const list = doc.createElement('ol')
      group.forEach((paragraph) => {
        const listItem = doc.createElement('li')
        const innerParagraph = doc.createElement('p')
        while (paragraph.firstChild) innerParagraph.appendChild(paragraph.firstChild)
        listItem.appendChild(innerParagraph)
        list.appendChild(listItem)
        paragraph.remove()
      })

      doc.body.insertBefore(list, children[index])
      changed = true
      break
    }
  }
}

function wrapListItemParagraphs(doc: Document): void {
  doc.querySelectorAll('ol > li, ul > li').forEach((listItem) => {
    if (listItem.querySelector(':scope > p')) return

    const paragraph = doc.createElement('p')
    while (listItem.firstChild) paragraph.appendChild(listItem.firstChild)

    if (paragraph.textContent?.trim() || paragraph.querySelector('img')) {
      listItem.appendChild(paragraph)
    }
  })
}

function promoteDocumentTitle(doc: Document): void {
  const firstBlock = doc.body.firstElementChild
  if (!firstBlock || firstBlock.tagName !== 'P') return

  const text = firstBlock.textContent?.trim() ?? ''
  if (!text || text.length > 160 || !firstBlock.querySelector('b, strong')) return

  const heading = doc.createElement('h1')
  while (firstBlock.firstChild) heading.appendChild(firstBlock.firstChild)
  firstBlock.replaceWith(heading)
}

function removeOrphanMarkerNodes(doc: Document): void {
  doc.querySelectorAll('p, li').forEach((element) => {
    const text = element.textContent?.trim() ?? ''
    if (isOrphanListMarker(text) && !element.querySelector('img')) {
      element.remove()
    }
  })

  doc.querySelectorAll('ul, ol').forEach((list) => {
    const items = Array.from(list.children).filter((child) => child.tagName === 'LI')
    if (items.length === 0) {
      list.remove()
      return
    }

    const onlyMarkers = items.every((item) => {
      const text = item.textContent?.trim() ?? ''
      return isOrphanListMarker(text) && !item.querySelector('img')
    })

    if (onlyMarkers) list.remove()
  })
}

function mergeSplitListItems(doc: Document): void {
  doc.querySelectorAll('ol, ul').forEach((list) => {
    let items = Array.from(list.children).filter((child) => child.tagName === 'LI')

    for (let index = 0; index < items.length - 1; index += 1) {
      const current = items[index]
      const next = items[index + 1]
      const currentText = current.textContent?.trim() ?? ''
      const nextText = next.textContent?.trim() ?? ''

      const currentIsMarker = isOrphanListMarker(currentText) && !current.querySelector('img')
      const nextHasContent = nextText.length > 0 && !isOrphanListMarker(nextText)

      if (!currentIsMarker || !nextHasContent) continue

      while (next.firstChild) {
        current.appendChild(next.firstChild)
      }

      next.remove()
      items = Array.from(list.children).filter((child) => child.tagName === 'LI')
      index -= 1
    }
  })
}

function removeEmptyListItems(doc: Document): void {
  doc.querySelectorAll('li').forEach((item) => {
    const text = item.textContent?.trim() ?? ''
    const hasMedia = item.querySelector('img, video, iframe')
    if (!text && !hasMedia) item.remove()
  })

  doc.querySelectorAll('ol, ul').forEach((list) => {
    if (list.children.length === 0) list.remove()
  })
}

function unwrapImagesFromSpans(doc: Document): void {
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
function elevateImagesToBlockLevel(doc: Document): void {
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

async function uploadImageSource(
  src: string,
  index: number,
  upload: PasteImageUploadFn,
): Promise<string | null> {
  const trimmed = src.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('data:image/')) {
    const file = await dataUrlToImageFile(trimmed, index)
    if (!file) return null
    const asset = await upload(file, file.name)
    return asset.publicUrl
  }

  if (!/^https?:\/\//i.test(trimmed)) return null

  try {
    const response = await fetch(trimmed)
    if (!response.ok) return trimmed

    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) return trimmed

    const file = normalizeImageFile(
      new File([blob], `pasted-image-${Date.now()}-${index}`, { type: blob.type }),
      index,
    )
    const asset = await upload(file, file.name)
    return asset.publicUrl
  } catch {
    return trimmed
  }
}

async function assignClipboardImageToElement(
  element: Element,
  file: File,
  upload: PasteImageUploadFn,
): Promise<void> {
  const asset = await upload(file, file.name)
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
      const asset = await upload(file, file.name)
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

function removeBrokenImages(doc: Document): void {
  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src')?.trim() ?? ''
    if (!src || src.startsWith('file:') || src.startsWith('images/')) img.remove()
  })
}

export async function processRichPasteHtml(
  html: string,
  clipboardData: DataTransfer,
  upload: PasteImageUploadFn,
): Promise<string> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const clipboardImages = getClipboardImageFiles(clipboardData)

  unwrapGoogleDocsRoot(doc)
  cleanupPasteDocument(doc)
  removeTemplateNoise(doc)
  stripGoogleDocsTypography(doc)
  unwrapRedundantSpans(doc)
  mergeSplitListItems(doc)
  removeOrphanMarkerNodes(doc)
  reconstructLooseNumberedLists(doc)
  wrapListItemParagraphs(doc)
  promoteDocumentTitle(doc)
  removeEmptyListItems(doc)
  unwrapImagesFromSpans(doc)
  elevateImagesToBlockLevel(doc)
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
  mergeSplitListItems(doc)
  removeOrphanMarkerNodes(doc)
  reconstructLooseNumberedLists(doc)
  wrapListItemParagraphs(doc)
  removeTemplateNoise(doc)
  removeEmptyListItems(doc)

  return doc.body.innerHTML
}
