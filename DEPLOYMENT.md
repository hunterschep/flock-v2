# Flock Deployment Guide

This guide walks you through deploying Flock to production using **Supabase** (backend) and **Vercel** (frontend hosting).

## Prerequisites

Before you begin, ensure you have:

- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account
- A [Resend](https://resend.com) account (for contact form emails)
- Your code pushed to a Git repository (GitHub recommended)

---

## Part 1: Supabase Setup

### Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name**: `flock` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the closest region to your users
4. Click **Create new project** and wait for it to provision (~2 minutes)

### Step 2: Enable PostGIS Extension

1. In your Supabase dashboard, go to **Database** → **Extensions**
2. Search for `postgis`
3. Click **Enable** on the PostGIS extension

### Step 3: Run Database Schema

1. Go to **SQL Editor** in the Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `supabase/schema_v3_optimized.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Repeat for `supabase/messaging_schema.sql`

> **Tip**: If you see any errors, run each `CREATE` statement separately to identify issues.

### Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to your production URL (e.g., `https://flock.app`)
5. Add these to **Redirect URLs**:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for local development)

### Step 5: Get Your API Keys

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them for Vercel):
   - **Project URL** (e.g., `https://abc123xyz.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### Step 6: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Magic Link
   - Reset Password

---

## Part 2: Resend Setup (Contact Form)

1. Go to [resend.com](https://resend.com) and sign in
2. Go to **API Keys** and create a new key
3. Copy the API key (starts with `re_`)
4. Optionally, verify your domain for better deliverability:
   - Go to **Domains** → **Add Domain**
   - Follow the DNS verification steps

---

## Part 3: Vercel Deployment

### Step 1: Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Project**
3. Connect your GitHub account if not already connected
4. Select your Flock repository
5. Click **Import**

### Step 2: Configure Environment Variables

Before deploying, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | Your production URL |
| `RESEND_API_KEY` | `re_...` | Resend API key for emails |
| `CONTACT_EMAIL` | `your-email@gmail.com` | Where contact form goes |
| `ALLOWED_ORIGINS` | `https://your-domain.com` | Comma-separated allowed origins |

> **Security Note**: The `service_role` key has admin access. Only use it in server-side code and never expose it to the client.

### Step 3: Deploy

1. Click **Deploy**
2. Wait for the build to complete (~2-3 minutes)
3. Your site will be live at `your-project.vercel.app`

### Step 4: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` to your new domain
5. Update Supabase redirect URLs to include your new domain

---

## Part 4: Post-Deployment Checklist

### Update Supabase URLs

After you know your production URL:

1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Update **Site URL** to your production domain
3. Add `https://your-domain.com/auth/callback` to **Redirect URLs**

### Test Core Functionality

1. **Authentication**
   - Sign up with a `.edu` email
   - Complete onboarding
   - Sign out and sign back in

2. **Contact Form**
   - Submit a test message on the landing page
   - Check that you receive the email

3. **API**
   - Visit `/api/docs` to see API documentation
   - Generate a test API key from the admin panel

### Set Up Admin Access

1. Open `app/admin/layout.tsx`
2. Find the `ADMIN_EMAILS` array
3. Add your email address:

```typescript
const ADMIN_EMAILS = [
  'your-email@university.edu',
];
```

4. Commit and redeploy

---

## Environment Variables Reference

### Required

| Variable | Where to Get | Used For |
|----------|--------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Database connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | Server-side admin |
| `NEXT_PUBLIC_SITE_URL` | Your production URL | Metadata, auth redirects |

### Optional

| Variable | Default | Used For |
|----------|---------|----------|
| `RESEND_API_KEY` | None | Contact form email delivery |
| `CONTACT_EMAIL` | `hunterschep@gmail.com` | Contact form recipient |
| `ALLOWED_ORIGINS` | Auto-detected | CORS configuration |

---

## Troubleshooting

### "Invalid login credentials" error
- Verify the user exists in Supabase Auth → Users
- Check that email verification is complete
- Ensure the password meets requirements

### Auth callback returns error
- Check Supabase → Authentication → URL Configuration
- Verify redirect URLs include your domain
- Look at browser Network tab for specific error

### Contact form not sending emails
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for failed deliveries
- Verify domain is configured if using custom sender

### API returns 401 Unauthorized
- Confirm API key exists in database
- Check that key hasn't exceeded rate limits
- Verify key has required scopes

### Map not loading
- Check browser console for errors
- Ensure location data exists in database
- Try a hard refresh (Cmd/Ctrl + Shift + R)

---

## Updating Production

When you push changes to your main branch, Vercel automatically rebuilds and deploys.

For database schema changes:

1. Test the migration locally first
2. Run the SQL in Supabase SQL Editor
3. Deploy the corresponding code changes

---

## Security Considerations

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** in client-side code
2. **Enable RLS** on all tables (already configured in schema)
3. **Rate limiting** is enforced on API routes
4. **K-Anonymity** ensures minimum cohort sizes in API responses
5. **CORS** is configured to reject unauthorized origins

---

## Support

For issues or questions:
- Open an issue on GitHub
- Use the contact form on the site
- Email the administrator directly

---

Good luck with your deployment! 🎉
