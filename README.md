# Closeout Dashboard

Closeout Dashboard is a field-friendly punch list tracker for construction closeout workflows.  
It helps teams manage projects, monitor completion progress, and track individual punch items by
status, priority, location, and assignee.

## What the Project Does

- Shows an overview of active projects with completion percentage and status counts.
- Provides a project detail view for filtering, searching, and grouping punch list items.
- Supports item-level workflows (open, in progress, pending, complete, reopened).
- Loads data from a PostgreSQL database through Prisma-backed Next.js API routes.
- Includes seeded demo data for quick local testing.

## Tech Stack

- `Next.js` (Pages Router) + `React` + `TypeScript`
- `Tailwind CSS` + `shadcn/ui` (Radix UI primitives)
- `Zustand` for client-side state management
- `Prisma` ORM
- `PostgreSQL` database (configured via `DATABASE_URL`)
- `ESLint` for linting

## Install and Run (Local)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"
```

### 3) Push Prisma schema to your database

```bash
npm run db:push
```

### 4) Seed demo data (optional, recommended)

```bash
npm run db:seed
```

### 5) Run the app

```bash
npm run dev
```

App runs at `http://localhost:8080`.

## Deploying to Vercel (with Database)

### 1) Add environment variable in Vercel

In your Vercel project, add:

- `DATABASE_URL` = your production Postgres connection string

Then redeploy the project so the API routes can connect to the database.

### 2) Apply Prisma schema changes safely (recommended)

For deployed environments, use Prisma migrations:

1. Generate a migration locally after schema changes:

```bash
npx prisma migrate dev --name your_change_name
```

2. Commit the generated migration files.
3. In production/CI, run:

```bash
npx prisma migrate deploy
```

This is safer than `db push` for production because changes are versioned and repeatable.

### 3) (Optional) Seed production/staging data

If you want initial sample data:

```bash
npm run db:seed
```

Only run seed in environments where demo data is appropriate.

## Updating Prisma Schema

When you change Prisma models:

1. Edit `prisma/schema.prisma`
2. For local iteration, apply the changes quickly:

```bash
npm run db:push
```

3. For production-safe workflow, create and commit a migration:

```bash
npx prisma migrate dev --name your_change_name
```

4. If needed, re-seed local data:

```bash
npm run db:seed
```

5. In production/CI, apply committed migrations:

```bash
npx prisma migrate deploy
```

## Available Scripts

- `npm run dev` - Start local development server on port `8080`
- `npm run build` - Build production bundle
- `npm run start` - Run production server on port `8080`
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema to database
- `npm run db:seed` - Seed sample projects and punch items

## Project Notes

- The repository has been migrated to Next.js; Vite/Vitest tooling has been removed.
- API endpoints live under `src/pages/api`.
- Main UI views are in `src/views`, composed through pages in `src/pages`.
