'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { queryClient } from '@/lib/query-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <div className="min-h-screen bg-zinc-100">
        <Sidebar />
        <div className="min-h-screen lg:pl-72">
          <Header />
          <main className="p-5 lg:p-8">{children}</main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
