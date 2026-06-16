import { Link } from 'react-router-dom'
import type { FeaturedTag, PopularCategory } from '@/features/home/homePageService'
import styles from './BrowseByThemesSection.module.css'

interface BrowseByThemesSectionProps {
  popularCategories: PopularCategory[]
  featuredTags: FeaturedTag[]
}

function formatArticleCount(count: number): string {
  const noun = count === 1 ? 'artigo' : 'artigos'
  return `${count} ${noun}`
}

function getCategoryVariant(index: number): 'beige' | 'green' {
  return index === 0 || index === 3 ? 'beige' : 'green'
}

export function BrowseByThemesSection({
  popularCategories,
  featuredTags,
}: BrowseByThemesSectionProps) {
  if (popularCategories.length === 0 && featuredTags.length === 0) return null

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2>Navegue por Temas</h2>
          <span className={styles.titleUnderline} aria-hidden="true" />
        </header>

        <div className={styles.columns}>
          {popularCategories.length > 0 && (
            <div className={styles.categoriesColumn}>
              <h3 className={styles.columnEyebrow}>CATEGORIAS POPULARES</h3>
              <div className={styles.categoryGrid}>
                {popularCategories.map(({ category, postCount }, index) => (
                  <Link
                    key={category.id}
                    to={`/categorias/${category.slug}`}
                    className={`${styles.categoryCard} ${styles[getCategoryVariant(index)]}`}
                  >
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryCount}>{formatArticleCount(postCount)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {featuredTags.length > 0 && (
            <div className={styles.tagsColumn}>
              <h3 className={styles.columnEyebrow}>TAGS EM DESTAQUE</h3>
              <div className={styles.tagCloud}>
                {featuredTags.map(({ tag }) => (
                  <Link
                    key={tag.id}
                    to={`/busca?q=${encodeURIComponent(tag.name)}`}
                    className={styles.tagPill}
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
