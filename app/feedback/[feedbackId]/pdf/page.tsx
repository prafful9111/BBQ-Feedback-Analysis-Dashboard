import { FeedbackPdfPage } from '@/features/feedback-management/components/feedback-pdf-page';

interface FeedbackPdfRoutePageProps {
  params: {
    feedbackId: string;
  };
}

export default function FeedbackPdfRoutePage({ params }: FeedbackPdfRoutePageProps) {
  return <FeedbackPdfPage feedbackId={params.feedbackId} />;
}
