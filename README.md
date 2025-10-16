# Housing Solutions – Authentication System

This repository contains a secure authentication flow for the Housing Solutions platform, powered by Supabase. It includes signup, login, role-based redirects, and a minimal, neutral UI with no framework branding.

## Prerequisites

- Node.js 18+ (project is tested on Node 20)
- A Supabase project with URL and keys

## Environment Setup

Create a `.env.local` file in the project root and set the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=... 
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
```

## Development

Run the dev server:

```
npm run dev
```

Open `http://localhost:3000` to access the app.

## Key Features

- Signup with `react-hook-form` and Zod validation
- Password strength indicator
- Supabase authentication with `emailRedirectTo`
- Role-based redirect on login (`/dashboard` or `/admin`)
- Neutral UI with no framework branding

## Project Structure

- `src/app/` – App routes and pages
- `src/lib/` – Supabase client and validations
- `src/components/` – Reusable UI components

## Deployment

Use any Node-compatible hosting provider. Ensure environment variables are set securely on the server. Avoid exposing `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` in client code.
