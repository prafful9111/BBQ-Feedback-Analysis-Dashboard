'use client';

import { useState, type PropsWithChildren } from 'react';

import { AppSidebar } from '@/shared/components/layout/app-sidebar';
import { cn } from '@/shared/lib/cn';

export const AppShell = ({ children }: PropsWithChildren) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((previous) => !previous)}
      />

      <main
        className={cn(
          'min-h-screen px-4 pb-8 pt-6 transition-all duration-300 sm:px-8',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64',
        )}
      >
        {children}
      </main>
    </div>
  );
};
