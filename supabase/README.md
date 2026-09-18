# Supabase Auth, Profiles & Admin Catalog

## Migrations

Apply files in `supabase/migrations/` (SQL editor or MCP):

| File | Purpose |
|------|---------|
| `20250918210000_harden_profiles_auth.sql` | Profiles, signup trigger, RLS |
| `20250918211000_profiles_is_admin_helper.sql` | `is_admin()` helper |
| `20250919010000_admin_products_storage.sql` | Products + `product-images` bucket |

## Admin access

Admin if `profiles.role = 'admin'` **or** email ends with `@admin.com`  
(Signup trigger + migration backfill assign the role. RLS writes use `is_admin()`.)

Route: `/admin` — menu link visible to admins only.

## Env

```bash
cp .env.example .env.local
```

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
