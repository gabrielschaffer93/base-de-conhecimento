import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeroSearch } from '@/components/public/PublicHeroSearch'
import { HeroBrowserMockup } from '@/components/public/HeroBrowserMockup'
import { BrowseByThemesSection } from '@/components/public/BrowseByThemesSection'
import { TopicCategoryCard } from '@/components/public/TopicCategoryCard'
import { WeeklyHighlightCard } from '@/components/public/WeeklyHighlightCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { fetchHomePageData } from '@/features/home/homePageService'
import type { HomePageData } from '@/features/home/homePageService'
import styles from './HomePage.module.css'

export function HomePage() {
  const [data, setData] = useState<HomePageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHomePageData()
      .then(setData)
      .catch(() => setError('Não foi possível carregar a página inicial.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.sectionInner}>
        <EmptyState title="Erro" description={error ?? 'Tente novamente mais tarde.'} />
      </div>
    )
  }

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1>Como podemos ajudar hoje?</h1>
            <p>
              Encontre guias passo a passo, documentação técnica e as melhores práticas para elevar
              o nível da sua operação editorial.
            </p>
            <PublicHeroSearch />
          </div>

          <HeroBrowserMockup latestPost={data.latestPost} />
        </div>
      </section>

      {data.topicCategories.length > 0 && (
        <section className={styles.topicsSection}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>EXPLORE POR TEMA</span>
                <h2>Principais Tópicos</h2>
              </div>
              <Link to="/categorias" className={styles.sectionLink}>
                Ver todos os tópicos →
              </Link>
            </div>

            <div className={styles.topicsGrid}>
              {data.topicCategories.map((category, index) => (
                <TopicCategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <BrowseByThemesSection
        popularCategories={data.popularCategories}
        featuredTags={data.featuredTags}
      />

      {data.weeklyHighlights.length > 0 && (
        <section className={styles.highlightsSection}>
          <div className={styles.sectionInner}>
            <header className={styles.highlightsHeader}>
              <h2>Destaques da Semana</h2>
              <p>
                Mantenha-se atualizado com as últimas melhorias e tutoriais avançados criados pelo
                nosso time editorial.
              </p>
            </header>

            <div className={styles.highlightsGrid}>
              {data.weeklyHighlights.map((highlight) => (
                <WeeklyHighlightCard key={highlight.post.id} highlight={highlight} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
