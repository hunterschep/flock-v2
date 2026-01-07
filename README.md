# Flock

Flock is an alumni networking platform that connects university graduates through geospatial proximity and shared institutions. Users discover other alumni on an interactive map, filter by location or status, and communicate via real-time messaging.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack React Query
- **Map**: MapLibre GL via `react-map-gl`, turf.js for geometry, D3 for color scales
- **Backend**: Supabase (Postgres + PostGIS, Auth, Realtime)
- **Hosting**: Vercel (or any Node.js host)

## Architecture

### Authentication

Supabase Auth with magic link OTP. Only `.edu` email addresses are accepted. The flow:

1. User enters `.edu` email at `/auth`
2. Supabase sends OTP link
3. User clicks link, redirected to `/auth/callback`
4. Callback exchanges code for session, checks `onboarding_completed`
5. Routes to `/onboarding` (new users) or `/dashboard` (existing users)

Session refresh handled by Next.js middleware (`middleware.ts`) on every request.

### Database

Postgres with PostGIS extension. Core tables:

| Table | Purpose |
|-------|---------|
| `institutions` | University registry (name, domain) |
| `users` | User profiles, location, status, preferences |
| `user_connections` | Block/hide/favorite relationships |
| `conversations` | Direct message threads |
| `messages` | Individual messages with read receipts |

Key design decisions:

- Location stored as `GEOGRAPHY(POINT, 4326)` with GiST index for 50-mile proximity queries via `ST_DWithin`
- Row Level Security (RLS) restricts access to authenticated users only
- `get_current_user_data()` SECURITY DEFINER function exposes caller's institution/location to RLS policies without recursion
- Full-text search via `tsvector` column with weighted fields (name, bio, employer, city)
- Profile completeness calculated by trigger on insert/update

### Data Access Patterns

Users can view other users if:
- Same institution, OR
- Within 50 miles (80,467 meters)
- AND target has `profile_visible = true` and `onboarding_completed = true`
- AND target is not blocked/hidden by viewer

### Real-time Messaging

Built on Supabase Realtime (WebSocket). The messaging system:

- Creates a `conversations` row on first message between two users
- Messages stored in `messages` table with `is_read` and `read_at` tracking
- Client subscribes to Postgres changes on both tables
- Unread counts computed client-side from message state

### Map Data Flow

1. `FlockMap` component calls `/api/locations`
2. Route handler validates auth, queries classmates, aggregates by geo level (country/state/city)
3. Returns GeoJSON-like structure with counts per region
4. MapLibre renders choropleth with D3 color buckets
5. Drill-down on click filters dashboard classmate list

## Directory Structure

```
app/
  layout.tsx              # Root layout, fonts, QueryProvider
  page.tsx                # Landing page (redirects auth users to dashboard)
  auth/                   # Magic link entry (/auth) and callback handler
  onboarding/             # Multi-step profile setup wizard
  dashboard/              # Main app: map + classmate list + filters
  messages/               # Real-time messaging UI
  profile/edit/           # Profile editor with privacy controls
  api/locations/          # Geospatial aggregation endpoint
  privacy/                # Privacy policy
  terms/                  # Terms of service

components/
  map/FlockMap.tsx        # MapLibre map component
  map/Legend.tsx          # Color scale legend
  messaging/              # ConversationList, MessageView, UnreadBadge
  providers/QueryProvider # React Query provider
  InteractiveStarfield    # Animated background
  Footer.tsx              # Site footer

lib/
  supabase/client.ts      # Browser Supabase client
  supabase/server.ts      # Server Supabase client (cookies)
  supabase/middleware.ts  # Session refresh logic
  types/database.ts       # Generated Supabase types
  types/messaging.ts      # Messaging type definitions
  constants/              # University list, location metadata
  utils.ts                # Shared helpers

supabase/
  schema_v3_optimized.sql # Main database schema
  messaging_schema.sql    # Messaging tables and RLS
  seed_*.sql              # Test data
```

## User Flow

1. **Landing** (`/`): Shows locked map preview, prompts sign-in
2. **Auth** (`/auth`): Enter .edu email, receive magic link
3. **Onboarding** (`/onboarding`): 5-step wizard collecting name, graduation year, location, status, social links
4. **Dashboard** (`/dashboard`): Interactive map, classmate list with filters (status, location, roommate), search
5. **Messages** (`/messages`): Conversation list, real-time message view
6. **Profile** (`/profile/edit`): Update info, toggle privacy settings, 30-day location lock

## Setup

### Prerequisites

- Node.js 20.9+
- Supabase project with PostGIS enabled

### Installation

```bash
git clone <repo>
cd flock-v2
npm install
```

### Environment Variables

Create `.env.local`:

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Required for production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com

# Optional - Contact form email delivery
RESEND_API_KEY=re_your-key
CONTACT_EMAIL=your-email@gmail.com

# Optional - Map tiles
NEXT_PUBLIC_STADIA_MAPS_API_KEY=<stadia-key>
```

### Database Setup

1. Run `supabase/schema_v3_optimized.sql` in Supabase SQL editor
2. Run `supabase/messaging_schema.sql` for messaging support
3. Optionally run `supabase/seed_*.sql` for test data

### Supabase Auth Configuration

1. Enable Email provider in Supabase Auth settings
2. Set redirect URL to `http://localhost:3000/auth/callback`
3. For production, add your domain to allowed redirect URLs

## Development

```bash
npm run dev
```

Runs at `http://localhost:3000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix lint errors |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a detailed step-by-step guide.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository
3. Add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your production URL)
   - `ALLOWED_ORIGINS` (comma-separated allowed origins)
4. Deploy

### Supabase Configuration

1. In Supabase Auth > URL Configuration, set your Site URL
2. Add `https://your-domain.com/auth/callback` to redirect URLs
3. Run any pending SQL migrations from `supabase/` folder

### Admin Access

Add your email to `ADMIN_EMAILS` in `/app/admin/layout.tsx` to access the admin panel at `/admin`.

## API

The Flock API provides aggregated, anonymized alumni data for institutions.

- **Free tier**: 10 requests/minute, 100/day (max 50 results per query)
- **Extended access**: Contact us for higher limits

See `/api/docs` for full documentation.

## License

MIT
