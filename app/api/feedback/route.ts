import { NextResponse } from 'next/server';

import { feedbackService } from '@/server/services/feedback-service';
import { parseFeedbackListQuery } from '@/server/validation/parse-search-params';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = parseFeedbackListQuery(url.searchParams);
    const payload = await feedbackService.listFeedback(query);

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error while loading feedback list';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
