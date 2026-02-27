import { Badge } from '@/shared/components/ui/badge';
import type { Rating } from '@/shared/types/feedback';

interface RatingBadgeProps {
  rating: Rating;
}

export const RatingBadge = ({ rating }: RatingBadgeProps) => {
  if (rating === 'Excellent') {
    return <Badge variant="success">Excellent</Badge>;
  }

  if (rating === 'Good') {
    return <Badge variant="secondary">Good</Badge>;
  }

  if (rating === 'Average') {
    return <Badge variant="warning">Average</Badge>;
  }

  if (rating === 'Poor') {
    return <Badge variant="danger">Poor</Badge>;
  }

  return <Badge variant="muted">N/A</Badge>;
};
