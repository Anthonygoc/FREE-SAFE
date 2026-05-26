'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { queryClient } from '@/lib/query-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-zinc-100">
        <Sidebar />
        <div className="min-h-screen lg:pl-72">
          <Header />
          <main className="p-5 lg:p-8">{children}</main>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </QueryClientProvider>
  );
}
