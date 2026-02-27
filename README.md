# Barbeque Nation Feedback Dashboard

Production-grade Admin Dashboard scaffold built with **Next.js 14 (App Router)**, **TypeScript strict mode**, **Prisma**, **React Query**, **Zod**, and **TailwindCSS**.

The project is intentionally structured for scale and maintainability:
- Feature-first modules
- Strict separation of UI, services, and data access
- Repository/service abstraction for easy migration from dummy data to Supabase-backed Prisma
- Typed API boundaries with Zod validation

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict)
- Prisma ORM
- Supabase Postgres (integration placeholder included)
- TailwindCSS + Shadcn-style reusable UI primitives
- React Query
- Zod
- ESLint + Prettier

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

`.env.example` includes a placeholder `DATABASE_URL` for Supabase Postgres.

Use data source mode:
- `DATA_SOURCE=dummy` (default): generated + CSV-seeded development data
- `DATA_SOURCE=prisma`: Prisma repository path (currently fallback-enabled placeholder)

## Folder Structure

```text
app/
  (admin)/
    dashboard/page.tsx
    feedback/page.tsx
  api/
    dashboard/route.ts
    feedback/route.ts
    feedback/[feedbackId]/route.ts

src/
  features/
    dashboard-overview/
      components/
      hooks/
      services/
    feedback-management/
      components/
      hooks/
      services/

  server/
    db/
      prisma-client.ts
    dummy-data/
      sample-feedback.json
      generator.ts
    repositories/
      feedback-repository.ts
      dummy-feedback-repository.ts
      prisma-feedback-repository.ts
      index.ts
    services/
      dashboard-service.ts
      feedback-service.ts
    validation/
      feedback-query.ts
      parse-search-params.ts

  shared/
    components/
      charts/
      data-display/
      feedback/
      layout/
      ui/
    constants/
    lib/
    providers/
    types/

prisma/
  schema.prisma
```

## Dummy Data Strategy

- Includes transformed seed records from the provided CSV (`sample-feedback.json`)
- Scales to 120k synthetic records with deterministic generation
- Supports pagination, filtering, issue category/severity search, and dashboard aggregation

When Supabase is connected, switch repository implementation from dummy to Prisma.

## Supabase Integration Notes

1. Add actual Supabase Postgres URL in `DATABASE_URL`.
2. Set `DATA_SOURCE=prisma`.
3. Replace fallback logic in `src/server/repositories/prisma-feedback-repository.ts` with Prisma queries.
4. Run Prisma migration/generate commands.

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run build
```
