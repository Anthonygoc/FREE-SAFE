'use client';
import { Droplets } from 'lucide-react';

import { RouteGuard } from '@/components/auth/route-guard';
import { ModulePlaceholder } from '@/components/ui/module-placeholder';

export default function DrenagemPage() {
  return (
    <RouteGuard recurso="drenagem">
      <ModulePlaceholder tituloModulo="Drenagem" descricao="Esta funcionalidade estará disponível em breve." icon={Droplets} />
    </RouteGuard>
  );
}
