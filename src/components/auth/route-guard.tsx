'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import type { Recurso } from '@/domain/permissions/permissions';
import { podeVer } from '@/lib/can-access';

interface RouteGuardProps {
  recurso: Recurso;
  children: ReactNode;
}

export function RouteGuard({ recurso, children }: RouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const perfil = session?.user?.perfil;
  const autorizado = podeVer(perfil, recurso);

  useEffect(() => {
    if (status === 'authenticated' && !autorizado) {
      router.replace('/');
    }
  }, [autorizado, router, status]);

  if (status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!autorizado) {
    return null;
  }

  return <>{children}</>;
}
