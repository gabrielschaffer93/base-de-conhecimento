/**
 * Generates SQL upsert for a single WordPress post (treinamentoscrm fix).
 *
 * Usage: npx tsx --tsconfig tsconfig.scripts.json scripts/generate-single-post-sql.ts treinamentoscrm
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import * as cheerio from 'cheerio'
import { htmlToTiptapContent } from './wordpress-import/htmlToTiptap.js'
import { NOVOAJUDA_BASE_URL } from './wordpress-import/config.js'
import { rewriteInternalLinks, slugify } from './wordpress-import/utils.js'

interface WpPost {
  slug: string
  date_gmt: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  _embedded?: {
    'wp:term'?: Array<Array<{ taxonomy: string; name: string }>>
  }
}

function decodeHtml(text: string): string {
  return cheerio.load(`<div>${text}</div>`)('div').text()
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlJson(value: unknown): string {
  return `${sqlString(JSON.stringify(value))}::jsonb`
}

function buildExcerpt(content: Record<string, unknown>): string | null {
  const nodes = (content.content as Array<Record<string, unknown>> | undefined) ?? []
  const text = nodes
    .flatMap((node) => {
      const inner = node.content as Array<{ text?: string }> | undefined
      return inner?.map((chunk) => chunk.text ?? '') ?? []
    })
    .join(' ')
    .trim()

  if (!text) return null
  return text.length > 240 ? `${text.slice(0, 237)}...` : text
}

function loadPost(slug: string): WpPost {
  const cachePath = `scripts/output/${slug}-wp.json`
  try {
    const raw = readFileSync(cachePath, 'utf8').replace(/^\uFEFF/, '')
    const parsed = JSON.parse(raw) as WpPost
    if (parsed.slug === slug && parsed.content?.rendered) return parsed
  } catch {
    // fall through
  }

  throw new Error(`Missing cache file ${cachePath}. Fetch from ${NOVOAJUDA_BASE_URL}/wp-json/wp/v2/posts?slug=${slug}`)
}

function extractCategories(post: WpPost) {
  const terms = post._embedded?.['wp:term']?.flat() ?? []
  const categories = terms.filter((term) => term.taxonomy === 'category').map((term) => term.name)
  return {
    categoryName: categories[0] ?? 'CRM',
    tagNames: categories.slice(1),
  }
}

const slug = process.argv[2] ?? 'treinamentoscrm'
const post = loadPost(slug)
const title = decodeHtml(post.title.rendered)
const rewrittenHtml = rewriteInternalLinks(post.content.rendered)
const content = htmlToTiptapContent(rewrittenHtml)
const excerpt = buildExcerpt(content)
const { categoryName, tagNames } = extractCategories(post)
const publishedAt = post.date_gmt ? `${post.date_gmt.replace(' ', 'T')}Z` : new Date().toISOString()

const lines = [
  '-- Upsert single post from novoajuda WordPress',
  `-- slug: ${slug}`,
  `-- source: ${NOVOAJUDA_BASE_URL}/${slug}/`,
  '',
  'BEGIN;',
  '',
  `INSERT INTO categories (name, slug, sort_order)`,
  `VALUES (${sqlString(categoryName)}, ${sqlString(slugify(categoryName))}, 0)`,
  `ON CONFLICT (slug) DO NOTHING;`,
  '',
]

for (const tagName of tagNames) {
  lines.push(
    `INSERT INTO tags (name, slug) VALUES (${sqlString(tagName)}, ${sqlString(slugify(tagName))}) ON CONFLICT (slug) DO NOTHING;`,
  )
}

lines.push(
  `INSERT INTO posts (`,
  `  title, slug, excerpt, content, status, category_id, author_id,`,
  `  featured_image_url, meta_title, meta_description, published_at, created_at, updated_at`,
  `) VALUES (`,
  `  ${sqlString(title)},`,
  `  ${sqlString(slug)},`,
  `  ${excerpt ? sqlString(excerpt) : 'NULL'},`,
  `  ${sqlJson(content)},`,
  `  'published',`,
  `  (SELECT id FROM categories WHERE slug = ${sqlString(slugify(categoryName))} LIMIT 1),`,
  `  NULL,`,
  `  NULL,`,
  `  ${sqlString(title)},`,
  `  ${excerpt ? sqlString(excerpt) : 'NULL'},`,
  `  ${sqlString(publishedAt)},`,
  `  ${sqlString(publishedAt)},`,
  `  NOW()`,
  `)`,
  `ON CONFLICT (slug) DO UPDATE SET`,
  `  title = EXCLUDED.title,`,
  `  excerpt = EXCLUDED.excerpt,`,
  `  content = EXCLUDED.content,`,
  `  status = 'published',`,
  `  category_id = EXCLUDED.category_id,`,
  `  meta_title = EXCLUDED.meta_title,`,
  `  meta_description = EXCLUDED.meta_description,`,
  `  updated_at = NOW();`,
  '',
)

if (tagNames.length) {
  lines.push(
    `DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = ${sqlString(slug)});`,
  )
  for (const tagName of tagNames) {
    lines.push(
      `INSERT INTO post_tags (post_id, tag_id)`,
      `SELECT p.id, t.id FROM posts p JOIN tags t ON t.slug = ${sqlString(slugify(tagName))}`,
      `WHERE p.slug = ${sqlString(slug)} ON CONFLICT DO NOTHING;`,
    )
  }
}

lines.push(
  `SELECT id, slug, title, status, length(content::text) AS content_chars`,
  `FROM posts WHERE slug = ${sqlString(slug)};`,
  '',
  'COMMIT;',
  '',
)

const outPath = `scripts/sql/migrate-post-${slug}.sql`
mkdirSync('scripts/sql', { recursive: true })
writeFileSync(outPath, lines.join('\n'), 'utf8')

const contentNodes = (content.content as unknown[] | undefined)?.length ?? 0
console.log(`Wrote ${outPath}`)
console.log(`Title: ${title}`)
console.log(`TipTap nodes: ${contentNodes}`)
console.log(`HTML source: ${post.content.rendered.length} chars`)
