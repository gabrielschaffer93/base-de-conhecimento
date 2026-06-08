# Migration to Loft Infrastructure

Checklist for moving from Supabase (test phase) to Loft production infrastructure.

## Phase 1 — Preparation

- [ ] Document all Supabase env vars and project ID
- [ ] Export PostgreSQL schema diff vs Loft target DB
- [ ] Inventory all files in Storage buckets
- [ ] List all auth users and profile roles

## Phase 2 — Database

- [ ] Run equivalent migrations on Loft PostgreSQL
- [ ] Export data: `pg_dump --data-only` from Supabase
- [ ] Import into Loft DB with UUID preservation
- [ ] Verify RLS or equivalent app-level authorization
- [ ] Update connection string / Supabase URL in env

Options:

- Keep Supabase Postgres, migrate only Storage + Auth
- Full migration to Loft-managed Postgres

## Phase 3 — Storage

- [ ] Implement `LoftStorageAdapter` in `src/lib/storage/loftStorageAdapter.ts`
- [ ] Sync files: Supabase bucket → Loft CDN/S3
- [ ] Preserve path structure `{year}/{month}/{uuid}-{filename}`
- [ ] Bulk update `media_assets.public_url` and `storage_path`
- [ ] Update post `featured_image_url` and inline image URLs in content JSON
- [ ] Switch default adapter export to `LoftStorageAdapter`

## Phase 4 — Authentication

- [ ] Evaluate Loft SSO / corporate IdP integration
- [ ] Map SSO groups to `user_role` enum
- [ ] Migration script: Supabase auth.users → Loft identity provider
- [ ] Update `AuthProvider` sign-in method

## Phase 5 — Frontend deployment

- [ ] Build: `npm run build`
- [ ] Deploy static assets to Loft CDN/hosting
- [ ] Configure DNS: `ajuda.vistasoft.com.br` → new app
- [ ] SSL certificates

## Phase 6 — Copan packages

- [ ] Configure `NPM_TOKEN` for `@loft/react-loft`
- [ ] Replace custom UI components with Copan components incrementally
- [ ] Import Inter font from Copan CDN

## Phase 7 — Validation

- [ ] Smoke test all admin flows
- [ ] Verify public site SEO and URLs (redirect old WordPress slugs if needed)
- [ ] Load test media delivery
- [ ] Security review (RLS, CORS, CSP headers)

## Rollback plan

- Keep Supabase project active read-only for 30 days
- DNS TTL low during cutover
- Database backup before migration

## WordPress decommission

After successful migration:

- [ ] Export final WordPress backup
- [ ] Set up 301 redirects from old URLs
- [ ] Decommission WordPress hosting
