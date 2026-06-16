import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CategoryTagFilterSelects } from './CategoryTagFilterSelects'
import styles from './PublicHeroSearch.module.css'

export function PublicHeroSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      navigate('/busca')
      return
    }
    navigate(`/busca?q=${encodeURIComponent(trimmed)}`)
  }

  const handleCategorySelect = (slug: string) => {
    navigate(`/categorias/${slug}`)
  }

  const handleTagSelect = (tagSlug: string) => {
    navigate(`/busca?tag=${encodeURIComponent(tagSlug)}`)
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit} role="search">
        <label htmlFor="hero-search" className="sr-only">
          Pesquisar artigos
        </label>
        <div className={styles.searchField}>
          <span className={styles.icon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="hero-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar por artigos, tutoriais ou integrações…"
            className={styles.input}
          />
          <button type="submit" className={styles.searchButton}>
            Buscar posts
          </button>
        </div>
      </form>

      <CategoryTagFilterSelects
        onCategorySelect={handleCategorySelect}
        onTagSelect={handleTagSelect}
      />
    </div>
  )
}
