import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { fetchPublishedPosts } from '@/features/posts/postsService'
import { formatDate, getPostPreviewText } from '@/lib/utils'
import type { PostWithRelations } from '@/types/database'
import styles from '../public/HomePage.module.css'
import searchStyles from './SearchPage.module.css'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PostWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsLoading(true)
    setHasSearched(true)
    try {
      const data = await fetchPublishedPosts({ search: query.trim() })
      setResults(data)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1>Buscar artigos</h1>
      <form onSubmit={handleSearch} className={searchStyles.searchForm}>
        <Input
          name="search"
          placeholder="Digite palavras-chave…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={searchStyles.searchInput}
        />
        <Button type="submit" isLoading={isLoading}>
          Buscar
        </Button>
      </form>

      {isLoading && <Spinner />}
      {!isLoading && hasSearched && results.length === 0 && (
        <EmptyState title="Nenhum resultado" description={`Não encontramos artigos para "${query}".`} />
      )}
      {!isLoading && results.length > 0 && (
        <div className={styles.grid}>
          {results.map((post) => {
            const previewText = getPostPreviewText(post.content)

            return (
            <Card key={post.id} className={styles.postCard}>
              <div className={styles.postContent}>
                <Link to={`/artigos/${post.slug}`}>
                  <h3>{post.title}</h3>
                </Link>
                {previewText && <p>{previewText}</p>}
                <time>{formatDate(post.published_at ?? post.created_at)}</time>
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
