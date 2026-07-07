export type TipTapDoc = Record<string, unknown>

type TipTapMark = { type: string; attrs?: Record<string, unknown> }
type TipTapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  text?: string
  marks?: TipTapMark[]
}

const DEFAULT_PARAGRAPH_ATTRS = { textAlign: null }
const DEFAULT_TABLE_CELL_ATTRS = { colspan: 1, rowspan: 1, colwidth: null, align: null }

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
    const hasUnderline = marks.some((m) => m.type === 'underline')

    if (hasCode) text = `\`${text}\``
    if (hasBold && hasItalic) text = `***${text}***`
    else if (hasBold) text = `**${text}**`
    else if (hasItalic) text = `*${text}*`
    if (hasStrike) text = `~~${text}~~`
    if (hasUnderline) text = `<u>${text}</u>`

    return text
  }).join('')
}

function tableRowToMarkdownCells(row: TipTapNode): string[] {
  return (row.content ?? []).map((cell) => {
    const inner = (cell.content ?? []).map(nodeToMarkdown).join(' ').replace(/\|/g, '\\|')
    return inner.trim()
  })
}

function isTableSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

function nodeToMarkdown(node: TipTapNode): string {
  switch (node.type) {
    case 'heading': {
      const level = Number(node.attrs?.level ?? 2)
      const hashes = '#'.repeat(level)
      const align = node.attrs?.textAlign as string | null | undefined
      const prefix = align && align !== 'left' ? `<!-- align:${align} -->\n` : ''
      return `${prefix}${hashes} ${inlineToMarkdown(node.content)}`
    }
    case 'paragraph': {
      const align = node.attrs?.textAlign as string | null | undefined
      const text = inlineToMarkdown(node.content)
      if (align && align !== 'left') return `<!-- align:${align} -->\n${text}`
      return text
    }
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
    case 'taskList':
      return (node.content ?? [])
        .map((item) => {
          const checked = item.attrs?.checked ? 'x' : ' '
          const inner = (item.content ?? []).map(nodeToMarkdown).join('\n')
          return `- [${checked}] ${inner}`
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
    case 'table': {
      const rows = node.content ?? []
      const lines: string[] = []
      let headerEmitted = false

      for (const row of rows) {
        if (row.type !== 'tableRow') continue
        const cells = tableRowToMarkdownCells(row)
        if (cells.length === 0) continue

        lines.push(`| ${cells.join(' | ')} |`)

        const hasHeaderCells = (row.content ?? []).some((cell) => cell.type === 'tableHeader')
        if (hasHeaderCells && !headerEmitted) {
          lines.push(`| ${cells.map(() => '---').join(' | ')} |`)
          headerEmitted = true
        }
      }

      return lines.join('\n')
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

  const regex =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~|<u>(.+?)<\/u>|\[(.+?)\]\((.+?)\))/g
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
    } else if (match[7]) {
      nodes.push({ type: 'text', text: match[7], marks: [{ type: 'underline' }] })
    } else if (match[8] && match[9]) {
      nodes.push({
        type: 'text',
        text: match[8],
        marks: [{ type: 'link', attrs: { href: match[9] } }],
      })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) })
  }

  return nodes.length ? nodes : [{ type: 'text', text: text || '' }]
}

function makeParagraph(text: string, textAlign: string | null = null): TipTapNode {
  return {
    type: 'paragraph',
    attrs: { textAlign },
    content: parseInlineMarkdown(text),
  }
}

function makeTableCell(text: string, cellType: 'tableHeader' | 'tableCell'): TipTapNode {
  return {
    type: cellType,
    attrs: { ...DEFAULT_TABLE_CELL_ATTRS },
    content: [makeParagraph(text)],
  }
}

function makeTableRow(cells: string[], rowIndex: number, hasHeaderRow: boolean): TipTapNode {
  return {
    type: 'tableRow',
    content: cells.map((cell) =>
      makeTableCell(cell, hasHeaderRow && rowIndex === 0 ? 'tableHeader' : 'tableCell'),
    ),
  }
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function readBlockAlignment(line: string): string | null {
  const match = line.match(/^<!--\s*align:(left|center|right|justify)\s*-->$/)
  return match?.[1] ?? null
}

export function markdownToTiptap(markdown: string): TipTapDoc {
  const lines = markdown.split('\n')
  const nodes: TipTapNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i++; continue }

    const blockAlign = readBlockAlignment(line)
    if (blockAlign) {
      i++
      if (i >= lines.length) continue
    }

    const contentLine = blockAlign ? lines[i] : line

    const imageMatch = contentLine.match(/^<!--\s*IMAGE\s+src="([^"]*)"\s+alt="([^"]*)"\s*-->/)
    if (imageMatch) {
      nodes.push({ type: 'image', attrs: { src: imageMatch[1], alt: imageMatch[2] } })
      i++; continue
    }

    const videoMatch = contentLine.match(
      /^<!--\s*VIDEO\s+provider="([^"]*)"\s+src="([^"]*)"\s+href="([^"]*)"\s*-->/,
    )
    if (videoMatch) {
      nodes.push({
        type: 'videoEmbed',
        attrs: { provider: videoMatch[1], src: videoMatch[2], href: videoMatch[3] },
      })
      i++; continue
    }

    if (/^---+$/.test(contentLine.trim())) {
      nodes.push({ type: 'horizontalRule' })
      i++; continue
    }

    const headingMatch = contentLine.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      nodes.push({
        type: 'heading',
        attrs: { level, textAlign: blockAlign },
        content: parseInlineMarkdown(headingMatch[2]),
      })
      i++; continue
    }

    const calloutMatch = contentLine.match(/^:::(tip|info|warning|danger|success)$/)
    if (calloutMatch) {
      const calloutType = calloutMatch[1]
      const calloutLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== ':::') {
        calloutLines.push(lines[i])
        i++
      }
      i++
      const innerNodes = calloutLines
        .join('\n')
        .split('\n\n')
        .filter((p) => p.trim())
        .map((p) => makeParagraph(p.trim()))
      nodes.push({
        type: 'callout',
        attrs: { type: calloutType },
        content: innerNodes.length ? innerNodes : [{ type: 'paragraph', attrs: DEFAULT_PARAGRAPH_ATTRS }],
      })
      continue
    }

    if (contentLine.trim() === '<details>') {
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
      i++
      const innerNodes = accordionLines
        .join('\n')
        .split('\n\n')
        .filter((p) => p.trim())
        .map((p) => makeParagraph(p.trim()))
      nodes.push({
        type: 'accordion',
        attrs: { title, open: true },
        content: innerNodes.length ? innerNodes : [{ type: 'paragraph', attrs: DEFAULT_PARAGRAPH_ATTRS }],
      })
      continue
    }

    if (contentLine.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      nodes.push({
        type: 'codeBlock',
        attrs: { language: null },
        content: codeLines.length
          ? [{ type: 'text', text: codeLines.join('\n') }]
          : undefined,
      })
      continue
    }

    if (contentLine.startsWith('> ')) {
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
        content: innerNodes.length ? innerNodes : [{ type: 'paragraph', attrs: DEFAULT_PARAGRAPH_ATTRS }],
      })
      continue
    }

    if (contentLine.trim().startsWith('|')) {
      const tableRows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = parseTableCells(lines[i])
        if (!isTableSeparatorRow(cells)) {
          tableRows.push(cells)
        }
        i++
      }

      if (tableRows.length > 0) {
        nodes.push({
          type: 'table',
          content: tableRows.map((row, rowIndex) => makeTableRow(row, rowIndex, true)),
        })
      }
      continue
    }

    if (/^[-*]\s\[[ xX]\]\s/.test(contentLine)) {
      const items: TipTapNode[] = []
      while (i < lines.length && /^[-*]\s\[[ xX]\]\s/.test(lines[i])) {
        const checked = /\[x\]/i.test(lines[i])
        const itemText = lines[i].replace(/^[-*]\s\[[ xX]\]\s+/, '')
        items.push({
          type: 'taskItem',
          attrs: { checked },
          content: [makeParagraph(itemText)],
        })
        i++
      }
      nodes.push({ type: 'taskList', content: items })
      continue
    }

    if (/^[-*]\s/.test(contentLine)) {
      const items: TipTapNode[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i]) && !/^[-*]\s\[[ xX]\]\s/.test(lines[i])) {
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

    if (/^\d+\.\s/.test(contentLine)) {
      const items: TipTapNode[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '')
        items.push({
          type: 'listItem',
          content: [makeParagraph(itemText)],
        })
        i++
      }
      nodes.push({ type: 'orderedList', attrs: { start: 1, type: null }, content: items })
      continue
    }

    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !readBlockAlignment(lines[i]) &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].match(/^[-*]\s/) &&
      !lines[i].match(/^\d+\.\s/) &&
      !lines[i].startsWith('> ') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].startsWith(':::') &&
      !lines[i].startsWith('<details>') &&
      !lines[i].startsWith('<!--') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].match(/^---+$/)
    ) {
      paraLines.push(lines[i])
      i++
    }

    if (paraLines.length) {
      nodes.push(makeParagraph(paraLines.join(' '), blockAlign))
    } else if (blockAlign) {
      i++
    }
  }

  return {
    type: 'doc',
    content: nodes.length ? nodes : [{ type: 'paragraph', attrs: DEFAULT_PARAGRAPH_ATTRS }],
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
