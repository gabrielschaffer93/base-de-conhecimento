export type TipTapDoc = Record<string, unknown>

type TipTapMark = { type: string; attrs?: Record<string, unknown> }
type TipTapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  text?: string
  marks?: TipTapMark[]
}

// ─── TipTap JSON → Markdown ─────────────────────────────────────────

function inlineToMarkdown(nodes: TipTapNode[] = []): string {
  return nodes.map((node) => {
    if (node.type === 'hardBreak') return '  \n'
    if (node.type !== 'text') return ''

    let text = node.text ?? ''
    const marks = node.marks ?? []

    for (const mark of marks) {
      if (mark.type === 'link') {
        text = `[${text}](${mark.attrs?.href ?? ''})`
      }
    }

    const hasBold = marks.some((m) => m.type === 'bold')
    const hasItalic = marks.some((m) => m.type === 'italic')
    const hasCode = marks.some((m) => m.type === 'code')
    const hasStrike = marks.some((m) => m.type === 'strike')

    if (hasCode) text = `\`${text}\``
    if (hasBold && hasItalic) text = `***${text}***`
    else if (hasBold) text = `**${text}**`
    else if (hasItalic) text = `*${text}*`
    if (hasStrike) text = `~~${text}~~`

    return text
  }).join('')
}

function nodeToMarkdown(node: TipTapNode): string {
  switch (node.type) {
    case 'heading': {
      const level = Number(node.attrs?.level ?? 2)
      const hashes = '#'.repeat(level)
      return `${hashes} ${inlineToMarkdown(node.content)}`
    }
    case 'paragraph':
      return inlineToMarkdown(node.content)
    case 'bulletList':
      return (node.content ?? [])
        .map((item) => {
          const inner = (item.content ?? []).map(nodeToMarkdown).join('\n')
          return `- ${inner}`
        })
        .join('\n')
    case 'orderedList':
      return (node.content ?? [])
        .map((item, i) => {
          const inner = (item.content ?? []).map(nodeToMarkdown).join('\n')
          return `${i + 1}. ${inner}`
        })
        .join('\n')
    case 'blockquote':
      return (node.content ?? [])
        .map(nodeToMarkdown)
        .map((line) => `> ${line}`)
        .join('\n')
    case 'codeBlock': {
      const text = node.content?.map((c) => c.text ?? '').join('') ?? ''
      return `\`\`\`\n${text}\n\`\`\``
    }
    case 'horizontalRule':
      return '---'
    case 'image':
      return `<!-- IMAGE src="${node.attrs?.src ?? ''}" alt="${node.attrs?.alt ?? ''}" -->`
    case 'videoEmbed':
      return `<!-- VIDEO provider="${node.attrs?.provider ?? 'youtube'}" src="${node.attrs?.src ?? ''}" href="${node.attrs?.href ?? ''}" -->`
    case 'callout': {
      const calloutType = String(node.attrs?.type ?? 'tip')
      const inner = (node.content ?? []).map(nodeToMarkdown).join('\n')
      return `:::${calloutType}\n${inner}\n:::`
    }
    case 'accordion': {
      const title = String(node.attrs?.title ?? 'Detalhes')
      const inner = (node.content ?? []).map(nodeToMarkdown).join('\n')
      return `<details>\n<summary>${title}</summary>\n${inner}\n</details>`
    }
    default:
      return ''
  }
}

export function tiptapToMarkdown(doc: TipTapDoc): string {
  const content = (doc.content as TipTapNode[] | undefined) ?? []
  return content.map(nodeToMarkdown).join('\n\n')
}

// ─── Markdown → TipTap JSON ─────────────────────────────────────────

function parseInlineMarkdown(text: string): TipTapNode[] {
  const nodes: TipTapNode[] = []

  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~|\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }

    if (match[2]) {
      nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }, { type: 'italic' }] })
    } else if (match[3]) {
      nodes.push({ type: 'text', text: match[3], marks: [{ type: 'bold' }] })
    } else if (match[4]) {
      nodes.push({ type: 'text', text: match[4], marks: [{ type: 'italic' }] })
    } else if (match[5]) {
      nodes.push({ type: 'text', text: match[5], marks: [{ type: 'code' }] })
    } else if (match[6]) {
      nodes.push({ type: 'text', text: match[6], marks: [{ type: 'strike' }] })
    } else if (match[7] && match[8]) {
      nodes.push({
        type: 'text',
        text: match[7],
        marks: [{ type: 'link', attrs: { href: match[8] } }],
      })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes.length ? nodes : [{ type: 'text', text: text || '' }]
}

function makeParagraph(text: string): TipTapNode {
  return { type: 'paragraph', content: parseInlineMarkdown(text) }
}

export function markdownToTiptap(markdown: string): TipTapDoc {
  const lines = markdown.split('\n')
  const nodes: TipTapNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line — skip
    if (!line.trim()) { i++; continue }

    // HTML comment: IMAGE
    const imageMatch = line.match(/^<!--\s*IMAGE\s+src="([^"]*)"\s+alt="([^"]*)"\s*-->/)
    if (imageMatch) {
      nodes.push({ type: 'image', attrs: { src: imageMatch[1], alt: imageMatch[2] } })
      i++; continue
    }

    // HTML comment: VIDEO
    const videoMatch = line.match(/^<!--\s*VIDEO\s+provider="([^"]*)"\s+src="([^"]*)"\s+href="([^"]*)"\s*-->/)
    if (videoMatch) {
      nodes.push({
        type: 'videoEmbed',
        attrs: { provider: videoMatch[1], src: videoMatch[2], href: videoMatch[3] },
      })
      i++; continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push({ type: 'horizontalRule' })
      i++; continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      nodes.push({
        type: 'heading',
        attrs: { level },
        content: parseInlineMarkdown(headingMatch[2]),
      })
      i++; continue
    }

    // Callout (:::type ... :::)
    const calloutMatch = line.match(/^:::(tip|info|warning|danger|success)$/)
    if (calloutMatch) {
      const calloutType = calloutMatch[1]
      const calloutLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') {
        calloutLines.push(lines[i])
        i++
      }
      i++ // skip closing :::
      const innerNodes = calloutLines
        .join('\n')
        .split('\n\n')
        .filter((p) => p.trim())
        .map((p) => makeParagraph(p.trim()))
      nodes.push({
        type: 'callout',
        attrs: { type: calloutType },
        content: innerNodes.length ? innerNodes : [{ type: 'paragraph' }],
      })
      continue
    }

    // Accordion (<details>...</details>)
    if (line.trim() === '<details>') {
      i++
      let title = 'Detalhes'
      const summaryMatch = lines[i]?.match(/<summary>(.+?)<\/summary>/)
      if (summaryMatch) {
        title = summaryMatch[1]
        i++
      }
      const accordionLines: string[] = []
      while (i < lines.length && lines[i].trim() !== '</details>') {
        accordionLines.push(lines[i])
        i++
      }
      i++ // skip </details>
      const innerNodes = accordionLines
        .join('\n')
        .split('\n\n')
        .filter((p) => p.trim())
        .map((p) => makeParagraph(p.trim()))
      nodes.push({
        type: 'accordion',
        attrs: { title, open: true },
        content: innerNodes.length ? innerNodes : [{ type: 'paragraph' }],
      })
      continue
    }

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      nodes.push({
        type: 'codeBlock',
        content: codeLines.length
          ? [{ type: 'text', text: codeLines.join('\n') }]
          : undefined,
      })
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      const innerNodes = quoteLines
        .join('\n')
        .split('\n\n')
        .filter((p) => p.trim())
        .map((p) => makeParagraph(p.trim()))
      nodes.push({
        type: 'blockquote',
        content: innerNodes.length ? innerNodes : [{ type: 'paragraph' }],
      })
      continue
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: TipTapNode[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*]\s+/, '')
        items.push({
          type: 'listItem',
          content: [makeParagraph(itemText)],
        })
        i++
      }
      nodes.push({ type: 'bulletList', content: items })
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: TipTapNode[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '')
        items.push({
          type: 'listItem',
          content: [makeParagraph(itemText)],
        })
        i++
      }
      nodes.push({ type: 'orderedList', content: items })
      continue
    }

    // Regular paragraph (may span multiple non-empty lines until blank line)
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].match(/^[-*]\s/) &&
      !lines[i].match(/^\d+\.\s/) &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith(':::') &&
      !lines[i].startsWith('<details>') &&
      !lines[i].startsWith('<!--') &&
      !lines[i].match(/^---+$/)
    ) {
      paraLines.push(lines[i])
      i++
    }

    if (paraLines.length) {
      nodes.push(makeParagraph(paraLines.join(' ')))
    }
  }

  return {
    type: 'doc',
    content: nodes.length ? nodes : [{ type: 'paragraph' }],
  }
}

// ─── Utilities ───────────────────────────────────────────────────────

function extractTextFromNode(node: TipTapNode): string {
  if (node.text) return node.text
  if (!node.content) return ''
  return node.content.map(extractTextFromNode).join('')
}

export function isEmptyDoc(doc: TipTapDoc): boolean {
  const content = (doc.content as TipTapNode[] | undefined) ?? []
  if (content.length === 0) return true
  return content.every((node) => {
    if (node.type === 'paragraph') return !extractTextFromNode(node).trim()
    return false
  })
}
