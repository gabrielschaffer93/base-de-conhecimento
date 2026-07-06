import { slugify, isValidUuid } from '@/lib/utils'
import type { PostFormData, PostStatus } from '@/types/database'

export function serializePostForm(form: PostFormData): string {
  return JSON.stringify({
    title: form.title.trim(),
    slug: form.slug.trim(),
    content: form.content,
    status: form.status,
    category_id: form.category_id,
    tag_ids: [...form.tag_ids].sort(),
    featured_image_url: form.featured_image_url,
    meta_title: form.meta_title.trim(),
    meta_description: form.meta_description.trim(),
  })
}

export function getAutoSaveStatus(status: PostStatus): PostStatus {
  if (status === 'published' || status === 'archived') return status
  return 'draft'
}

export function buildPostPayload(form: PostFormData, status?: PostStatus): PostFormData {
  const normalizedSlug = slugify(form.slug.trim() || form.title.trim())

  return {
    ...form,
    slug: normalizedSlug,
    status: status ?? form.status,
    category_id: form.category_id && isValidUuid(form.category_id) ? form.category_id : null,
    tag_ids: form.tag_ids.filter(isValidUuid),
  }
}

export function hasMinimumAutoSaveContent(form: PostFormData): boolean {
  return form.title.trim().length > 0
}
