'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import type { ComponentType } from 'react';
import {
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Users2,
  UtensilsCrossed,
} from 'lucide-react';

import { cn } from '@/shared/lib/cn';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavigationItem {
  label: string;
  href: Route;
  icon: ComponentType<{ className?: string }>;
}

const primaryNavigationItems: NavigationItem[] = [
  { label: 'Overview', href: '/dashboard' as Route, icon: LayoutDashboard },
  { label: 'Feedback Calls', href: '/calls' as Route, icon: MessageSquare },
];

const categoryNavigationItems: NavigationItem[] = [
  { label: 'Food & Beverage', href: '/categories/food-beverage' as Route, icon: UtensilsCrossed },
  { label: 'Ambience & Hygiene', href: '/categories/ambience-hygiene' as Route, icon: Sparkles },
  { label: 'Booking & Billing', href: '/categories/booking-billing' as Route, icon: CreditCard },
  { label: 'Staff & Service', href: '/categories/staff-service' as Route, icon: Users2 },
];

const isActivePath = (pathname: string, href: Route) => pathname === href;

export const AppSidebar = ({ collapsed, onToggleCollapse }: AppSidebarProps) => {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 hidden h-screen border-r border-slate-200 bg-white transition-all duration-300 lg:flex lg:flex-col',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-xl font-bold text-white">
              BN
            </div>
            {!collapsed ? (
              <div>
                <h1 className="text-sm font-bold leading-tight">BBQ Nation</h1>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Feedback Analysis
                </p>
              </div>
            ) : null}
          </div>

          {!collapsed ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-3 flex w-full items-center justify-center rounded-md border border-slate-200 p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {primaryNavigationItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2.5 transition-all duration-200',
                collapsed ? 'justify-center' : 'justify-between',
                active
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <div className={cn('flex items-center gap-3', collapsed && 'gap-0')}>
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    active ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600',
                  )}
                />
                {!collapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
              </div>
              {!collapsed && active ? <ChevronRight className="h-4 w-4" /> : null}
            </Link>
          );
        })}

        <div className={cn('pt-3', collapsed ? 'px-2' : 'px-3')}>
          {collapsed ? (
            <div className="h-px w-full bg-slate-200" />
          ) : (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Categories</p>
          )}
        </div>

        {categoryNavigationItems.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2.5 transition-all duration-200',
                collapsed ? 'justify-center' : 'justify-between',
                active
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <div className={cn('flex items-center gap-3', collapsed && 'gap-0')}>
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    active ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600',
                  )}
                />
                {!collapsed ? <span className="text-sm font-medium">{item.label}</span> : null}
              </div>
              {!collapsed && active ? <ChevronRight className="h-4 w-4" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-100 p-4">
        <button
          type="button"
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'w-full rounded-lg px-3 py-2.5 text-red-600 transition-all hover:bg-red-50',
            collapsed ? 'flex items-center justify-center' : 'flex items-center gap-3',
          )}
        >
          <LogOut className="h-5 w-5 text-red-400" />
          {!collapsed ? <span className="text-sm font-medium">Logout</span> : null}
        </button>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 p-4">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-700">
            AD
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">Management Admin</p>
              <p className="truncate text-[10px] text-slate-500">admin@bbqnation.com</p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
};
