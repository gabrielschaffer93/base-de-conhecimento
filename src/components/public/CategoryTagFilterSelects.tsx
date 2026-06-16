import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchCategories } from '@/features/categories/categoriesService'
import { fetchTags } from '@/features/tags/tagsService'
import type { Category, Tag } from '@/types/database'
import { HeroFilterSelect } from './HeroFilterSelect'
import styles from './CategoryTagFilterSelects.module.css'

type OpenFilter = 'category' | 'tag' | null

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
}

interface CategoryTagFilterSelectsProps {
  onCategorySelect: (slug: string) => void
  onTagSelect: (slug: string) => void
  selectedCategorySlug?: string
  selectedTagSlug?: string
  onOptionsLoaded?: (data: { categories: Category[]; tags: Tag[] }) => void
  className?: string
}

export function CategoryTagFilterSelects({
  onCategorySelect,
  onTagSelect,
  selectedCategorySlug,
  selectedTagSlug,
  onOptionsLoaded,
  className = '',
}: CategoryTagFilterSelectsProps) {
  const onOptionsLoadedRef = useRef(onOptionsLoaded)
  onOptionsLoadedRef.current = onOptionsLoaded
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    Promise.all([fetchCategories(), fetchTags()])
      .then(([categoryData, tagData]) => {
        const sortedCategories = sortByName(categoryData)
        const sortedTags = sortByName(tagData)
        setCategories(sortedCategories)
        setTags(sortedTags)
        onOptionsLoadedRef.current?.({ categories: sortedCategories, tags: sortedTags })
      })
      .catch(() => {
        setCategories([])
        setTags([])
        onOptionsLoadedRef.current?.({ categories: [], tags: [] })
      })
  }, [])

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.slug, label: category.name })),
    [categories],
  )

  const tagOptions = useMemo(
    () => tags.map((tag) => ({ value: tag.slug, label: tag.name })),
    [tags],
  )

  return (
    <div className={`${styles.filters} ${className}`.trim()}>
      <HeroFilterSelect
        label="Selecionar categoria"
        placeholder="Selecionar categoria"
        searchPlaceholder="Buscar categoria..."
        options={categoryOptions}
        value={selectedCategorySlug}
        isOpen={openFilter === 'category'}
        onOpenChange={(open) => setOpenFilter(open ? 'category' : null)}
        onSelect={onCategorySelect}
      />
      <HeroFilterSelect
        label="Selecionar tag"
        placeholder="Selecionar tag"
        searchPlaceholder="Buscar tag..."
        options={tagOptions}
        value={selectedTagSlug}
        isOpen={openFilter === 'tag'}
        onOpenChange={(open) => setOpenFilter(open ? 'tag' : null)}
        onSelect={onTagSelect}
      />
    </div>
  )
}
