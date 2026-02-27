import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { TopOutlet } from '@/shared/types/feedback';

interface TopOutletsTableProps {
  outlets: TopOutlet[];
}

export const TopOutletsTable = ({ outlets }: TopOutletsTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Risk Outlets</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Outlet</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Total Calls</TableHead>
              <TableHead className="text-right">Poor Ratings</TableHead>
              <TableHead className="text-right">High Severity</TableHead>
              <TableHead className="text-right">Avg Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outlets.map((outlet) => (
              <TableRow key={outlet.outletId}>
                <TableCell>
                  <p className="font-medium text-foreground">{outlet.outletName}</p>
                  <p className="text-xs text-muted-foreground">{outlet.city}</p>
                </TableCell>
                <TableCell>{outlet.region}</TableCell>
                <TableCell className="text-right">{outlet.totalCalls}</TableCell>
                <TableCell className="text-right">{outlet.poorCount}</TableCell>
                <TableCell className="text-right">{outlet.highSeverityIssues}</TableCell>
                <TableCell className="text-right">{outlet.avgRatingScore.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
