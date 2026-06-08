# Functionality

## Overview

SaaS-style knowledge base replacing WordPress. Two surfaces:

1. **Public site** — read-only access to published articles
2. **Admin panel** — authenticated content management

## User roles

| Role | Code | Permissions |
|------|------|-------------|
| Administrador | `super_admin` | Full access including user management |
| Editor | `editor` | Create/edit/publish posts, categories, tags, media |
| Visualizador | `viewer` | Read-only access to admin panel |

## Public site flows

### Home (`/`)

- Hero section with brand messaging
- Category chips linking to category pages
- Grid of recently published posts

### Article detail (`/artigos/:slug`)

- Full rich-text content (TipTap JSON rendered)
- Category, author, date, tags
- Featured image and SEO meta tags

### Category (`/categorias/:slug`)

- Lists published posts in category

### Search (`/busca`)

- Text search on title and excerpt

## Admin panel flows

### Login (`/admin/login`)

- Email + password via Supabase Auth
- Redirect to intended route after login

### Dashboard (`/admin/dashboard`)

- Stats: total posts, drafts, published, active users
- Recent posts table

### Posts (`/admin/posts`, `/admin/posts/new`, `/admin/posts/:id`)

- List with status filter and search
- Create/edit with rich text editor
- Save as draft or publish
- SEO fields and featured image URL

### Categories & Tags

- CRUD for taxonomy

### Media (`/admin/media`)

- Upload images/videos to Supabase Storage
- Copy public URL for use in posts

### Users (`/admin/users`) — super_admin only

- List users, change roles, activate/deactivate
- Invite new users (signUp + profile update)

## Roadmap (not in MVP)

- Multi-tenant organizations
- Content versioning
- Comments
- Analytics dashboard
- Corporate SSO
- WordPress content migration
- Preview tokens for draft posts
- Email invitations

## Permission matrix

| Action | super_admin | editor | viewer | anon |
|--------|:-----------:|:------:|:------:|:----:|
| View published posts | ✓ | ✓ | ✓ | ✓ |
| View drafts (admin) | ✓ | ✓ | ✓ | ✗ |
| Create/edit posts | ✓ | ✓ | ✗ | ✗ |
| Manage categories/tags | ✓ | ✓ | ✗ | ✗ |
| Upload media | ✓ | ✓ | ✗ | ✗ |
| Manage users | ✓ | ✗ | ✗ | ✗ |
