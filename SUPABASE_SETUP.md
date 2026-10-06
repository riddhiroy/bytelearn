# ByteLearn Supabase setup

Phase 2 supports Supabase with a local fallback.

## 1. Create a Supabase project

Create a project in the Supabase Dashboard.

## 2. Create the tables

Run `supabase.sql` in the Supabase SQL Editor.

This creates:
- `profiles`
- `lessons`
- `user_lessons`

It also enables Row Level Security and grants only the access the app needs.

## 3. Seed the current lessons

Run `supabase_seed.sql` after `supabase.sql`.

This moves the 10 current ByteLearn lessons into the database.

## 4. Enable anonymous sign-ins

In Supabase Dashboard:

Authentication → Sign In / Providers → Anonymous Sign-Ins → Enable.

ByteLearn uses an anonymous Supabase user so a new user can start learning without entering an email. The app can later be upgraded to Google/email authentication without changing the user data model.

## 5. Add local environment variables

Copy `.env.example` to `.env` and set:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Do not put a Supabase secret/service-role key in the app.

## 6. What the app does

When Supabase is configured:
- Lessons are loaded from `lessons`.
- User profile is stored in `profiles`.
- Likes, saves and completion are stored in `user_lessons`.
- XP is stored in `profiles.xp`.
- The app keeps a local cache so the UI can still start if Supabase is unavailable.

When Supabase is not configured, the app falls back to the existing local demo data.

## 7. Web deployment

GitHub Pages does not get local `.env` values automatically. Before using Supabase on the deployed web app, add the two `EXPO_PUBLIC_*` values as GitHub Actions environment/secrets and pass them into the build.

See the Supabase Expo/React Native setup for the current client configuration and environment-variable pattern.
