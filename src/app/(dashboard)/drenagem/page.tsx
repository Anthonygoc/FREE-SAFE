import { Droplets } from 'lucide-react';

import { RouteGuard } from '@/components/auth/route-guard';
import { CardBase } from '@/components/ui/card-base';

const itens = [
  { titulo: 'Checklist diário', descricao: 'Inspeções de caixas separadoras, canaletas e pontos de escoamento.' },
  { titulo: 'Conformidade ambiental', descricao: 'Acompanhamento de padrões e evidências para auditorias.' },
  { titulo: 'Plano de ação', descricao: 'Tratativa de não conformidades e pendências de drenagem.' },
];

export default function DrenagemPage() {
  return (
    <RouteGuard recurso="drenagem">
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Drenagem</h1>
        <p className="mt-1 text-zinc-500">Controle operacional e ambiental dos processos de drenagem.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {itens.map((item) => (
          <CardBase key={item.titulo}>
            <div className="w-fit rounded-xl bg-orange-50 p-2 text-orange-600">
              <Droplets className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-bold text-zinc-900">{item.titulo}</h2>
            <p className="mt-1 text-sm text-zinc-500">{item.descricao}</p>
            <button type="button" className="mt-4 text-sm font-semibold text-orange-600 hover:text-orange-700">
              Abrir módulo
            </button>
          </CardBase>
        ))}
      </div>
      </div>
    </RouteGuard>
  );
}
