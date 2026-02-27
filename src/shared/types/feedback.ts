import { z } from 'zod';

export const ratingSchema = z.enum(['Excellent', 'Good', 'Average', 'Poor', 'N/A']);
export type Rating = z.infer<typeof ratingSchema>;

export const issueTicketTypeSchema = z.enum(['Complaint', 'Suggestion']);
export type IssueTicketType = z.infer<typeof issueTicketTypeSchema>;

export const issueCategorySchema = z.enum([
  'Food & Beverage',
  'Ambience & Hygiene',
  'Booking & Billing',
  'Staff & Service',
]);
export type IssueCategory = z.infer<typeof issueCategorySchema>;

export const issueSeveritySchema = z.enum(['High', 'Medium', 'Low']);
export type IssueSeverity = z.infer<typeof issueSeveritySchema>;

export const issueSubcategorySchema = z.enum([
  'Beverages',
  'Buffet/Main Course',
  'Kulfi',
  'Dessert',
  'Starters & Grills',
  'Overall',
  'Washroom',
  'Inside Restaurant',
  'Outside Restaurant / External Premises',
  'Booking',
  'Billing & Pricing',
  'Staff',
  'Service',
]);
export type IssueSubcategory = z.infer<typeof issueSubcategorySchema>;

export const csatScorecardSchema = z.object({
  ambience_hygiene_overall: ratingSchema,
  ambience: ratingSchema,
  hygiene: ratingSchema,
  booking_and_billing: ratingSchema,
  food_and_beverages_overall: ratingSchema,
  beverages: ratingSchema,
  buffet_main_course: ratingSchema,
  starters_and_grills: ratingSchema,
  kulfi: ratingSchema,
  staff_and_service: ratingSchema,
});
export type CsatScorecard = z.infer<typeof csatScorecardSchema>;
export type CsatField = keyof CsatScorecard;

export const csatMetricSchema = z.object({
  rating: z.number().nonnegative(),
  callCount: z.number().int().nonnegative(),
});
export type CsatMetric = z.infer<typeof csatMetricSchema>;

export const issueTicketSchema = z
  .object({
    id: z.string().min(1),
    ticketType: issueTicketTypeSchema,
    category: issueCategorySchema,
    subcategory: issueSubcategorySchema,
    severity: issueSeveritySchema,
    description: z.string().min(1),
  })
  .refine(
    (ticket) => !(ticket.ticketType === 'Complaint' && ticket.severity === 'Low'),
    'Complaint severity cannot be Low',
  );
export type IssueTicket = z.infer<typeof issueTicketSchema>;

export const outletSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  region: z.string().min(1),
});
export type Outlet = z.infer<typeof outletSchema>;

export const feedbackRecordSchema = z.object({
  id: z.string().min(1),
  bookingId: z.string().min(1),
  outletId: z.string().min(1),
  outletName: z.string().min(1),
  city: z.string().min(1),
  region: z.string().min(1),
  callDate: z.string().datetime(),
  overallExperienceRating: ratingSchema,
  csatScorecard: csatScorecardSchema,
  summary: z.string().nullable(),
  translatedTranscript: z.string().nullable(),
  specialMentions: z.array(z.string()).nullable(),
  issueTickets: z.array(issueTicketSchema),
});
export type FeedbackRecord = z.infer<typeof feedbackRecordSchema>;

export const feedbackListItemSchema = feedbackRecordSchema.extend({
  issueCount: z.number().int().nonnegative(),
  highSeverityCount: z.number().int().nonnegative(),
});
export type FeedbackListItem = z.infer<typeof feedbackListItemSchema>;

export const feedbackListResponseSchema = z.object({
  items: z.array(feedbackListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export type FeedbackListResponse = z.infer<typeof feedbackListResponseSchema>;

export const dashboardKpiSchema = z.object({
  totalCalls: z.number().int().nonnegative(),
  avgRatingScore: z.number().nonnegative(),
  highSeverityIssues: z.number().int().nonnegative(),
  mediumSeverityIssues: z.number().int().nonnegative(),
  specialMentions: z.number().int().nonnegative(),
});
export type DashboardKpi = z.infer<typeof dashboardKpiSchema>;

export const distributionPointSchema = z.object({
  label: z.string().min(1),
  value: z.number().int().nonnegative(),
});
export type DistributionPoint = z.infer<typeof distributionPointSchema>;

export const dashboardAlertLevelSchema = z.enum(['Critical', 'Warning', 'Alert', 'Info']);
export type DashboardAlertLevel = z.infer<typeof dashboardAlertLevelSchema>;

export const dashboardAlertSchema = z.object({
  level: dashboardAlertLevelSchema,
  message: z.string().min(1),
  timestamp: z.string().datetime(),
});
export type DashboardAlert = z.infer<typeof dashboardAlertSchema>;

export const topOutletSchema = z.object({
  outletId: z.string().min(1),
  outletName: z.string().min(1),
  city: z.string().min(1),
  region: z.string().min(1),
  totalCalls: z.number().int().nonnegative(),
  poorCount: z.number().int().nonnegative(),
  highSeverityIssues: z.number().int().nonnegative(),
  avgRatingScore: z.number().nonnegative(),
});
export type TopOutlet = z.infer<typeof topOutletSchema>;

export const performanceMatrixRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  region: z.string().min(1),
  manager: z.string().min(1),
  totalCalls: z.number().int().nonnegative(),
  avgRatingScore: z.number().nonnegative(),
  excellentCount: z.number().int().nonnegative(),
  goodCount: z.number().int().nonnegative(),
  averageCount: z.number().int().nonnegative(),
  poorCount: z.number().int().nonnegative(),
  naCount: z.number().int().nonnegative(),
  specialMentionsCount: z.number().int().nonnegative(),
  highSeverityIssues: z.number().int().nonnegative(),
  mediumSeverityIssues: z.number().int().nonnegative(),
  lowSeverityIssues: z.number().int().nonnegative(),
  categoryIssues: z.object({
    'Food & Beverage': z.number().int().nonnegative(),
    'Ambience & Hygiene': z.number().int().nonnegative(),
    'Booking & Billing': z.number().int().nonnegative(),
    'Staff & Service': z.number().int().nonnegative(),
  }),
  csatDetails: z.object({
    ambience_hygiene_overall: csatMetricSchema,
    ambience: csatMetricSchema,
    hygiene: csatMetricSchema,
    booking_and_billing: csatMetricSchema,
    food_and_beverages_overall: csatMetricSchema,
    beverages: csatMetricSchema,
    buffet_main_course: csatMetricSchema,
    starters_and_grills: csatMetricSchema,
    kulfi: csatMetricSchema,
    staff_and_service: csatMetricSchema,
  }),
});
export type PerformanceMatrixRow = z.infer<typeof performanceMatrixRowSchema>;

export const subcategoryDistributionSchema = z.object({
  'Food & Beverage': z.array(distributionPointSchema),
  'Ambience & Hygiene': z.array(distributionPointSchema),
  'Booking & Billing': z.array(distributionPointSchema),
  'Staff & Service': z.array(distributionPointSchema),
});
export type SubcategoryDistribution = z.infer<typeof subcategoryDistributionSchema>;

export const issueTicketSeverityCountsSchema = z.object({
  all: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
});
export type IssueTicketSeverityCounts = z.infer<typeof issueTicketSeverityCountsSchema>;

export const issueTicketDistributionPointSchema = z.object({
  label: z.string().min(1),
  counts: issueTicketSeverityCountsSchema,
});
export type IssueTicketDistributionPoint = z.infer<typeof issueTicketDistributionPointSchema>;

export const issueTicketDistributionSchema = z.object({
  category: z.array(issueTicketDistributionPointSchema),
  subcategory: z.object({
    'Food & Beverage': z.array(issueTicketDistributionPointSchema),
    'Ambience & Hygiene': z.array(issueTicketDistributionPointSchema),
    'Booking & Billing': z.array(issueTicketDistributionPointSchema),
    'Staff & Service': z.array(issueTicketDistributionPointSchema),
  }),
});
export type IssueTicketDistribution = z.infer<typeof issueTicketDistributionSchema>;

export const dashboardFilterOptionsSchema = z.object({
  regions: z.array(z.string().min(1)),
  managers: z.array(z.string().min(1)),
  outlets: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      region: z.string().min(1),
      manager: z.string().min(1),
    }),
  ),
});
export type DashboardFilterOptions = z.infer<typeof dashboardFilterOptionsSchema>;

export const dashboardOverviewSchema = z.object({
  kpis: dashboardKpiSchema,
  ratingDistribution: z.array(distributionPointSchema),
  issueCategoryDistribution: z.array(distributionPointSchema),
  subcategoryDistribution: subcategoryDistributionSchema,
  issueTicketDistribution: issueTicketDistributionSchema,
  performanceMatrix: z.array(performanceMatrixRowSchema),
  topOutlets: z.array(topOutletSchema),
  latestAlerts: z.array(dashboardAlertSchema),
  filterOptions: dashboardFilterOptionsSchema,
});
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
