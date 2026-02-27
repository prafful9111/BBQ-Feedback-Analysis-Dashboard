import { FeedbackDetailPage } from '@/features/feedback-management/components/feedback-detail-page';

interface FeedbackDetailRoutePageProps {
  params: {
    feedbackId: string;
  };
}

export default function FeedbackDetailRoutePage({ params }: FeedbackDetailRoutePageProps) {
  return <FeedbackDetailPage feedbackId={params.feedbackId} />;
}
