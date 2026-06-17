import { Link } from 'react-router-dom'
import { POST_PLACEHOLDER_IMAGE_PATH } from '@/config/publicSite'
import { getPostPreviewText } from '@/lib/utils'
import type { WeeklyHighlight } from '@/features/home/homePageService'
import styles from './WeeklyHighlightCard.module.css'

interface TipTapNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
}

function findBestImageUrl(content: Record<string, unknown>): string | null {
  const candidates: { src: string; width: number }[] = []

  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const tipTapNode = node as TipTapNode
    if (tipTapNode.type === 'image' && typeof tipTapNode.attrs?.src === 'string') {
      const width = Number(tipTapNode.attrs.width) || 0
      candidates.push({ src: tipTapNode.attrs.src, width })
    }
    if (Array.isArray(tipTapNode.content)) tipTapNode.content.forEach(walk)
  }

  walk(content)
  if (candidates.length === 0) return null

  const sorted = [...candidates].sort((a, b) => b.width - a.width)
  const best = sorted.find((candidate) => candidate.width >= 120) ?? sorted[0]
  return best.src
}

function findFirstImageUrl(content: Record<string, unknown>): string | null {
  let firstUrl: string | null = null

  function walk(node: unknown) {
    if (firstUrl || !node || typeof node !== 'object') return
    const tipTapNode = node as TipTapNode
    if (tipTapNode.type === 'image' && typeof tipTapNode.attrs?.src === 'string') {
      firstUrl = tipTapNode.attrs.src
      return
    }
    if (Array.isArray(tipTapNode.content)) tipTapNode.content.forEach(walk)
  }

  walk(content)
  return firstUrl
}

interface WeeklyHighlightCardProps {
  highlight: WeeklyHighlight
}

export function WeeklyHighlightCard({ highlight }: WeeklyHighlightCardProps) {
  const { post } = highlight
  const categoryLabel = post.category?.name ?? 'Artigo'
  const previewText = post.excerpt ?? getPostPreviewText(post.content, 160)
  const imageUrl = post.featured_image_url || findFirstImageUrl(post.content) || findBestImageUrl(post.content)

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {imageUrl ? (
          <img src={imageUrl} alt="" className={styles.image} />
        ) : (
          <div className={styles.imageFallback} aria-hidden="true">
            <img src={POST_PLACEHOLDER_IMAGE_PATH} alt="" className={styles.placeholderIcon} />
          </div>
        )}
      </div>
      <div className={styles.content}>
        <span className={styles.tag}>{categoryLabel.toUpperCase()}</span>
        <h3>{post.title}</h3>
        {previewText && <p>{previewText}</p>}
        <Link to={`/artigos/${post.slug}`} className={styles.readMore}>
          Ler artigo completo →
        </Link>
      </div>
    </article>
  )
}
