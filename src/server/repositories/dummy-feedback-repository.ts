import { CSAT_FIELDS, DUMMY_TOTAL_RECORDS, ISSUE_CATEGORIES, RATINGS } from '@/shared/constants/feedback';
import type {
  CsatField,
  DashboardAlert,
  DashboardFilterOptions,
  DashboardOverview,
  FeedbackListItem,
  FeedbackListResponse,
  FeedbackRecord,
  IssueCategory,
  IssueTicketSeverityCounts,
  PerformanceMatrixRow,
  TopOutlet,
} from '@/shared/types/feedback';

import { OUTLETS, generateFeedbackById, generateFeedbackRecord } from '@/server/dummy-data/generator';
import type { FeedbackRepository } from '@/server/repositories/feedback-repository';
import type { DashboardQuery, FeedbackListQuery } from '@/server/validation/feedback-query';

const ratingScoreMap: Record<string, number> = {
  Excellent: 4,
  Good: 3,
  Average: 2,
  Poor: 1,
  'N/A': 0,
};

const issueCategoryOrder: IssueCategory[] = [
  'Food & Beverage',
  'Ambience & Hygiene',
  'Booking & Billing',
  'Staff & Service',
];

interface OutletAccumulator extends Omit<PerformanceMatrixRow, 'avgRatingScore' | 'csatDetails'> {
  totalScore: number;
  csatDetails: Record<CsatField, { totalScore: number; callCount: number }>;
}

const createSeverityAccumulator = (): IssueTicketSeverityCounts => ({
  all: 0,
  high: 0,
  medium: 0,
  low: 0,
});

const bumpSeverity = (accumulator: IssueTicketSeverityCounts, severity: 'High' | 'Medium' | 'Low') => {
  accumulator.all += 1;

  if (severity === 'High') {
    accumulator.high += 1;
    return;
  }

  if (severity === 'Medium') {
    accumulator.medium += 1;
    return;
  }

  accumulator.low += 1;
};

const createCsatAccumulator = (): Record<CsatField, { totalScore: number; callCount: number }> => {
  const accumulator = {} as Record<CsatField, { totalScore: number; callCount: number }>;

  for (const field of CSAT_FIELDS) {
    accumulator[field] = {
      totalScore: 0,
      callCount: 0,
    };
  }

  return accumulator;
};

export class DummyFeedbackRepository implements FeedbackRepository {
  private readonly totalRecords = DUMMY_TOTAL_RECORDS;
  private readonly outletManagerMap = new Map(OUTLETS.map((outlet) => [outlet.id, outlet.manager]));

  async listFeedback(query: FeedbackListQuery): Promise<FeedbackListResponse> {
    const hasFilters =
      Boolean(query.search) ||
      Boolean(query.outletId) ||
      query.ratings.length > 0 ||
      Boolean(query.category) ||
      Boolean(query.severity) ||
      Boolean(query.dateFrom) ||
      Boolean(query.dateTo);

    const pageStartOffset = (query.page - 1) * query.pageSize;

    if (!hasFilters) {
      const startIndex = pageStartOffset;
      const endIndex = Math.min(startIndex + query.pageSize, this.totalRecords);
      const items = this.generatePageItems(startIndex, endIndex);

      return {
        items,
        total: this.totalRecords,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(this.totalRecords / query.pageSize),
      };
    }

    const filteredItems: FeedbackListItem[] = [];
    let matched = 0;

    for (let index = 0; index < this.totalRecords; index += 1) {
      const record = generateFeedbackRecord(index);

      if (!this.matchesFeedbackQuery(record, query)) {
        continue;
      }

      matched += 1;

      if (matched <= pageStartOffset) {
        continue;
      }

      if (filteredItems.length < query.pageSize) {
        filteredItems.push(this.mapToListItem(record));
      }
    }

    return {
      items: filteredItems,
      total: matched,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(matched / query.pageSize),
    };
  }

  async getFeedbackById(feedbackId: string): Promise<FeedbackRecord | null> {
    return generateFeedbackById(feedbackId);
  }

  async getDashboardOverview(query: DashboardQuery): Promise<DashboardOverview> {
    let totalCalls = 0;
    let totalScore = 0;
    let highSeverityIssues = 0;
    let mediumSeverityIssues = 0;
    let specialMentions = 0;

    const ratingDistributionMap = new Map<string, number>(RATINGS.map((rating) => [rating, 0]));
    const issueCategoryMap = new Map<string, number>(ISSUE_CATEGORIES.map((category) => [category, 0]));

    const categorySeverityMap: Record<IssueCategory, IssueTicketSeverityCounts> = {
      'Food & Beverage': createSeverityAccumulator(),
      'Ambience & Hygiene': createSeverityAccumulator(),
      'Booking & Billing': createSeverityAccumulator(),
      'Staff & Service': createSeverityAccumulator(),
    };
    const subcategorySeverityMap: Record<IssueCategory, Map<string, IssueTicketSeverityCounts>> = {
      'Food & Beverage': new Map<string, IssueTicketSeverityCounts>(),
      'Ambience & Hygiene': new Map<string, IssueTicketSeverityCounts>(),
      'Booking & Billing': new Map<string, IssueTicketSeverityCounts>(),
      'Staff & Service': new Map<string, IssueTicketSeverityCounts>(),
    };

    const outletAccumulator = new Map<string, OutletAccumulator>();
    const regionIssues = new Map<string, number>();
    const regionCalls = new Map<string, number>();

    for (let index = 0; index < this.totalRecords; index += 1) {
      const record = generateFeedbackRecord(index);

      if (!this.matchesDashboardQuery(record, query)) {
        continue;
      }

      totalCalls += 1;
      totalScore += ratingScoreMap[record.overallExperienceRating] ?? 0;
      specialMentions += record.specialMentions?.length ?? 0;

      ratingDistributionMap.set(
        record.overallExperienceRating,
        (ratingDistributionMap.get(record.overallExperienceRating) ?? 0) + 1,
      );

      regionCalls.set(record.region, (regionCalls.get(record.region) ?? 0) + 1);

      const manager = this.getManagerForOutlet(record.outletId);
      const existingOutlet = outletAccumulator.get(record.outletId);

      if (!existingOutlet) {
        outletAccumulator.set(record.outletId, {
          id: record.outletId,
          name: record.outletName,
          city: record.city,
          region: record.region,
          manager,
          totalCalls: 1,
          totalScore: ratingScoreMap[record.overallExperienceRating] ?? 0,
          excellentCount: record.overallExperienceRating === 'Excellent' ? 1 : 0,
          goodCount: record.overallExperienceRating === 'Good' ? 1 : 0,
          averageCount: record.overallExperienceRating === 'Average' ? 1 : 0,
          poorCount: record.overallExperienceRating === 'Poor' ? 1 : 0,
          naCount: record.overallExperienceRating === 'N/A' ? 1 : 0,
          specialMentionsCount: record.specialMentions?.length ?? 0,
          highSeverityIssues: 0,
          mediumSeverityIssues: 0,
          lowSeverityIssues: 0,
          categoryIssues: {
            'Food & Beverage': 0,
            'Ambience & Hygiene': 0,
            'Booking & Billing': 0,
            'Staff & Service': 0,
          },
          csatDetails: createCsatAccumulator(),
        });
      } else {
        existingOutlet.totalCalls += 1;
        existingOutlet.totalScore += ratingScoreMap[record.overallExperienceRating] ?? 0;
        existingOutlet.specialMentionsCount += record.specialMentions?.length ?? 0;

        if (record.overallExperienceRating === 'Excellent') {
          existingOutlet.excellentCount += 1;
        } else if (record.overallExperienceRating === 'Good') {
          existingOutlet.goodCount += 1;
        } else if (record.overallExperienceRating === 'Average') {
          existingOutlet.averageCount += 1;
        } else if (record.overallExperienceRating === 'Poor') {
          existingOutlet.poorCount += 1;
        } else {
          existingOutlet.naCount += 1;
        }
      }

      const outletRow = outletAccumulator.get(record.outletId);
      if (!outletRow) {
        continue;
      }

      for (const field of CSAT_FIELDS) {
        const csatRating = record.csatScorecard[field];
        if (csatRating === 'N/A') {
          continue;
        }

        outletRow.csatDetails[field].totalScore += ratingScoreMap[csatRating] ?? 0;
        outletRow.csatDetails[field].callCount += 1;
      }

      for (const issue of record.issueTickets) {
        issueCategoryMap.set(issue.category, (issueCategoryMap.get(issue.category) ?? 0) + 1);
        bumpSeverity(categorySeverityMap[issue.category], issue.severity);

        const severityBySubcategory = subcategorySeverityMap[issue.category];
        const existingSubcategoryAccumulator = severityBySubcategory.get(issue.subcategory);
        if (existingSubcategoryAccumulator) {
          bumpSeverity(existingSubcategoryAccumulator, issue.severity);
        } else {
          const initialAccumulator = createSeverityAccumulator();
          bumpSeverity(initialAccumulator, issue.severity);
          severityBySubcategory.set(issue.subcategory, initialAccumulator);
        }

        if (issue.severity === 'High') {
          highSeverityIssues += 1;
          outletRow.highSeverityIssues += 1;
        } else if (issue.severity === 'Medium') {
          mediumSeverityIssues += 1;
          outletRow.mediumSeverityIssues += 1;
        } else {
          outletRow.lowSeverityIssues += 1;
        }

        outletRow.categoryIssues[issue.category] += 1;
      }

      const totalIssuesForCall = record.issueTickets.length;
      regionIssues.set(record.region, (regionIssues.get(record.region) ?? 0) + totalIssuesForCall);
    }

    const performanceMatrix: PerformanceMatrixRow[] = Array.from(outletAccumulator.values())
      .map((row) => ({
        ...row,
        avgRatingScore: row.totalCalls > 0 ? row.totalScore / row.totalCalls : 0,
        csatDetails: Object.fromEntries(
          CSAT_FIELDS.map((field) => {
            const metric = row.csatDetails[field];
            return [
              field,
              {
                rating: metric.callCount > 0 ? metric.totalScore / metric.callCount : 0,
                callCount: metric.callCount,
              },
            ];
          }),
        ) as PerformanceMatrixRow['csatDetails'],
      }))
      .sort((left, right) => right.avgRatingScore - left.avgRatingScore);

    const topOutlets: TopOutlet[] = performanceMatrix
      .map((row) => ({
        outletId: row.id,
        outletName: row.name,
        city: row.city,
        region: row.region,
        totalCalls: row.totalCalls,
        poorCount: row.poorCount,
        highSeverityIssues: row.highSeverityIssues,
        avgRatingScore: row.avgRatingScore,
      }))
      .sort((left, right) => {
        if (right.highSeverityIssues !== left.highSeverityIssues) {
          return right.highSeverityIssues - left.highSeverityIssues;
        }

        return left.avgRatingScore - right.avgRatingScore;
      })
      .slice(0, 12);

    const subcategoryDistribution = {
      'Food & Beverage': this.mapSeverityDistributionToTotals(subcategorySeverityMap['Food & Beverage']),
      'Ambience & Hygiene': this.mapSeverityDistributionToTotals(
        subcategorySeverityMap['Ambience & Hygiene'],
      ),
      'Booking & Billing': this.mapSeverityDistributionToTotals(subcategorySeverityMap['Booking & Billing']),
      'Staff & Service': this.mapSeverityDistributionToTotals(subcategorySeverityMap['Staff & Service']),
    };

    const issueTicketDistribution = {
      category: issueCategoryOrder.map((category) => ({
        label: category,
        counts: categorySeverityMap[category],
      })),
      subcategory: {
        'Food & Beverage': this.mapToSeverityDistribution(
          subcategorySeverityMap['Food & Beverage'],
        ),
        'Ambience & Hygiene': this.mapToSeverityDistribution(
          subcategorySeverityMap['Ambience & Hygiene'],
        ),
        'Booking & Billing': this.mapToSeverityDistribution(subcategorySeverityMap['Booking & Billing']),
        'Staff & Service': this.mapToSeverityDistribution(subcategorySeverityMap['Staff & Service']),
      },
    };

    const alerts = this.buildAlerts(performanceMatrix, regionIssues, regionCalls, totalCalls);

    return {
      kpis: {
        totalCalls,
        avgRatingScore: totalCalls > 0 ? Number((totalScore / totalCalls).toFixed(2)) : 0,
        highSeverityIssues,
        mediumSeverityIssues,
        specialMentions,
      },
      ratingDistribution: Array.from(ratingDistributionMap.entries()).map(([label, value]) => ({
        label,
        value,
      })),
      issueCategoryDistribution: Array.from(issueCategoryMap.entries())
        .map(([label, value]) => ({
          label,
          value,
        }))
        .sort((left, right) => right.value - left.value),
      subcategoryDistribution,
      issueTicketDistribution,
      performanceMatrix,
      topOutlets,
      latestAlerts: alerts,
      filterOptions: this.getDashboardFilterOptions(),
    };
  }

  private generatePageItems(startIndex: number, endIndex: number): FeedbackListItem[] {
    const items: FeedbackListItem[] = [];

    for (let index = startIndex; index < endIndex; index += 1) {
      items.push(this.mapToListItem(generateFeedbackRecord(index)));
    }

    return items;
  }

  private mapToListItem(record: FeedbackRecord): FeedbackListItem {
    return {
      ...record,
      issueCount: record.issueTickets.length,
      highSeverityCount: record.issueTickets.filter((ticket) => ticket.severity === 'High').length,
    };
  }

  private matchesDashboardQuery(record: FeedbackRecord, query: DashboardQuery): boolean {
    if (query.region && record.region !== query.region) {
      return false;
    }

    if (query.manager && this.getManagerForOutlet(record.outletId) !== query.manager) {
      return false;
    }

    if (query.outletId && record.outletId !== query.outletId) {
      return false;
    }

    if (query.ratings.length > 0 && !query.ratings.includes(record.overallExperienceRating)) {
      return false;
    }

    return this.matchesDateRange(record, query.dateFrom, query.dateTo);
  }

  private matchesFeedbackQuery(record: FeedbackRecord, query: FeedbackListQuery): boolean {
    if (query.region && record.region !== query.region) {
      return false;
    }

    if (query.manager && this.getManagerForOutlet(record.outletId) !== query.manager) {
      return false;
    }

    if (!this.matchesDashboardQuery(record, query)) {
      return false;
    }

    if (query.search) {
      const searchNeedle = query.search.toLowerCase();
      const searchFields = [
        record.bookingId,
        record.outletName,
        record.city,
        record.region,
        record.summary ?? '',
      ];

      if (!searchFields.some((field) => field.toLowerCase().includes(searchNeedle))) {
        return false;
      }
    }

    if (query.category && !record.issueTickets.some((ticket) => ticket.category === query.category)) {
      return false;
    }

    if (query.severity && !record.issueTickets.some((ticket) => ticket.severity === query.severity)) {
      return false;
    }

    return true;
  }

  private matchesDateRange(record: FeedbackRecord, dateFrom?: string, dateTo?: string): boolean {
    if (!dateFrom && !dateTo) {
      return true;
    }

    const callTime = new Date(record.callDate).getTime();

    if (dateFrom && callTime < new Date(dateFrom).getTime()) {
      return false;
    }

    if (dateTo && callTime > new Date(dateTo).getTime()) {
      return false;
    }

    return true;
  }

  private buildAlerts(
    rows: PerformanceMatrixRow[],
    regionIssues: Map<string, number>,
    regionCalls: Map<string, number>,
    totalCalls: number,
  ): DashboardAlert[] {
    if (totalCalls === 0) {
      return [
        {
          level: 'Info',
          message: 'No calls matched the selected filters.',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const alerts: DashboardAlert[] = [];
    const totalIssues = rows.reduce(
      (accumulator, row) =>
        accumulator + row.highSeverityIssues + row.mediumSeverityIssues + row.lowSeverityIssues,
      0,
    );

    const avgIssuesPerOutlet = rows.length > 0 ? totalIssues / rows.length : 0;
    let offsetMinutes = 0;

    for (const row of rows) {
      const totalIssuesForOutlet = row.highSeverityIssues + row.mediumSeverityIssues + row.lowSeverityIssues;

      if (totalIssuesForOutlet > avgIssuesPerOutlet * 1.8) {
        alerts.push({
          level: 'Critical',
          message: `${row.name} is reporting ${totalIssuesForOutlet} issues, which is 80% above the network average.`,
          timestamp: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
        });
        offsetMinutes += 9;
      }

      if (row.poorCount > row.totalCalls * 0.25) {
        alerts.push({
          level: 'Warning',
          message: `${row.name} has a Poor rating frequency of ${((row.poorCount / row.totalCalls) * 100).toFixed(0)}%, exceeding the 15% threshold.`,
          timestamp: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
        });
        offsetMinutes += 9;
      }

      if (row.categoryIssues['Food & Beverage'] > row.totalCalls * 0.2) {
        alerts.push({
          level: 'Alert',
          message: `Food & Beverage complaints in ${row.name} are spiking (20%+ of calls).`,
          timestamp: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
        });
        offsetMinutes += 9;
      }

      if (alerts.length >= 5) {
        break;
      }
    }

    if (alerts.length < 5) {
      for (const [region, issueCount] of regionIssues.entries()) {
        const calls = regionCalls.get(region) ?? 0;
        if (calls === 0) {
          continue;
        }

        const density = issueCount / calls;
        if (density > 0.8) {
          alerts.push({
            level: 'Alert',
            message: `${region} Region is experiencing a high issue density (${density.toFixed(1)} issues/call).`,
            timestamp: new Date(Date.now() - offsetMinutes * 60_000).toISOString(),
          });
          offsetMinutes += 9;
        }

        if (alerts.length >= 5) {
          break;
        }
      }
    }

    if (alerts.length === 0) {
      return [
        {
          level: 'Info',
          message: 'No critical anomalies detected in the selected period.',
          timestamp: new Date().toISOString(),
        },
      ];
    }

    return alerts.slice(0, 5);
  }

  private getManagerForOutlet(outletId: string): string {
    return this.outletManagerMap.get(outletId) ?? 'Unassigned';
  }

  private mapSeverityDistributionToTotals(map: Map<string, IssueTicketSeverityCounts>) {
    return Array.from(map.entries())
      .map(([label, counts]) => ({ label, value: counts.all }))
      .sort((left, right) => right.value - left.value);
  }

  private mapToSeverityDistribution(map: Map<string, IssueTicketSeverityCounts>) {
    return Array.from(map.entries())
      .map(([label, counts]) => ({ label, counts }))
      .sort((left, right) => right.counts.all - left.counts.all);
  }

  private getDashboardFilterOptions(): DashboardFilterOptions {
    return {
      regions: Array.from(new Set(OUTLETS.map((outlet) => outlet.region))).sort(),
      managers: Array.from(new Set(OUTLETS.map((outlet) => outlet.manager))).sort(),
      outlets: OUTLETS.map((outlet) => ({
        id: outlet.id,
        name: outlet.name,
        region: outlet.region,
        manager: outlet.manager,
      })),
    };
  }
}

// This list can be used by future filter APIs.
export const AVAILABLE_OUTLETS = OUTLETS.map(({ id, name, city, region, manager }) => ({
  id,
  name,
  city,
  region,
  manager,
}));
