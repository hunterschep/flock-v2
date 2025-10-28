# Flock

A platform to connect with new grads from your university or in your city.

## Features

- **University Network**: Connect with grads from your institution
- **Location-Based Discovery**: Find alumni in your city
- **Profile Management**: Share your current status (employed, grad school, or looking)
- **Roommate Matching**: Connect with potential roommates
- **Social Integration**: Link your LinkedIn, Twitter, and personal website

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database & Auth**: Supabase (Postgres + Auth)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- A Supabase account (free tier works great)
- A Vercel account for deployment (optional)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd flock-v2
npm install
```

### 2. Set up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned (~2 minutes)
3. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public Key

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Set up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open `supabase/schema.sql` in this repo
3. Copy the entire contents and paste into the SQL Editor
4. Click **Run** to execute

This will create:
- Tables: `institutions`, `users`, `profiles`
- Row Level Security (RLS) policies
- Helper views
- Sample institutions (Stanford, MIT, Berkeley, etc.)

### 5. Configure Email Authentication

1. In Supabase dashboard, go to **Authentication > Providers**
2. Enable **Email** provider
3. For development, you can disable email confirmation:
   - Go to **Authentication > Settings**
   - Uncheck "Enable email confirmations" (dev only!)
   - Set "Site URL" to `http://localhost:3000`
   - Add `http://localhost:3000/**` to "Redirect URLs"

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Sign Up Flow

1. Go to `/sign-up`
2. Enter a `.edu` email address
3. Check your email for the magic link
4. Click the link to authenticate
5. Complete the onboarding flow:
   - Basic info (name, graduation year)
   - Current status (employed/grad school/looking)
   - Additional details (employer/program)
   - Location (city, state)
   - Social links & roommate preference

### Dashboard

After onboarding, you'll see:
- Your profile card
- List of classmates from your university
- Ability to edit your profile
- Social links for each classmate

## Project Structure

```
flock-v2/
├── app/
│   ├── (routes)
│   │   ├── page.tsx              # Landing page
│   │   ├── sign-in/              # Sign in page
│   │   ├── sign-up/              # Sign up page
│   │   ├── onboarding/           # Multi-step onboarding
│   │   ├── dashboard/            # Main dashboard
│   │   └── profile/edit/         # Edit profile
│   ├── auth/callback/            # Auth callback handler
│   └── globals.css               # Global styles
├── components/
│   └── ui/                       # shadcn/ui components (add as needed)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   ├── types/
│   │   └── database.ts           # TypeScript types
│   └── utils.ts                  # Utility functions
├── supabase/
│   └── schema.sql                # Database schema
├── middleware.ts                 # Next.js middleware
└── SETUP.md                      # Detailed setup guide
```

## Development Notes

### .edu Email Restriction

Currently enforced client-side during sign-up. For production:
- Add server-side validation
- Maintain an allowlist of approved institutions
- Implement email verification
- Consider manual approval for new institutions

### Database

- Uses Supabase Postgres with PostGIS enabled
- Row Level Security (RLS) ensures users only see appropriate data
- `user_profiles` view joins users + institutions + profiles for easy querying

### Authentication

- Uses Supabase Auth with magic links (OTP)
- Middleware handles route protection
- Users must complete onboarding before accessing dashboard

### Location Privacy

- Currently stores city/state as text
- Future: Use H3 hexagonal indexing for privacy-preserving location
- Never expose exact coordinates

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Update Supabase Settings

After deploying to Vercel:
1. Go to Supabase dashboard > Authentication > Settings
2. Update "Site URL" to your Vercel domain
3. Add `https://your-app.vercel.app/**` to "Redirect URLs"

## Roadmap

Phase 1 (Current):
- ✅ Authentication with .edu emails
- ✅ User onboarding
- ✅ Profile management
- ✅ Same-school classmate list

Phase 2 (Next):
- [ ] Search functionality
- [ ] Filter by status, location, roommate preference
- [ ] Better institution management

Phase 3 (Future):
- [ ] Map view with pins
- [ ] Heatmap of grads by city
- [ ] 50-mile radius for cross-school discovery
- [ ] H3 geospatial indexing

Phase 4 (Later):
- [ ] Wave/connection system
- [ ] Direct messaging
- [ ] Roommate board with detailed listings
- [ ] Admin dashboard
- [ ] Analytics API for institutions

## Contributing

This is a personal project, but feedback and suggestions are welcome!

## License

MIT
