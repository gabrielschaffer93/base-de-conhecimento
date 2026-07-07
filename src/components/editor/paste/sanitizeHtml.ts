const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'iframe',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strike',
  'strong',
  'sub',
  'sup',
  'u',
  'ul',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'colgroup',
  'col',
])

const GLOBAL_ATTRS = new Set(['class', 'id', 'style', 'data-video-embed', 'data-provider', 'data-src', 'data-href', 'data-callout-type'])
const PER_TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel', 'title']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  iframe: new Set(['src', 'title', 'allow', 'allowfullscreen', 'frameborder']),
  li: new Set(['data-type', 'data-checked']),
  ul: new Set(['data-type']),
  td: new Set(['colspan', 'rowspan', 'colwidth']),
  th: new Set(['colspan', 'rowspan', 'colwidth']),
  col: new Set(['span', 'width']),
}

const UNSAFE_URL_PROTOCOL = /^\s*javascript:/i

function sanitizeElementAttributes(element: Element): void {
  const allowed = new Set([...GLOBAL_ATTRS, ...(PER_TAG_ATTRS[element.tagName.toLowerCase()] ?? [])])

  for (const attr of Array.from(element.attributes)) {
    if (!allowed.has(attr.name)) {
      element.removeAttribute(attr.name)
      continue
    }

    if ((attr.name === 'href' || attr.name === 'src') && UNSAFE_URL_PROTOCOL.test(attr.value)) {
      element.removeAttribute(attr.name)
    }
  }
}

function unwrapUnknownTags(doc: Document): void {
  const unknown = Array.from(doc.body.querySelectorAll('*')).filter(
    (element) => !ALLOWED_TAGS.has(element.tagName.toLowerCase()),
  )

  for (const element of unknown) {
    const parent = element.parentNode
    if (!parent) continue

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element)
    }

    parent.removeChild(element)
  }
}

/** Remove dangerous nodes and attributes from pasted HTML. */
export function sanitizePasteDocument(doc: Document): void {
  doc.querySelectorAll('meta, link, title, style, script, noscript, object, embed, applet').forEach((node) => {
    node.remove()
  })

  doc.querySelectorAll('*').forEach((element) => {
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name)
      }
    }

    sanitizeElementAttributes(element)
  })

  unwrapUnknownTags(doc)
}
