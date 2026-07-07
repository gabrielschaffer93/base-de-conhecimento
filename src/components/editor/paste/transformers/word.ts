const MSO_STYLE_PROPS = [
  'mso-',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'text-indent',
  'line-height',
  'font-size',
  'font-family',
  'color',
  'background',
  'tab-stops',
  'page-break',
]

export function transformWordPaste(doc: Document): void {
  doc.querySelectorAll('*').forEach((node) => {
    if (node.tagName.toLowerCase() === 'o:p') node.remove()
  })

  doc.querySelectorAll('[style]').forEach((element) => {
    let style = element.getAttribute('style') ?? ''

    for (const prop of MSO_STYLE_PROPS) {
      const regex = new RegExp(`${prop}[^:]*:\\s*[^;]+;?`, 'gi')
      style = style.replace(regex, '')
    }

    style = style.trim()
    if (style) element.setAttribute('style', style)
    else element.removeAttribute('style')
  })

  doc.querySelectorAll('[class]').forEach((element) => {
    const className = element.getAttribute('class') ?? ''
    const cleaned = className
      .split(/\s+/)
      .filter((token) => token && !/^Mso/i.test(token))
      .join(' ')

    if (cleaned) element.setAttribute('class', cleaned)
    else element.removeAttribute('class')
  })
}
