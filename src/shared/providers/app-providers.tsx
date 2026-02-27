'use client';

import type { PropsWithChildren } from 'react';

import { QueryProvider } from '@/shared/providers/query-provider';

export const AppProviders = ({ children }: PropsWithChildren) => {
  return <QueryProvider>{children}</QueryProvider>;
};
