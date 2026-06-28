'use client';
import { ClipboardCheck } from 'lucide-react';

import { RouteGuard } from '@/components/auth/route-guard';
import { ModulePlaceholder } from '@/components/ui/module-placeholder';

export default function EntrevistasPage() {
  return (
    <RouteGuard recurso="entrevistas">
      <ModulePlaceholder
        tituloModulo="Entrevistas"
        descricao="Esta funcionalidade estará disponível em breve."
        icon={ClipboardCheck}
      />
    </RouteGuard>
  );
}
