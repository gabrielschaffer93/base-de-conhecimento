import { parseVideoEmbedUrl, type ParsedVideoEmbed } from '@/lib/videoEmbeds'

function createVideoEmbedDiv(doc: Document, parsed: ParsedVideoEmbed): HTMLDivElement {
  const div = doc.createElement('div')
  div.setAttribute('data-video-embed', '')
  div.setAttribute('data-provider', parsed.provider)
  div.setAttribute('data-src', parsed.embedSrc)
  div.setAttribute('data-href', parsed.href)
  return div
}

function isYoutubeThumbnail(src: string): boolean {
  return /ytimg\.com|youtube\.com\/img/i.test(src)
}

function youtubeIdFromThumbnail(src: string): string | null {
  const match = src.match(/\/vi\/([^/]+)\//)
  return match?.[1] ?? null
}

function convertIframesToVideoEmbeds(doc: Document): void {
  const iframes = Array.from(doc.querySelectorAll('iframe[src]'))

  for (const iframe of iframes) {
    const parsed = parseVideoEmbedUrl(iframe.getAttribute('src') ?? '')
    if (!parsed) continue
    iframe.replaceWith(createVideoEmbedDiv(doc, parsed))
  }
}

function convertYoutubeLinksToEmbeds(doc: Document): void {
  const anchors = Array.from(doc.querySelectorAll('a[href]'))

  for (const anchor of anchors) {
    const parsed = parseVideoEmbedUrl(anchor.getAttribute('href') ?? '')
    if (!parsed) continue

    const label = anchor.textContent?.trim() ?? ''
    const isClickHere = /^clique aqui$/i.test(label)
    const wrapsThumbnail =
      anchor.querySelector('img') &&
      isYoutubeThumbnail(anchor.querySelector('img')?.getAttribute('src') ?? '')

    if (!isClickHere && !wrapsThumbnail) continue

    const paragraph = anchor.closest('p')
    if (paragraph) {
      const withoutLink = (paragraph.textContent ?? '')
        .replace(label, '')
        .replace(/\s*:\s*$/, '')
        .trim()

      if (withoutLink) {
        anchor.remove()
        paragraph.insertAdjacentElement('afterend', createVideoEmbedDiv(doc, parsed))
        continue
      }
    }

    const replaceTarget = anchor.closest('p') ?? anchor
    replaceTarget.replaceWith(createVideoEmbedDiv(doc, parsed))
  }
}

function convertStandaloneVideoUrls(doc: Document): void {
  doc.querySelectorAll('p').forEach((paragraph) => {
    const text = paragraph.textContent?.trim() ?? ''
    const parsed = parseVideoEmbedUrl(text)
    if (!parsed) return
    if (paragraph.querySelector('img, iframe, a, div[data-video-embed]')) return
    paragraph.replaceWith(createVideoEmbedDiv(doc, parsed))
  })
}

function convertYoutubeThumbnailsToEmbeds(doc: Document): void {
  doc.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src') ?? ''
    if (!isYoutubeThumbnail(src)) return

    const videoId = youtubeIdFromThumbnail(src)
    const parsed = videoId
      ? parseVideoEmbedUrl(`https://www.youtube.com/watch?v=${videoId}`)
      : null
    if (!parsed) return

    const parentLink = img.closest('a[href]')
    if (parentLink) {
      const fromLink = parseVideoEmbedUrl(parentLink.getAttribute('href') ?? '')
      img.replaceWith(createVideoEmbedDiv(doc, fromLink ?? parsed))
      if (parentLink.querySelector('img')) return
      parentLink.remove()
      return
    }

    img.replaceWith(createVideoEmbedDiv(doc, parsed))
  })
}

export function convertVideoEmbedsInDocument(doc: Document): void {
  convertIframesToVideoEmbeds(doc)
  convertYoutubeThumbnailsToEmbeds(doc)
  convertYoutubeLinksToEmbeds(doc)
  convertStandaloneVideoUrls(doc)
}
