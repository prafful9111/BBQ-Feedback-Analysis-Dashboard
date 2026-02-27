import { AlertOctagon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface AlertsListProps {
  alerts: string[];
}

export const AlertsList = ({ alerts }: AlertsListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Latest Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {alerts.map((alert, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-foreground">
              <AlertOctagon className="mt-0.5 h-4 w-4 text-red-500" />
              <span>{alert}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
