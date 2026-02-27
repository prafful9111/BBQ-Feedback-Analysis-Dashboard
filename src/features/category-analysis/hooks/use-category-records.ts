import { useQuery } from '@tanstack/react-query';

import { getCategoryRecords } from '@/features/category-analysis/services/category-analysis-client';
import type { CategoryPageFilterState } from '@/features/category-analysis/types';
import type { IssueCategory } from '@/shared/types/feedback';

export const useCategoryRecords = (category: IssueCategory, filters: CategoryPageFilterState) => {
  return useQuery({
    queryKey: ['category-records', category, filters],
    queryFn: () => getCategoryRecords(category, filters),
    placeholderData: (previousData) => previousData,
  });
};
