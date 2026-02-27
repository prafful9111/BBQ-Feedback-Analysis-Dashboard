import { Badge } from '@/shared/components/ui/badge';
import type { IssueSeverity } from '@/shared/types/feedback';

interface SeverityBadgeProps {
  severity: IssueSeverity;
}

export const SeverityBadge = ({ severity }: SeverityBadgeProps) => {
  if (severity === 'High') {
    return <Badge variant="danger">High</Badge>;
  }

  if (severity === 'Medium') {
    return <Badge variant="warning">Medium</Badge>;
  }

  return <Badge variant="muted">Low</Badge>;
};
