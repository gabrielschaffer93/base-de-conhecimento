/**
 * Compares article inventories between legacy (novoajuda), WordPress source,
 * and current Supabase (ajuda production DB from .env).
 *
 * Usage: npx tsx --tsconfig tsconfig.scripts.json scripts/compare-article-gaps.ts
 */
import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import { fetchListingPosts } from './wordpress-import/scraper.js'
import { extractSlugFromUrl, fetchHtml } from './wordpress-import/utils.js'

const LEGACY_BASE = 'https://novoajuda.vistasoft.com.br'
const NEW_SITE_BASE = 'https://ajuda.vistasoft.com.br'

interface ArticleRef {
  slug: string
  title: string
  url: string
  source: string
}

async function fetchSupabasePosts(label: string, url: string, key: string): Promise<ArticleRef[]> {
  const supabase = createClient(url, key)
  const pageSize = 1000
  let from = 0
  const all: ArticleRef[] = []

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('slug, title, status')
      .order('slug')
      .range(from, from + pageSize - 1)

    if (error) throw new Error(`[${label}] ${error.message}`)
    if (!data?.length) break

    for (const row of data) {
      all.push({
        slug: row.slug,
        title: row.title,
        url: `${NEW_SITE_BASE}/${row.slug}`,
        source: label,
      })
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  return all
}

async function tryDiscoverSupabaseFromSite(baseUrl: string): Promise<{ url: string; key: string } | null> {
  try {
    const html = await fetchHtml(baseUrl)
    const jsMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/)
    if (!jsMatch) return null

    const jsUrl = `${baseUrl}${jsMatch[1]}`
    const js = await fetchHtml(jsUrl)
    const supabaseUrl = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/)?.[0]
    const anonKey = js.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0]
    if (supabaseUrl && anonKey) return { url: supabaseUrl, key: anonKey }
  } catch {
    // ignore
  }
  return null
}

async function fetchNovoajudaListing(): Promise<ArticleRef[]> {
  const posts: ArticleRef[] = []

  // Try React app search page pagination via Supabase discovery
  const discovered = await tryDiscoverSupabaseFromSite(LEGACY_BASE)
  if (discovered) {
    console.log(`Discovered Supabase for novoajuda: ${discovered.url}`)
    return fetchSupabasePosts('novoajuda-supabase', discovered.url, discovered.key)
  }

  // Fallback: scrape WordPress-style listing if present
  for (let page = 1; page <= 40; page++) {
    const pageUrl = page === 1 ? `${LEGACY_BASE}/?s=` : `${LEGACY_BASE}/page/${page}/?s=`
    try {
      const html = await fetchHtml(pageUrl)
      const $ = cheerio.load(html)
      const articles = $('article.kbg-post')
      if (!articles.length) break

      articles.each((_, element) => {
        const link = $(element).find('h2.entry-title a').first()
        const url = link.attr('href')?.trim()
        const title = link.text().trim()
        if (!url || !title) return
        posts.push({
          slug: extractSlugFromUrl(url),
          title,
          url,
          source: 'novoajuda-wp-listing',
        })
      })

      const hasNext = $('.page-numbers.next').length > 0 && !$('.page-numbers.next').hasClass('disabled')
      if (!hasNext) break
    } catch {
      break
    }
  }

  return posts
}

async function fetchWordPressPosts(): Promise<ArticleRef[]> {
  const listing = await fetchListingPosts()
  return listing.map((post) => ({
    slug: post.slug,
    title: post.title,
    url: post.url,
    source: 'wordpress-listing',
  }))
}

function uniqueBySlug(items: ArticleRef[]): ArticleRef[] {
  const map = new Map<string, ArticleRef>()
  for (const item of items) {
    if (!item.slug) continue
    if (!map.has(item.slug)) map.set(item.slug, item)
  }
  return [...map.values()].sort((a, b) => a.slug.localeCompare(b.slug))
}

function diffSlugs(base: ArticleRef[], compare: ArticleRef[]) {
  const compareSet = new Set(compare.map((p) => p.slug))
  return base.filter((p) => !compareSet.has(p.slug))
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  }

  console.log('Fetching inventories...\n')

  const [currentDb, novoajuda, wordpress] = await Promise.all([
    fetchSupabasePosts('ajuda-supabase', supabaseUrl, supabaseKey),
    fetchNovoajudaListing(),
    fetchWordPressPosts().catch(() => [] as ArticleRef[]),
  ])

  const legacy = uniqueBySlug(novoajuda.length ? novoajuda : wordpress)
  const current = uniqueBySlug(currentDb)

  const missingInCurrent = diffSlugs(legacy, current)
  const extraInCurrent = diffSlugs(current, legacy)

  const report = {
    generatedAt: new Date().toISOString(),
    counts: {
      legacy: legacy.length,
      currentSupabase: current.length,
      wordpressListing: wordpress.length,
      novoajudaListing: novoajuda.length,
      missingInCurrent: missingInCurrent.length,
      extraInCurrent: extraInCurrent.length,
    },
    missingInCurrent,
    extraInCurrent,
    legacySource: novoajuda.length ? 'novoajuda' : 'wordpress',
  }

  const outPath = 'scripts/output/article-gap-report.json'
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')

  console.log('Counts:')
  console.log(`  Legacy (novoajuda/wp): ${legacy.length}`)
  console.log(`  Current Supabase:      ${current.length}`)
  console.log(`  Missing in current:    ${missingInCurrent.length}`)
  console.log(`  Extra in current:      ${extraInCurrent.length}`)
  console.log(`\nReport written to ${outPath}`)

  if (missingInCurrent.length) {
    console.log('\nMissing slugs:')
    for (const post of missingInCurrent) {
      console.log(`  - ${post.slug} | ${post.title}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
