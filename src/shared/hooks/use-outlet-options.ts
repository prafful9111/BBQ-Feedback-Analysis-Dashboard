import { useQuery } from '@tanstack/react-query';

import type { DashboardFilterOptions } from '@/shared/types/feedback';

/**
 * Fetches the outlet options from the dashboard API and caches them.
 * This avoids fetching the full dashboard data — we only need filterOptions.
 */
export const useOutletOptions = () => {
    return useQuery({
        queryKey: ['outlet-options'],
        queryFn: async (): Promise<DashboardFilterOptions> => {
            const response = await fetch('/api/dashboard');
            if (!response.ok) throw new Error('Failed to fetch outlet options');
            const data = await response.json();
            return data.filterOptions;
        },
        staleTime: 5 * 60 * 1000, // cache for 5 minutes
    });
};
