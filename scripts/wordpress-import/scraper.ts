import * as cheerio from 'cheerio'

import { LISTING_SEARCH_URL, WORDPRESS_BASE_URL } from './config.js'
import { extractSlugFromUrl, fetchHtml, parsePtBrDate } from './utils.js'

export interface ListingPostRef {
  url: string
  slug: string
  title: string
  categories: string[]
  publishedAt: string | null
}

export interface ScrapedArticle extends ListingPostRef {
  contentHtml: string
}

const NON_ARTICLE_SLUGS = new Set(['', 'blog', 'vista-sites', 'vista-office', 'vista-crm'])

function isImportableListingPost(post: ListingPostRef): boolean {
  if (!post.slug || NON_ARTICLE_SLUGS.has(post.slug)) return false
  if (post.url.includes('/categoria/') || post.url.includes('/author/')) return false
  return true
}

function parseCategoriesFromMeta($meta: cheerio.Cheerio<cheerio.Element>): string[] {
  return $meta
    .find('.meta-category a')
    .map((_, element) => cheerio.load(element).text().trim())
    .get()
    .filter(Boolean)
}

function parseListingPage(html: string): ListingPostRef[] {
  const $ = cheerio.load(html)
  const posts: ListingPostRef[] = []

  $('article.kbg-post').each((_, element) => {
    const article = $(element)
    const link = article.find('h2.entry-title a').first()
    const url = link.attr('href')?.trim()
    const title = link.text().trim()

    if (!url || !title) return

    const dateText = article.find('.meta-date .updated').first().text().trim()
    posts.push({
      url,
      slug: extractSlugFromUrl(url),
      title,
      categories: parseCategoriesFromMeta(article.find('.entry-meta').first()),
      publishedAt: parsePtBrDate(dateText),
    })
  })

  return posts
}

export async function fetchListingPosts(limit?: number): Promise<ListingPostRef[]> {
  const collected: ListingPostRef[] = []
  let page = 1

  while (true) {
    const pageUrl =
      page === 1 ? LISTING_SEARCH_URL : `${WORDPRESS_BASE_URL}/page/${page}/?s=`
    const html = await fetchHtml(pageUrl)
    const pagePosts = parseListingPage(html)

    if (pagePosts.length === 0) break

    collected.push(...pagePosts.filter(isImportableListingPost))
    if (limit && collected.length >= limit) {
      return collected.slice(0, limit)
    }

    const $ = cheerio.load(html)
    const hasNext = $('.page-numbers.next').length > 0 && !$('.page-numbers.next').hasClass('disabled')
    if (!hasNext) break

    page += 1
  }

  return limit ? collected.slice(0, limit) : collected
}

export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const title =
    $('h1.entry-title').first().text().trim() ||
    $('article h1').first().text().trim() ||
    $('title').first().text().split('–')[0]?.trim() ||
    ''

  const contentHtml =
    $('.entry-content.entry-single').first().html()?.trim() ??
    $('.kbg-entry-content').first().html()?.trim() ??
    $('article .entry-content').first().html()?.trim() ??
    ''

  if (!title || !contentHtml) {
    throw new Error(`Missing title or content for ${url}`)
  }

  const dateText = $('.entry-meta .meta-date .updated').first().text().trim()
  const categories = parseCategoriesFromMeta($('.entry-meta').first())

  return {
    url,
    slug: extractSlugFromUrl(url),
    title,
    categories,
    publishedAt: parsePtBrDate(dateText),
    contentHtml,
  }
}
