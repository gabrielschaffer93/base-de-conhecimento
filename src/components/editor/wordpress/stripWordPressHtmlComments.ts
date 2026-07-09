/** Remove WordPress/Gutenberg HTML comments before parsing. */
export function stripWordPressHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}
