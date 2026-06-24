export type FeedbackVote = 1 | -1

const VISITOR_KEY_STORAGE = 'loft_kb_visitor_key'

export function getVisitorKey(): string {
  let value = localStorage.getItem(VISITOR_KEY_STORAGE)
  if (!value) {
    value = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY_STORAGE, value)
  }
  return value
}
