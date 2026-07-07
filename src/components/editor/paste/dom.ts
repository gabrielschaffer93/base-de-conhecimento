export function parseHtmlDocument(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

export function serializeDocumentBody(doc: Document): string {
  return doc.body.innerHTML
}
