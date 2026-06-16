import { PUBLIC_HEADER_CATEGORIES } from '@/config/publicSite'
import type { Category } from '@/types/database'

export interface ResolvedHeaderCategory {
  label: string
  slug: string
}

function normalizeCategoryKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function resolveHeaderCategories(categories: Category[]): ResolvedHeaderCategory[] {
  return PUBLIC_HEADER_CATEGORIES.flatMap((item) => {
    const normalizedLabel = normalizeCategoryKey(item.label)

    const match =
      item.slugCandidates
        .map((slug) => categories.find((category) => category.slug === slug))
        .find(Boolean) ??
      categories.find((category) => normalizeCategoryKey(category.name) === normalizedLabel) ??
      categories.find((category) => normalizeCategoryKey(category.slug) === normalizedLabel)

    if (!match) return []

    return [{ label: item.label, slug: match.slug }]
  })
}
