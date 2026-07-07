import 'dotenv/config'
import { writeFileSync, readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env')

  const supabase = createClient(url, key)
  const all: Array<{ slug: string; title: string; status: string }> = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('slug, title, status')
      .order('slug')
      .range(from, from + 999)

    if (error) throw error
    if (!data?.length) break
    all.push(...data)
    if (data.length < 1000) break
    from += 1000
  }

  writeFileSync('scripts/output/ajuda-supabase-posts.json', JSON.stringify(all, null, 2))
  console.log(`ajuda supabase posts: ${all.length}`)
  console.log(`published: ${all.filter((p) => p.status === 'published').length}`)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
