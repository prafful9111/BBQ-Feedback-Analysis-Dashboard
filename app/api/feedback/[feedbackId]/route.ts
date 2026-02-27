import { NextResponse } from 'next/server';

import { feedbackService } from '@/server/services/feedback-service';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    feedbackId: string;
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const feedback = await feedbackService.getFeedbackById(context.params.feedbackId);

  if (!feedback) {
    return NextResponse.json({ error: 'Feedback record not found' }, { status: 404 });
  }

  return NextResponse.json(feedback);
}
