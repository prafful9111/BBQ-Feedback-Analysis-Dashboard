# Supabase Integration Notes

This project is currently running on dummy repository data by default.

## Current Toggle
- Repository selector: `src/server/repositories/index.ts`
- Default mode: `DATA_SOURCE=dummy`
- Prisma mode: `DATA_SOURCE=prisma`

## Required Environment Variables
- `DATABASE_URL`: Supabase Postgres connection string (Prisma-compatible).

## Integration Order (Recommended)
1. Add Prisma models and relations for:
   - feedback records
   - issue tickets
   - CSAT scorecard fields
   - outlets / manager metadata
2. Run Prisma migrations against Supabase.
3. Implement `PrismaFeedbackRepository` methods:
   - `listFeedback`
   - `getFeedbackById`
   - `getDashboardOverview`
4. Validate parity with dummy output shape (`DashboardOverview`, `FeedbackListResponse`).
5. Set `DATA_SOURCE=prisma` in environment and run end-to-end verification.

## Data Contract Parity
- Keep response contracts stable:
  - `src/shared/types/feedback.ts`
- UI modules assume these exact shapes.

## Performance Guardrails
- Keep filtering/pagination on DB side.
- Add indexes for common filter keys:
  - `callDate`, `region`, `outletId`, `overallExperienceRating`, issue `category`, issue `severity`.
- For overview aggregations, prefer grouped SQL/Prisma aggregates over in-memory scans.

## Notes
- Date filters are normalized centrally through `src/shared/services/feedback-api-client.ts`.
- Dummy fallback is intentionally preserved for local development and resilience.
