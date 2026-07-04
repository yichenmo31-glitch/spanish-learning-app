# Alma – Your AI Spanish Coach

A voice-based AI Spanish learning app (React + Vite + Gemini) with **user accounts
and a cloud backend** powered by [Supabase](https://supabase.com) (auth + Postgres).

Each user can register / log in, and their profile, learning history, and
vocabulary notebook are stored per-account in the cloud.

## Prerequisites

- Node.js 18+
- A Google Gemini API key — https://aistudio.google.com/apikey
- A free Supabase account — https://supabase.com

## 1. Set up the Supabase backend

1. Create a new project at https://supabase.com (pick a region + database password).
2. In the dashboard: **SQL Editor → New query**, paste the whole contents of
   [`supabase_schema.sql`](supabase_schema.sql), and click **Run**. This creates the
   `profiles`, `sessions`, and `vocabulary` tables with Row Level Security so each
   user can only see their own data.
3. **Authentication → Providers → Email**: for the simplest experience, turn
   **"Confirm email" OFF** so new sign-ups can log in immediately. (Leave it on if
   you want email verification — users will then need to confirm before logging in.)
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key —
   you'll need them in the next step.

## 2. Configure environment variables

Edit [`.env.local`](.env.local):

```
GEMINI_API_KEY=your-real-gemini-key
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

> The anon key is safe to expose in the frontend — Row Level Security protects the
> data. The Gemini key, however, is bundled into the client, so use a rate-limited
> key and never commit it.

## 3. Run locally

```
npm install
npm run dev
```

## 4. Deploy (Vercel)

1. Push this repo to GitHub.
2. On https://vercel.com → **Add New → Project** → import the repo (Vite is
   auto-detected: build `vite build`, output `dist`).
3. Add the three environment variables from step 2 under **Environment Variables**.
4. **Deploy.**

Netlify works the same way: build command `npm run build`, publish directory `dist`.
