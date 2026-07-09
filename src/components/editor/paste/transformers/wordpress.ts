/** Remove WordPress/Gutenberg HTML comments before parsing. */
export function stripWordPressHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

function unwrapElementPreservingChildren(element: Element): void {
  const parent = element.parentNode
  if (!parent) return

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }

  parent.removeChild(element)
}

function convertDivQuoteToBlockquote(doc: Document): void {
  doc.querySelectorAll('div.wp-block-quote, div[class*="wp-block-quote"]').forEach((element) => {
    const blockquote = doc.createElement('blockquote')
    while (element.firstChild) blockquote.appendChild(element.firstChild)
    element.replaceWith(blockquote)
  })
}

function convertSeparatorBlocks(doc: Document): void {
  doc.querySelectorAll('div.wp-block-separator, div[class*="wp-block-separator"]').forEach((element) => {
    const hr = element.querySelector('hr') ?? doc.createElement('hr')
    element.replaceWith(hr)
  })
}

function unwrapLayoutBlocks(doc: Document): void {
  const selectors = [
    'div.wp-block-group',
    'div[class*="wp-block-group"]',
    'div.wp-block-columns',
    'div[class*="wp-block-columns"]',
    'div.wp-block-column',
    'div[class*="wp-block-column"]',
    'div.wp-block-media-text',
    'div[class*="wp-block-media-text"]',
  ]

  let changed = true
  while (changed) {
    changed = false

    for (const selector of selectors) {
      const elements = Array.from(doc.querySelectorAll(selector))
      if (elements.length === 0) continue

      for (const element of elements) {
        unwrapElementPreservingChildren(element)
      }

      changed = true
      break
    }
  }
}

function removeSpacerBlocks(doc: Document): void {
  doc.querySelectorAll('div.wp-block-spacer, div[class*="wp-block-spacer"]').forEach((element) => {
    element.remove()
  })
}

function normalizeClassicBlockquotes(doc: Document): void {
  doc.querySelectorAll('blockquote').forEach((blockquote) => {
    const text = blockquote.textContent?.trim() ?? ''
    if (!text) {
      blockquote.remove()
    }
  })
}

function preserveShortcodeText(doc: Document): void {
  doc.querySelectorAll('p, li, td, th, blockquote').forEach((element) => {
    const text = element.textContent ?? ''
    if (!/\[[\w-]+[^\]]*\]/.test(text)) return

    // Keep shortcode syntax as plain text; remove empty wrapper elements around it.
    const onlyShortcode = text.trim().match(/^\[[\w-/]+\]$/)
    if (onlyShortcode && element.children.length === 0) return

    element.querySelectorAll('span, div').forEach((child) => {
      if (!(child.textContent ?? '').trim()) child.remove()
    })
  })
}

export function transformWordPressPaste(doc: Document): void {
  doc.querySelectorAll('figure.wp-block-image, figure[class*="wp-block-image"]').forEach((figure) => {
    const img = figure.querySelector('img')
    if (!img) return

    const cloned = img.cloneNode(true) as HTMLImageElement
    const caption = figure.querySelector('figcaption')?.textContent?.trim()
    if (caption && !cloned.getAttribute('alt')) {
      cloned.setAttribute('alt', caption)
    }

    figure.replaceWith(cloned)
  })

  doc.querySelectorAll('.wp-block-embed, figure.wp-block-embed, figure[class*="wp-block-embed"]').forEach((block) => {
    const iframe = block.querySelector('iframe[src]')
    if (!iframe) return

    const wrapper = doc.createElement('div')
    wrapper.innerHTML = iframe.outerHTML
    block.replaceWith(wrapper.firstElementChild ?? wrapper)
  })

  doc.querySelectorAll('div.wp-block-buttons, div.wp-block-button, a.wp-block-button__link').forEach((block) => {
    const link = block.tagName === 'A' ? block : block.querySelector('a[href]')
    if (!link) return

    const paragraph = doc.createElement('p')
    paragraph.appendChild(link.cloneNode(true))
    block.replaceWith(paragraph)
  })

  convertDivQuoteToBlockquote(doc)
  convertSeparatorBlocks(doc)
  removeSpacerBlocks(doc)
  unwrapLayoutBlocks(doc)
  normalizeClassicBlockquotes(doc)
  preserveShortcodeText(doc)

  doc.querySelectorAll('[class*="wp-block-"]').forEach((element) => {
    const className = element.getAttribute('class') ?? ''
    const cleaned = className
      .split(/\s+/)
      .filter((token) => token && !token.startsWith('wp-block-') && !token.startsWith('has-'))
      .join(' ')

    if (cleaned) element.setAttribute('class', cleaned)
    else element.removeAttribute('class')
  })
}
