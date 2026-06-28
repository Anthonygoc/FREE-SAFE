'use client';
import { Wrench } from 'lucide-react';

import { RouteGuard } from '@/components/auth/route-guard';
import { ModulePlaceholder } from '@/components/ui/module-placeholder';

export default function ManutencaoPage() {
  return (
    <RouteGuard recurso="manutencao">
      <ModulePlaceholder tituloModulo="Manutenção" descricao="Esta funcionalidade estará disponível em breve." icon={Wrench} />
    </RouteGuard>
  );
}
