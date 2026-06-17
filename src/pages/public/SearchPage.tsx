import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchPageSidebar } from '@/components/public/search/SearchPageSidebar'
import { SearchResultCard } from '@/components/public/search/SearchResultCard'
import { CategoryTagFilterSelects } from '@/components/public/CategoryTagFilterSelects'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { searchPublishedPosts, type SearchSort } from '@/features/posts/postsService'
import type { SearchContentType } from '@/lib/postContent'
import type { Category, Tag } from '@/types/database'
import {
  fetchSearchPageSidebarData,
  type SearchPageSidebarData,
} from '@/features/search/searchPageService'
import { formatDashboardNumber } from '@/lib/utils'
import { recordSearchEvent } from '@/features/analytics/analyticsService'
import { getVisitorKey } from '@/lib/visitorKey'
import styles from './SearchPage.module.css'

const PAGE_SIZE = 10

type ContentFilterParam = 'artigos' | 'videos' | 'tutoriais'

function mapContentParamToApi(content: ContentFilterParam): SearchContentType | undefined {
  if (content === 'videos') return 'videos'
  if (content === 'tutoriais') return 'tutorials'
  return undefined
}

function buildSearchParams(input: {
  q?: string
  categoria?: string
  tag?: string
  conteudo?: ContentFilterParam
  pagina?: number
  ordem?: SearchSort
}): Record<string, string> {
  const params: Record<string, string> = {}
  if (input.q?.trim()) params.q = input.q.trim()
  if (input.categoria) params.categoria = input.categoria
  if (input.tag) params.tag = input.tag
  if (input.conteudo && input.conteudo !== 'artigos') params.conteudo = input.conteudo
  if (input.pagina && input.pagina > 1) params.pagina = String(input.pagina)
  if (input.ordem && input.ordem !== 'relevance') params.ordem = input.ordem
  return params
}

function formatResultsLabel(count: number, queryLabel: string): string {
  const formatted = formatDashboardNumber(count)
  if (!queryLabel) {
    const noun = count === 1 ? 'artigo publicado' : 'artigos publicados'
    return `${formatted} ${noun}`
  }
  const noun = count === 1 ? 'resultado encontrado' : 'resultados encontrados'
  return `${formatted} ${noun} para "${queryLabel}"`
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const categorySlug = searchParams.get('categoria') ?? ''
  const tagSlug = searchParams.get('tag') ?? ''
  const contentFilter = (searchParams.get('conteudo') as ContentFilterParam) || 'artigos'
  const page = Math.max(1, Number(searchParams.get('pagina') ?? '1') || 1)
  const sort = (searchParams.get('ordem') as SearchSort) || 'relevance'
  const apiContentType = mapContentParamToApi(contentFilter)

  const [inputValue, setInputValue] = useState(query)
  const [sidebarData, setSidebarData] = useState<SearchPageSidebarData | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchPublishedPosts>> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const resultsLabel = useMemo(() => {
    if (contentFilter === 'videos') return 'Vídeos'
    if (contentFilter === 'tutoriais') return 'Tutoriais'
    if (query.trim()) return query.trim()
    if (categorySlug) {
      const category = allCategories.find((item) => item.slug === categorySlug)
      return category?.name ?? categorySlug
    }
    if (tagSlug) {
      const tag = allTags.find((item) => item.slug === tagSlug)
      return tag?.name ?? tagSlug
    }
    return ''
  }, [query, categorySlug, tagSlug, allCategories, allTags, contentFilter])

  useEffect(() => {
    setInputValue(query)
  }, [query])

  useEffect(() => {
    fetchSearchPageSidebarData()
      .then(setSidebarData)
      .catch(() => setSidebarData({ filterCategories: [], trendingSearches: [], popularTags: [] }))
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    searchPublishedPosts({
      search: query.trim() || undefined,
      categorySlug: categorySlug || undefined,
      tagSlug: tagSlug || undefined,
      contentType: apiContentType,
      sort,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .catch(() => {
        if (!cancelled) {
          setResults({ posts: [], total: 0, page, pageSize: PAGE_SIZE, totalPages: 0 })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query, categorySlug, tagSlug, apiContentType, sort, page])

  useEffect(() => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || trimmedQuery.length < 2 || !results) return
    void recordSearchEvent(trimmedQuery, results.total, getVisitorKey())
  }, [query, results])

  const updateParams = (next: {
    q?: string
    categoria?: string
    tag?: string
    conteudo?: ContentFilterParam
    pagina?: number
    ordem?: SearchSort
  }) => {
    setSearchParams(
      buildSearchParams({
        q: next.q !== undefined ? next.q : query,
        categoria: next.categoria !== undefined ? next.categoria : categorySlug,
        tag: next.tag !== undefined ? next.tag : tagSlug,
        conteudo: next.conteudo !== undefined ? next.conteudo : contentFilter,
        pagina: next.pagina ?? 1,
        ordem: next.ordem ?? sort,
      }),
      { replace: true },
    )
  }

  const handleContentFilter = (content: ContentFilterParam) => {
    updateParams({ conteudo: content, pagina: 1 })
  }

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateParams({ q: inputValue, pagina: 1, categoria: '', tag: '' })
  }

  const handleCategoryFilter = (slug: string) => {
    updateParams({
      categoria: slug,
      pagina: 1,
      tag: '',
    })
  }

  const handleClearCategory = () => {
    updateParams({ categoria: '', pagina: 1 })
  }

  const handleCategorySelect = (slug: string) => {
    updateParams({ categoria: slug, tag: '', pagina: 1 })
  }

  const handleTagSelect = (slug: string) => {
    updateParams({ tag: slug, pagina: 1 })
  }

  const handleFilterOptionsLoaded = (data: { categories: Category[]; tags: Tag[] }) => {
    setAllCategories(data.categories)
    setAllTags(data.tags)
  }

  const paginationItems = useMemo(() => {
    const totalPages = results?.totalPages ?? 0
    if (totalPages <= 1) return []

    const items: (number | 'ellipsis')[] = []
    const addPage = (value: number) => items.push(value)

    if (totalPages <= 7) {
      for (let index = 1; index <= totalPages; index += 1) addPage(index)
      return items
    }

    addPage(1)
    if (page > 3) items.push('ellipsis')
    for (let index = Math.max(2, page - 1); index <= Math.min(totalPages - 1, page + 1); index += 1) {
      addPage(index)
    }
    if (page < totalPages - 2) items.push('ellipsis')
    addPage(totalPages)
    return items
  }, [page, results?.totalPages])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>CENTRAL DE CONHECIMENTO</span>
          <h1>O que você está buscando hoje?</h1>

          <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
            <label htmlFor="search-page-input" className="sr-only">
              Buscar artigos
            </label>
            <input
              id="search-page-input"
              type="search"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Pesquisar por artigos, tutoriais ou integrações…"
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton} aria-label="Buscar">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          <div className={styles.filtersBlock}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Categorias</span>
              <div className={styles.pillRow}>
                <button
                  type="button"
                  className={`${styles.pill} ${!categorySlug ? styles.pillActive : ''}`}
                  onClick={handleClearCategory}
                >
                  Tudo
                </button>
                {sidebarData?.filterCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`${styles.pill} ${categorySlug === category.slug ? styles.pillActive : ''}`}
                    onClick={() => handleCategoryFilter(category.slug)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Filtrar por categoria ou tag</span>
              <CategoryTagFilterSelects
                className={styles.selectFilters}
                selectedCategorySlug={categorySlug || undefined}
                selectedTagSlug={tagSlug || undefined}
                onCategorySelect={handleCategorySelect}
                onTagSelect={handleTagSelect}
                onOptionsLoaded={handleFilterOptionsLoaded}
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Conteúdo</span>
              <div className={styles.pillRow}>
                <button
                  type="button"
                  className={`${styles.pill} ${contentFilter === 'artigos' ? styles.pillActive : ''}`}
                  onClick={() => handleContentFilter('artigos')}
                >
                  <span className={styles.pillIcon} aria-hidden="true">📄</span>
                  Artigos
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${contentFilter === 'videos' ? styles.pillActive : ''}`}
                  onClick={() => handleContentFilter('videos')}
                >
                  <span className={styles.pillIcon} aria-hidden="true">▶</span>
                  Vídeos
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${contentFilter === 'tutoriais' ? styles.pillActive : ''}`}
                  onClick={() => handleContentFilter('tutoriais')}
                >
                  <span className={styles.pillIcon} aria-hidden="true">📘</span>
                  Tutoriais
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.contentInner}>
          <div className={styles.resultsColumn}>
            <div className={styles.resultsHeader}>
              <p className={styles.resultsCount}>
                {isLoading && !results
                  ? 'Carregando artigos...'
                  : formatResultsLabel(results?.total ?? 0, resultsLabel)}
              </p>
              <label className={styles.sortControl}>
                <span>Ordenar por:</span>
                <select
                  value={sort}
                  onChange={(event) =>
                    updateParams({ ordem: event.target.value as SearchSort, pagina: 1 })
                  }
                >
                  <option value="relevance">Relevância</option>
                  <option value="recent">Mais recentes</option>
                </select>
              </label>
            </div>

            {isLoading && <Spinner />}

            {!isLoading && results && results.posts.length === 0 && (
              <EmptyState
                title="Nenhum resultado"
                description={
                  resultsLabel
                    ? `Não encontramos artigos para "${resultsLabel}".`
                    : 'Não encontramos artigos publicados.'
                }
              />
            )}

            {!isLoading && results && results.posts.length > 0 && (
              <div className={styles.resultsList}>
                {results.posts.map((post) => (
                  <SearchResultCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {!isLoading && results && results.totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Paginação de resultados">
                <button
                  type="button"
                  className={styles.pageControl}
                  disabled={page <= 1}
                  onClick={() => updateParams({ pagina: page - 1 })}
                  aria-label="Página anterior"
                >
                  ‹
                </button>
                {paginationItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className={styles.pageEllipsis}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`${styles.pageButton} ${page === item ? styles.pageButtonActive : ''}`}
                      onClick={() => updateParams({ pagina: item })}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className={styles.pageControl}
                  disabled={page >= (results?.totalPages ?? 1)}
                  onClick={() => updateParams({ pagina: page + 1 })}
                  aria-label="Próxima página"
                >
                  ›
                </button>
              </nav>
            )}
          </div>

          {sidebarData && <SearchPageSidebar data={sidebarData} activeTagSlug={tagSlug || undefined} />}
        </div>
      </section>
    </div>
  )
}
