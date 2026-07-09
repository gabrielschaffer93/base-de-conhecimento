/**
 * Generates SQL to upsert missing articles from novoajuda WordPress into Supabase.
 *
 * Usage: npx tsx --tsconfig tsconfig.scripts.json scripts/generate-missing-posts-sql.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import * as cheerio from 'cheerio'
import { htmlToTiptapContent } from './wordpress-import/htmlToTiptap.js'
import { NOVOAJUDA_BASE_URL } from './wordpress-import/config.js'
import { rewriteInternalLinks, slugify } from './wordpress-import/utils.js'

interface GapAnalysis {
  missingFromImport: Array<{ slug: string; title: string; sourceUrl: string }>
}

interface WpTerm {
  id: number
  name: string
  slug: string
  taxonomy: string
}

interface WpPost {
  slug: string
  date_gmt: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  _embedded?: {
    'wp:term'?: WpTerm[][]
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

async function fetchWpPost(slug: string, cache: Map<string, WpPost>): Promise<WpPost | null> {
  const cached = cache.get(slug)
  if (cached) return cached

  const url = `${NOVOAJUDA_BASE_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=wp:term`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${slug}`)
  const posts = (await response.json()) as WpPost[]
  return posts[0] ?? null
}

function loadWpCache(): Map<string, WpPost> {
  const cache = new Map<string, WpPost>()
  try {
    const raw = readFileSync('scripts/output/missing-wp-posts-full.json', 'utf8').replace(/^\uFEFF/, '')
    const posts = JSON.parse(raw) as WpPost | WpPost[]
    const list = Array.isArray(posts) ? posts : [posts]
    for (const post of list) {
      if (post?.slug) cache.set(post.slug, post)
    }
  } catch {
    // no cache
  }
  return cache
}

function extractCategories(post: WpPost): { categoryName: string | null; tagNames: string[] } {
  const terms = post._embedded?.['wp:term']?.flat() ?? []
  const categories = terms.filter((term) => term.taxonomy === 'category').map((term) => term.name)
  return {
    categoryName: categories[0] ?? null,
    tagNames: categories.slice(1),
  }
}

function loadMissing(): GapAnalysis['missingFromImport'] {
  const analysis = JSON.parse(
    readFileSync('scripts/output/article-gap-analysis.json', 'utf8'),
  ) as GapAnalysis
  return analysis.missingFromImport
}

async function main() {
  const missing = loadMissing()
  const lines: string[] = [
    '-- =============================================================================',
    '-- Migrate missing articles: novoajuda (legacy WP) → Supabase posts',
    '-- =============================================================================',
    '-- Gap analysis (2026-07-07):',
    '--   novoajuda WordPress published posts: 326',
    '--   + 5 hub pages (vista-crm, vista-sites, etc.) = 331 total no legado',
    '--   ajuda (novo app /busca): ~304 artigos publicados',
    '--   Artigos faltantes identificados: 24',
    '--',
    '-- Fonte do conteúdo: https://novoajuda.vistasoft.com.br/{slug}/',
    '--',
    '-- IMPORTANTE:',
    '--   1. Rode scripts/apply-import-prerequisites.sql antes, se ainda não rodou.',
    '--   2. Este arquivo faz UPSERT por slug (idempotente).',
    '--   3. Imagens permanecem nas URLs do WordPress legado até reimport com script TS.',
    '--   4. Alternativa recomendada com migração de imagens:',
    '--      npm run import:wordpress:missing',
    '-- =============================================================================',
    '',
    'BEGIN;',
    '',
    'CREATE TEMP TABLE IF NOT EXISTS migration_missing_slugs (',
    '  slug text PRIMARY KEY,',
    '  title text NOT NULL,',
    '  source_url text NOT NULL',
    ');',
    '',
    'TRUNCATE migration_missing_slugs;',
    '',
  ]

  for (const item of missing) {
    lines.push(
      `INSERT INTO migration_missing_slugs (slug, title, source_url) VALUES (${sqlString(item.slug)}, ${sqlString(decodeHtml(item.title))}, ${sqlString(item.sourceUrl)});`,
    )
  }

  lines.push(
    '',
    '-- Artigos ainda ausentes antes da migração',
    'SELECT m.slug, m.title',
    'FROM migration_missing_slugs m',
    'LEFT JOIN posts p ON p.slug = m.slug',
    'WHERE p.id IS NULL',
    'ORDER BY m.slug;',
    '',
  )

  const failures: Array<{ slug: string; error: string }> = []
  const wpCache = loadWpCache()

  for (const item of missing) {
    try {
      const post = await fetchWpPost(item.slug, wpCache)
      if (!post?.content?.rendered) {
        failures.push({ slug: item.slug, error: 'empty content from WordPress REST API' })
        continue
      }

      const title = decodeHtml(post.title.rendered)
      const rewrittenHtml = rewriteInternalLinks(post.content.rendered)
      const content = htmlToTiptapContent(rewrittenHtml)
      const excerpt = buildExcerpt(content)
      const { categoryName, tagNames } = extractCategories(post)
      const publishedAt = post.date_gmt ? `${post.date_gmt.replace(' ', 'T')}Z` : new Date().toISOString()

      const categorySql = categoryName
        ? `(SELECT id FROM categories WHERE slug = ${sqlString(slugify(categoryName))} LIMIT 1)`
        : 'NULL'

      lines.push(`-- ${item.slug}`)

      if (categoryName) {
        lines.push(
          `INSERT INTO categories (name, slug, sort_order)`,
          `VALUES (${sqlString(categoryName)}, ${sqlString(slugify(categoryName))}, 0)`,
          `ON CONFLICT (slug) DO NOTHING;`,
        )
      }

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
        `  ${sqlString(item.slug)},`,
        `  ${excerpt ? sqlString(excerpt) : 'NULL'},`,
        `  ${sqlJson(content)},`,
        `  'published',`,
        `  ${categorySql},`,
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
        `  published_at = COALESCE(posts.published_at, EXCLUDED.published_at),`,
        `  updated_at = NOW();`,
        '',
      )

      if (tagNames.length) {
        lines.push(
          `DELETE FROM post_tags WHERE post_id = (SELECT id FROM posts WHERE slug = ${sqlString(item.slug)});`,
        )
        for (const tagName of tagNames) {
          lines.push(
            `INSERT INTO post_tags (post_id, tag_id)`,
            `SELECT p.id, t.id`,
            `FROM posts p`,
            `JOIN tags t ON t.slug = ${sqlString(slugify(tagName))}`,
            `WHERE p.slug = ${sqlString(item.slug)}`,
            `ON CONFLICT DO NOTHING;`,
          )
        }
        lines.push('')
      }
    } catch (error) {
      failures.push({
        slug: item.slug,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (failures.length) {
    lines.push('-- Posts that could not be fetched automatically:')
    for (const failure of failures) {
      lines.push(`--   ${failure.slug}: ${failure.error}`)
    }
    lines.push('')
  }

  lines.push(
    '-- Verificação pós-migração',
    'SELECT COUNT(*) AS total_posts FROM posts WHERE status = \'published\';',
    '',
    'SELECT m.slug, m.title, CASE WHEN p.id IS NULL THEN \'MISSING\' ELSE \'OK\' END AS status',
    'FROM migration_missing_slugs m',
    'LEFT JOIN posts p ON p.slug = m.slug',
    'ORDER BY m.slug;',
    '',
    'COMMIT;',
    '',
  )

  const outPath = 'scripts/sql/migrate-missing-posts.sql'
  mkdirSync('scripts/sql', { recursive: true })
  writeFileSync(outPath, lines.join('\n'), 'utf8')

  console.log(`Wrote ${outPath}`)
  console.log(`Generated upserts: ${missing.length - failures.length}/${missing.length}`)
  if (failures.length) {
    console.log('Failures:')
    for (const failure of failures) {
      console.log(`  - ${failure.slug}: ${failure.error}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
