import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopicCategoryCard } from '@/components/public/TopicCategoryCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { fetchCategories } from '@/features/categories/categoriesService'
import { fetchEmptyCategoryIds } from '@/features/home/homePageService'
import type { Category } from '@/types/database'
import styles from './HomePage.module.css'

export function CategoriesIndexPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [emptyCategoryIds, setEmptyCategoryIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchCategories(), fetchEmptyCategoryIds()])
      .then(([allCategories, emptyIds]) => {
        setCategories(allCategories)
        setEmptyCategoryIds(emptyIds)
      })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Spinner />

  return (
    <div className={styles.sectionInner}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>EXPLORE POR TEMA</span>
          <h1>Todos os tópicos</h1>
        </div>
        <Link to="/" className={styles.sectionLink}>
          Voltar ao início →
        </Link>
      </div>

      {categories.length === 0 ? (
        <EmptyState title="Nenhuma categoria" description="As categorias aparecerão aqui quando forem criadas." />
      ) : (
        <div className={styles.topicsGrid}>
          {categories.map((category, index) => (
            <TopicCategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      )}

      {emptyCategoryIds.size > 0 && (
        <p className={styles.categoriesNote}>
          {emptyCategoryIds.size} categorias ainda não possuem artigos publicados.
        </p>
      )}
    </div>
  )
}
