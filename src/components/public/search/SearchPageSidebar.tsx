import { Link } from 'react-router-dom'
import { PUBLIC_WHATSAPP_URL } from '@/config/publicSite'
import type { SearchPageSidebarData } from '@/features/search/searchPageService'
import styles from './SearchPageSidebar.module.css'

interface SearchPageSidebarProps {
  data: SearchPageSidebarData
  activeTagSlug?: string
}

export function SearchPageSidebar({ data, activeTagSlug }: SearchPageSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <section className={styles.widget}>
        <h2>Buscas em alta</h2>
        <ul className={styles.trendingList}>
          {data.trendingSearches.map((item) => (
            <li key={item.query}>
              <Link to={`/busca?q=${encodeURIComponent(item.query)}`}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.ctaCard}>
        <h2>Precisa de ajuda personalizada?</h2>
        <p>Nossos consultores estão prontos para tirar dúvidas sobre a plataforma e o mercado.</p>
        <a href={PUBLIC_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={styles.ctaButton}>
          Falar no WhatsApp
        </a>
      </section>

      <section className={styles.widget}>
        <h2 className={styles.tagsTitle}>Tags populares</h2>
        <div className={styles.tagCloud}>
          {data.popularTags.map((tag) => (
            <Link
              key={tag.id}
              to={`/busca?tag=${encodeURIComponent(tag.slug)}`}
              className={`${styles.tagPill} ${activeTagSlug === tag.slug ? styles.tagPillActive : ''}`}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </section>
    </aside>
  )
}
