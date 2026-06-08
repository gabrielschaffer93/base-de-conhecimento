# Database

## ER Diagram

```mermaid
erDiagram
    auth_users ||--|| profiles : extends
    profiles ||--o{ posts : authors
    profiles ||--o{ media_assets : uploads
    categories ||--o{ posts : contains
    categories ||--o{ categories : parent
    posts ||--o{ post_tags : has
    tags ||--o{ post_tags : tagged

    profiles {
        uuid id PK
        text email
        text full_name
        user_role role
        boolean is_active
    }

    posts {
        uuid id PK
        text title
        text slug UK
        jsonb content
        post_status status
        uuid category_id FK
        uuid author_id FK
        timestamptz published_at
    }

    categories {
        uuid id PK
        text name
        text slug UK
        uuid parent_id FK
    }

    tags {
        uuid id PK
        text name
        text slug UK
    }

    media_assets {
        uuid id PK
        text storage_path
        text public_url
        media_type type
        uuid uploaded_by FK
    }
```

## Enums

- `user_role`: `super_admin`, `editor`, `viewer`
- `post_status`: `draft`, `published`, `archived`
- `media_type`: `image`, `video`, `document`

## Content format

Post `content` column stores **TipTap JSON** (ProseMirror document). Example:

```json
{
  "type": "doc",
  "content": [
    { "type": "paragraph", "content": [{ "type": "text", "text": "Hello" }] }
  ]
}
```

## Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| posts | status, slug, published_at | Listing and lookup |
| posts | GIN full-text (portuguese) | Search on title + excerpt |
| categories | slug | Public category pages |
| media_assets | type, uploaded_by | Media library filters |

## RLS summary

- **Published posts**: readable by `anon`
- **Draft/archived posts**: readable by authenticated roles only
- **Write operations**: `super_admin` and `editor` only
- **User management**: `super_admin` only
- **Profiles**: users update own record; admins manage all

## Migrations

Location: `supabase/migrations/`

Apply via Supabase CLI:

```bash
supabase db push
```

Or paste SQL into Supabase Dashboard → SQL Editor.

## First admin user

After signing up via the app or Supabase Auth:

```sql
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'your-email@company.com';
```

## Seed data

Run `supabase/seed.sql` for sample categories and tags.
