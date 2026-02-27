import type { PropsWithChildren, ReactNode } from 'react';

import { AppShell } from '@/shared/components/layout/app-shell';

interface AdminLayoutProps extends PropsWithChildren {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
