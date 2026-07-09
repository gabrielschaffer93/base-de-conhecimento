const ORPHAN_LIST_MARKER_REGEX = /^[\d]+[.)]?$/
const ORPHAN_BULLET_REGEX = /^[.·•●∙◦○\-–—\u00b7\u2022\u2023\u25e6\u2043\uf0b7]$/
const ORPHAN_NUMBER_ONLY_REGEX = /^\d+[.):]?\s*$/

export function isOrphanListMarker(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (ORPHAN_LIST_MARKER_REGEX.test(trimmed)) return true
  if (ORPHAN_BULLET_REGEX.test(trimmed)) return true
  return trimmed.length <= 2 && /^[.\s·•●∙◦○\-–—]+$/u.test(trimmed)
}

function isOrphanNumberParagraph(text: string): boolean {
  return ORPHAN_NUMBER_ONLY_REGEX.test(text.trim())
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

export function mergeOrphanNumbersWithNextParagraph(doc: Document): void {
  let changed = true

  while (changed) {
    changed = false
    const children = Array.from(doc.body.children)

    for (let index = 0; index < children.length - 1; index += 1) {
      const current = children[index]
      const next = children[index + 1]

      if (!(current instanceof Element) || !(next instanceof Element)) continue
      if (current.tagName !== 'P' || next.tagName !== 'P') continue

      const currentText = current.textContent?.trim() ?? ''
      if (!isOrphanNumberParagraph(currentText)) continue

      const nextText = next.textContent?.trim() ?? ''
      if (!nextText) continue

      while (current.firstChild) current.removeChild(current.firstChild)
      while (next.firstChild) current.appendChild(next.firstChild)
      next.remove()
      changed = true
      break
    }
  }
}

export function mergeOrphanNumbersInsideListItems(doc: Document): void {
  doc.querySelectorAll('li').forEach((listItem) => {
    Array.from(listItem.querySelectorAll(':scope > p')).forEach((paragraph) => {
      const text = paragraph.textContent?.trim() ?? ''
      if (isOrphanNumberParagraph(text)) paragraph.remove()
    })
  })
}

export function reconstructLooseNumberedLists(doc: Document): void {
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
      const anchor = children[index + group.length] ?? null

      group.forEach((paragraph) => {
        const listItem = doc.createElement('li')
        const innerParagraph = doc.createElement('p')
        while (paragraph.firstChild) innerParagraph.appendChild(paragraph.firstChild)
        listItem.appendChild(innerParagraph)
        list.appendChild(listItem)
        paragraph.remove()
      })

      if (anchor && anchor.parentNode === doc.body) {
        doc.body.insertBefore(list, anchor)
      } else {
        doc.body.appendChild(list)
      }

      changed = true
      break
    }
  }
}

export function wrapListItemParagraphs(doc: Document): void {
  doc.querySelectorAll('ol > li, ul > li').forEach((listItem) => {
    if (listItem.querySelector(':scope > p')) return

    const paragraph = doc.createElement('p')
    while (listItem.firstChild) paragraph.appendChild(listItem.firstChild)

    if (paragraph.textContent?.trim() || paragraph.querySelector('img')) {
      listItem.appendChild(paragraph)
    }
  })
}

export function removeOrphanMarkerNodes(doc: Document): void {
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

export function mergeSplitListItems(doc: Document): void {
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

      while (current.firstChild) current.removeChild(current.firstChild)
      while (next.firstChild) current.appendChild(next.firstChild)
      next.remove()
      items = Array.from(list.children).filter((child) => child.tagName === 'LI')
      index -= 1
    }
  })
}

export function removeEmptyListItems(doc: Document): void {
  doc.querySelectorAll('li').forEach((item) => {
    const text = item.textContent?.trim() ?? ''
    const hasMedia = item.querySelector('img, video, iframe')
    if (!text && !hasMedia) item.remove()
  })

  doc.querySelectorAll('ol, ul').forEach((list) => {
    if (list.children.length === 0) list.remove()
  })
}

export function normalizePasteLists(doc: Document): void {
  mergeSplitListItems(doc)
  mergeOrphanNumbersWithNextParagraph(doc)
  mergeOrphanNumbersInsideListItems(doc)
  removeOrphanMarkerNodes(doc)
  reconstructLooseNumberedLists(doc)
  wrapListItemParagraphs(doc)
  removeEmptyListItems(doc)
}
