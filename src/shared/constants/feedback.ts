import type {
  IssueCategory,
  IssueSeverity,
  IssueSubcategory,
  Rating,
} from '@/shared/types/feedback';

export const RATINGS: readonly Rating[] = ['Excellent', 'Good', 'Average', 'Poor', 'N/A'];

export const ISSUE_SEVERITIES: readonly IssueSeverity[] = ['High', 'Medium', 'Low'];

export const ISSUE_CATEGORIES: readonly IssueCategory[] = [
  'Food & Beverage',
  'Ambience & Hygiene',
  'Booking & Billing',
  'Staff & Service',
];

export const CATEGORY_SUBCATEGORY_MAP: Record<IssueCategory, IssueSubcategory[]> = {
  'Food & Beverage': [
    'Beverages',
    'Buffet/Main Course',
    'Kulfi',
    'Dessert',
    'Starters & Grills',
    'Overall',
  ],
  'Ambience & Hygiene': [
    'Washroom',
    'Inside Restaurant',
    'Outside Restaurant / External Premises',
    'Overall',
  ],
  'Booking & Billing': ['Booking', 'Billing & Pricing', 'Overall'],
  'Staff & Service': ['Staff', 'Service', 'Overall'],
};

export const CSAT_FIELDS = [
  'ambience_hygiene_overall',
  'ambience',
  'hygiene',
  'booking_and_billing',
  'food_and_beverages_overall',
  'beverages',
  'buffet_main_course',
  'starters_and_grills',
  'kulfi',
  'staff_and_service',
] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DUMMY_TOTAL_RECORDS = 120_000;
