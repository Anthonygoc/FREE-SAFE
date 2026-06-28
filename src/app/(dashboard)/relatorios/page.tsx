'use client';
import { BarChart3 } from 'lucide-react';

import { RouteGuard } from '@/components/auth/route-guard';
import { ModulePlaceholder } from '@/components/ui/module-placeholder';

export default function RelatoriosPage() {
  return (
    <RouteGuard recurso="relatorios">
      <ModulePlaceholder tituloModulo="Relatórios" descricao="Esta funcionalidade estará disponível em breve." icon={BarChart3} />
    </RouteGuard>
  );
}
