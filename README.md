# Flock v2

Improved Flock application that connects alumni using Supabase authentication, geospatial queries, and a map-based discovery UI.

## Architecture

- Frontend: Next.js 16 (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4 utilities + custom glassmorphism styles in `app/globals.css`
- State: React Query provider at `components/providers/QueryProvider.tsx`
- Map: MapLibre via `react-map-gl`, turf.js for centroids, D3 for color scales
- Backend: Supabase Postgres with PostGIS, Supabase Auth (magic links)
- API: Next.js route handlers in `app/api`

## Key Features

- OTP sign-in restricted to `.edu` addresses (`app/auth`)
- Auth callback exchanges Supabase session and routes users to onboarding or dashboard
- Five-step onboarding wizard collecting profile, status, location, and social data
- Dashboard with classmates list, client-side filters, and contact links
- Map drill-down (world, country, state) with institution and proximity filtering
- Profile editor with privacy controls and location update throttling

## Directory Layout

```
app/
  layout.tsx            // global font config, QueryProvider
  page.tsx              // landing page, redirects signed-in users
  auth/                 // magic link entry and callback handler
  onboarding/           // multi-step onboarding workflow
  dashboard/            // map view + classmates feed
  profile/edit/         // profile management page
  api/locations/        // geospatial aggregation endpoint
components/
  InteractiveStarfield.tsx
  map/FlockMap.tsx      // MapLibre rendering logic
  map/Legend.tsx
  providers/QueryProvider.tsx
lib/
  supabase/             // browser/server clients, middleware helpers
  constants/            // university and location metadata
  types/database.ts     // generated Supabase types
  utils.ts              // shared helpers (color bucket logic)
supabase/
  schema_v3_optimized.sql
  seed_bc_users.sql
  seed_v3_test_users.sql
```

## Prerequisites

- Node.js 20.9 or newer
- Supabase project with PostGIS enabled
- MapLibre access relies on public Stadia tiles (no extra key required)

## Initial Setup

```bash
git clone <repo>
cd flock-v2
npm install
```

1. Create `.env.local` and set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
2. In Supabase SQL editor, run `supabase/schema_v3_optimized.sql`
3. Optional: load sample data from `supabase/seed_*.sql`
4. In Supabase Auth settings, enable Email provider and configure redirect to `http://localhost:3000/auth/callback`

## Development

```bash
npm run dev
```

The dev server runs on `http://localhost:3000`. Supabase OTP links redirect back to `/auth/callback`, which checks onboarding status before routing to `/dashboard`.

## Supabase Schema Notes

- Central table `public.users` stores identity, status, geospatial data, and preferences
- `location` column uses `geography(Point, 4326)` with a GiST index for 50-mile proximity searches
- Row Level Security policies grant access to authenticated users only
- `get_current_user_data()` helper exposes institution and location for policies without breaking RLS

## Map Data Flow

1. `FlockMap` queries `/api/locations`
2. Route handler validates the caller, loads classmates, and aggregates results by geo level
3. Color buckets computed via `getCustomBuckets`, legend rendered by `Legend`
4. City markers display counts and allow quick filtering in the dashboard

## Available Scripts

- `npm run dev` – Next.js dev server
- `npm run build` – production build
- `npm run start` – production server
- `npm run lint` – ESLint (Next.js config)

## Deployment Checklist

1. Set environment variables on the hosting platform:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Update Supabase Auth redirect URLs for the deployed domain
3. Migrate database changes through Supabase SQL editor or migrations tooling

## License

MIT
