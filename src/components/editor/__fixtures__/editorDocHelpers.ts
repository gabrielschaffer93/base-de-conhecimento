export function paragraph(
  text: string,
  marks?: Array<Record<string, unknown>>,
  textAlign: string | null = null,
) {
  return {
    type: 'paragraph' as const,
    attrs: { textAlign },
    content: marks?.length
      ? [{ type: 'text' as const, text, marks }]
      : [{ type: 'text' as const, text }],
  }
}

export function heading(level: number, text: string, marks?: Array<Record<string, unknown>>) {
  return {
    type: 'heading' as const,
    attrs: { level, textAlign: null },
    content: marks?.length
      ? [{ type: 'text' as const, text, marks }]
      : [{ type: 'text' as const, text }],
  }
}

export function doc(...content: Record<string, unknown>[]) {
  return { type: 'doc' as const, content }
}
