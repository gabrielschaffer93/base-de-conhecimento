# Base de Conhecimento Loft

Central de conhecimento SaaS em React, substituindo o WordPress (`ajuda.vistasoft.com.br`).

## Features

- **Site público** — artigos, categorias, busca
- **Painel admin** — login, posts, categorias, tags, mídia, usuários
- **Supabase** — Auth, PostgreSQL, Storage (fase de testes)
- **Design Loft** — tokens de cor COPAN + componentes custom (migrável para `@loft/react-loft`)

## Tech stack

- React 18+ / TypeScript
- Vite + React Router
- Supabase JS
- TipTap (rich text editor)
- Zod + React Hook Form

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase project URL and anon key.

### 3. Run database migration

Apply `supabase/migrations/20250605000000_initial_schema.sql` in Supabase SQL Editor.

Create storage buckets:

- `media-images` (public)
- `media-videos` (public)

Optionally run `supabase/seed.sql` for sample data.

### 4. Create admin user

1. Start the app and sign up via Supabase Auth dashboard, or use the Users page (after first admin exists)
2. Promote to super admin:

```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';
```

### 5. Run dev server

```bash
npm run dev
```

- Public site: http://localhost:5173
- Admin login: http://localhost:5173/admin/login

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Project structure

```
src/
├── app/           # Router and providers
├── components/    # Shared UI and layouts
├── features/      # Domain logic (auth, posts, media...)
├── pages/         # Route pages (public + admin)
├── lib/           # Supabase client, storage adapters, utils
├── styles/        # Design tokens and globals
└── types/         # TypeScript interfaces
docs/              # Technical documentation
supabase/          # SQL migrations and seed
```

## Documentation

See [docs/README.md](./docs/README.md) for full documentation index.

## Copan Design System

Official packages (private npm):

```bash
npm i @loft/react-loft @loft/tokens-loft @loft/react-icons
```

Requires `NPM_TOKEN` configured per [Copan docs](https://copan-loft.loft.technology/).

Current MVP uses CSS tokens mirroring Loft colors until Copan packages are available.

## License

Private — Loft internal use.
