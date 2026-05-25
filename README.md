# Splitwise Clone

Self-hosted expense-splitting app. Groups, equal/exact splits, balances, settle up, activity feed, and debt simplification.

## Tech stack

- **Next.js 15** (App Router, TypeScript)
- **Postgres + Prisma v7** (with `@prisma/adapter-pg`)
- **Auth.js v5** (NextAuth) — Google OAuth
- **Tailwind + shadcn/ui** (base-ui components)

---

## Local development

### Prerequisites
- Node 22+ and pnpm
- Postgres (or Docker)
- Google OAuth app (see below)

### 1. Install

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXTAUTH_URL
```

Generate AUTH_SECRET: `openssl rand -base64 32`

**Google OAuth:** Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Credentials → Create OAuth 2.0 Client ID (Web) → add `http://localhost:3000/api/auth/callback/google` as redirect URI.

### 3. Database

```bash
# Local Postgres via Docker:
docker run -d -p 5432:5432 -e POSTGRES_DB=splitwise -e POSTGRES_USER=splitwise -e POSTGRES_PASSWORD=password postgres:16-alpine

pnpm exec prisma migrate dev --name init
```

### 4. Run

```bash
pnpm dev
```

---

## VPS deployment (Docker Compose + Caddy)

```bash
# On VPS
git clone <repo> && cd custom-splitwise
cp .env.production .env && nano .env   # fill in all values
nano Caddyfile                          # replace your-domain.com
docker compose --env-file .env up -d --build

# Run migrations (from local machine via SSH tunnel or temporary port exposure):
DATABASE_URL="postgresql://splitwise:<pw>@<vps-ip>:5432/splitwise" pnpm exec prisma migrate deploy
```

Caddy auto-provisions TLS. Visit `https://your-domain.com`.

---

## Features

- Groups with shareable invite links
- Expenses: equal or exact-amount splits
- Per-group balances + greedy debt simplification
- Settle up (record payments)
- Activity feed (expenses + settlements)
- Categories + notes on expenses
- 1-on-1 friend expense tracking
- Mobile-responsive

---

## Original Next.js README

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
