# Toucano Beans

Specialty coffee storefront built with **React + Vite** and **Supabase Auth**.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build |

## Environment

Set either Vite or Next-style public keys in `.env.local`:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- or `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The authoritative Supabase client lives at `src/lib/supabaseClient.js`.
