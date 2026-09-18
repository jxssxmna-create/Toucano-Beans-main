# Supabase Auth & Profiles

## Local SQL

Apply the migration in `supabase/migrations/20250918210000_harden_profiles_auth.sql` via the Supabase SQL editor or MCP `apply_migration`.

## Env

```bash
cp .env.example .env.local
```

Required:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Frontend map

| File | Role |
|------|------|
| `src/lib/supabaseClient.js` | Client init + session storage |
| `src/lib/authHelpers.js` | Validation + error mapping |
| `src/lib/profileSchema.js` | Profile field contract |
| `src/pages/SignUp.jsx` | Primary email sign-up / sign-in (wired in App) |
| `src/components/Auth.jsx` | Email + phone auth variant |
| `src/components/AccountPage.jsx` | Profile + delivery address CRUD |
| `src/components/VerifyModal.jsx` | OTP verification for checkout |
| `src/components/RoleRouter.jsx` | Route by `profiles.role` |

## Profiles columns

`id`, `email`, `full_name`, `phone_number`, `role`, `building_number`, `street_number`, `zone_number`, `google_map_link`, `created_at`, `updated_at`
