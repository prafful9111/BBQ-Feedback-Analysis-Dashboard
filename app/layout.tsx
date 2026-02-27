import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/shared/providers/app-providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'Barbeque Nation - Feedback Admin Dashboard',
  description:
    'Production-grade admin dashboard for monitoring customer feedback, issue tickets, and CSAT insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
