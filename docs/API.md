# API / Data Layer

All data access goes through Supabase client (`src/lib/supabase/client.ts`). No custom backend in MVP.

## Service modules

| Module | File | Operations |
|--------|------|------------|
| Posts | `features/posts/postsService.ts` | CRUD, public listing, dashboard stats |
| Categories | `features/categories/categoriesService.ts` | CRUD |
| Tags | `features/tags/tagsService.ts` | CRUD |
| Media | `features/media/mediaService.ts` | Upload, list, delete |
| Users | `features/users/usersService.ts` | List, role update, invite |

## Key queries

### Public posts

```typescript
supabase
  .from('posts')
  .select('*, author:profiles(...), category:categories(...), post_tags(...)')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
```

### Admin posts (includes drafts)

RLS allows authenticated roles to SELECT all posts.

### Post by slug

```typescript
supabase.from('posts').select(...).eq('slug', slug).eq('status', 'published').single()
```

### Create post

```typescript
supabase.from('posts').insert({ title, slug, content, status, author_id, ... })
```

Then sync tags via `post_tags` junction table.

### Upload media

1. `storageAdapter.upload(file, bucket, path)`
2. `supabase.from('media_assets').insert({ ... })`

## Types

TypeScript interfaces in `src/types/database.ts`. Regenerate from Supabase when schema changes:

```bash
supabase gen types typescript --local > src/types/supabase.generated.ts
```

## Error handling

Services throw on Supabase errors. UI layers catch and show Portuguese user messages.

## Environment variables

| Variable | Usage |
|----------|-------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (RLS enforced) |

Never use service role key in this React app.
