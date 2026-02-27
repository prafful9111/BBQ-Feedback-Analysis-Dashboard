import { NextResponse } from 'next/server';

import { dashboardService } from '@/server/services/dashboard-service';
import { parseDashboardQuery } from '@/server/validation/parse-search-params';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = parseDashboardQuery(url.searchParams);
    const payload = await dashboardService.getOverview(query);

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while loading dashboard';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
