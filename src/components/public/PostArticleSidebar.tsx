import { Link } from 'react-router-dom'
import { RelatedPostMiniCard } from '@/components/public/RelatedPostMiniCard'
import type { RelatedPostsData } from '@/features/posts/postsService'
import type { Category, PostWithRelations, Tag } from '@/types/database'
import styles from './PostArticleSidebar.module.css'

interface PostArticleSidebarProps {
  category: Category | null | undefined
  tags: Tag[] | undefined
  related: RelatedPostsData
}

function RelatedPostList({ posts }: { posts: PostWithRelations[] }) {
  if (posts.length === 0) return null

  return (
    <ul className={styles.postList}>
      {posts.map((post) => (
        <li key={post.id}>
          <RelatedPostMiniCard post={post} />
        </li>
      ))}
    </ul>
  )
}

export function PostArticleSidebar({ category, tags = [], related }: PostArticleSidebarProps) {
  const hasCategoryPosts = related.categoryPosts.length > 0
  const hasTagPosts = related.tagPosts.length > 0
  const hasTags = tags.length > 0
  const showSubject = Boolean(category) || hasCategoryPosts

  if (!showSubject && !hasTags && !hasTagPosts) {
    return null
  }

  return (
    <aside className={styles.sidebar} aria-label="Artigos relacionados">
      <section className={styles.widget}>
        <h2 className={styles.widgetTitle}>Artigos relacionados</h2>

        {showSubject && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Assunto</h3>
            {category && (
              <Link to={`/categorias/${category.slug}`} className={styles.categoryLink}>
                {category.name}
              </Link>
            )}
            {hasCategoryPosts && <RelatedPostList posts={related.categoryPosts} />}
          </div>
        )}

        {hasTags && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tags</h3>
            <div className={styles.tagCloud}>
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={`/busca?tag=${encodeURIComponent(tag.slug)}`}
                  className={styles.tagPill}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {hasTagPosts && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Por tags parecidas</h3>
            <RelatedPostList posts={related.tagPosts} />
          </div>
        )}
      </section>
    </aside>
  )
}
