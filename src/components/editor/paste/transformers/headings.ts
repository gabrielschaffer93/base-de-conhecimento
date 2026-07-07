import { isOrphanListMarker } from '@/components/editor/paste/transformers/lists'

const TEMPLATE_LABEL_REGEX = /^(titulo|título|title|subtitulo|subtítulo|subtitle)$/i

export function removeTemplateNoise(doc: Document): void {
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

export function unwrapRedundantSpans(doc: Document): void {
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

export function promoteDocumentTitle(doc: Document): void {
  const firstBlock = doc.body.firstElementChild
  if (!firstBlock || firstBlock.tagName !== 'P') return

  const text = firstBlock.textContent?.trim() ?? ''
  if (!text || text.length > 160) return

  const boldEls = Array.from(firstBlock.querySelectorAll('b, strong'))
  if (boldEls.length === 0) return

  const boldText = boldEls.map((el) => el.textContent ?? '').join('').trim()
  const boldRatio = boldText.length / text.length

  if (boldRatio < 0.85) return
  if (/^\d+[.)]\s/.test(text)) return

  const heading = doc.createElement('h1')
  while (firstBlock.firstChild) heading.appendChild(firstBlock.firstChild)
  firstBlock.replaceWith(heading)
}

export function promoteAllBoldParagraphsToHeadings(doc: Document): void {
  doc.querySelectorAll('p').forEach((paragraph) => {
    if (paragraph.closest('li')) return

    const text = paragraph.textContent?.trim() ?? ''
    if (!text || text.length > 120) return
    if (/^\d+[.)]\s/.test(text)) return

    const boldEls = Array.from(paragraph.querySelectorAll('b, strong'))
    if (boldEls.length === 0) return

    const boldText = boldEls.map((el) => el.textContent ?? '').join('').trim()
    const boldRatio = boldText.length / text.length
    if (boldRatio < 0.9) return

    const heading = doc.createElement('h2')
    while (paragraph.firstChild) heading.appendChild(paragraph.firstChild)
    paragraph.replaceWith(heading)
  })
}

export function normalizePasteHeadings(doc: Document): void {
  promoteDocumentTitle(doc)
  promoteAllBoldParagraphsToHeadings(doc)
}
