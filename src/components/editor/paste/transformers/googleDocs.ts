const GOOGLE_DOCS_GUID_SELECTOR = 'b[id^="docs-internal-guid"]'

export function transformGoogleDocsPaste(doc: Document): void {
  doc.querySelectorAll(GOOGLE_DOCS_GUID_SELECTOR).forEach((wrapper) => {
    const parent = wrapper.parentNode
    if (!parent) return

    while (wrapper.firstChild) {
      parent.insertBefore(wrapper.firstChild, wrapper)
    }

    parent.removeChild(wrapper)
  })

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
