import { readFileSync, writeFileSync } from 'node:fs'

interface WpPost {
  id: number
  slug: string
  title: { rendered: string } | string
  link: string
  modified?: string
}

interface ImportItem {
  slug: string
  title: string
  sourceUrl: string
  action: string
  postId: string
}

interface ImportReport {
  items: ImportItem[]
  errors: Array<{ slug: string; message: string }>
}

interface SupabasePost {
  slug: string
  title: string
  status: string
}

function wpTitle(post: WpPost): string {
  return typeof post.title === 'string' ? post.title : post.title.rendered
}

function loadJson<T>(path: string): T {
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
  return JSON.parse(raw) as T
}

const NON_ARTICLE_SLUGS = new Set(['', 'blog', 'vista-sites', 'vista-office', 'vista-crm'])

const novoajuda = loadJson<WpPost[]>('scripts/output/novoajuda-wp-posts.json')
const importReport = loadJson<ImportReport>('scripts/output/full-import-report.json')

let current: SupabasePost[] = []
try {
  current = loadJson<SupabasePost[]>('scripts/output/ajuda-supabase-posts.json')
} catch {
  // Supabase snapshot unavailable — analysis uses import report as proxy
}

const novoSlugs = new Map(
  novoajuda
    .filter((p) => p.slug && !NON_ARTICLE_SLUGS.has(p.slug))
    .map((p) => [p.slug, p]),
)

const importedSlugs = new Set(importReport.items.map((i) => i.slug))
const failedSlugs = new Map(importReport.errors.map((e) => [e.slug, e.message]))
const currentSlugs = new Set(current.map((p) => p.slug))

const missingFromImport = [...novoSlugs.values()].filter((p) => !importedSlugs.has(p.slug))
const missingFromCurrent = current.length
  ? [...novoSlugs.values()].filter((p) => !currentSlugs.has(p.slug))
  : missingFromImport

const failedButInNovoajuda = [...failedSlugs.entries()]
  .filter(([slug]) => novoSlugs.has(slug))
  .map(([slug, message]) => ({ slug, message, title: wpTitle(novoSlugs.get(slug)!) }))

const report = {
  generatedAt: new Date().toISOString(),
  counts: {
    novoajudaWordPressPublished: novoSlugs.size,
    novoajudaPlusHubPagesNote: 'User-reported 331 likely = 326 posts + 5 hub pages',
    fullImportSuccessful: importedSlugs.size,
    fullImportFailed: importReport.errors.length,
    currentSupabaseSnapshot: current.length || null,
    missingFromImport: missingFromImport.length,
    missingFromCurrent: missingFromCurrent.length,
  },
  missingFromImport: missingFromImport.map((p) => ({
    slug: p.slug,
    title: wpTitle(p),
    sourceUrl: p.link,
    modified: p.modified ?? null,
  })),
  missingFromCurrent: missingFromCurrent.map((p) => ({
    slug: p.slug,
    title: wpTitle(p),
    sourceUrl: p.link,
    modified: p.modified ?? null,
  })),
  failedDuringFullImport: failedButInNovoajuda,
  extraInImportNotInNovoajuda: [...importedSlugs].filter((slug) => !novoSlugs.has(slug)),
}

writeFileSync('scripts/output/article-gap-analysis.json', JSON.stringify(report, null, 2))

console.log(JSON.stringify(report.counts, null, 2))
console.log('\nMissing slugs (novoajuda → not in full import):')
for (const post of report.missingFromImport) {
  console.log(`  - ${post.slug}`)
}
