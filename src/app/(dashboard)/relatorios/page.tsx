import { BarChart3 } from 'lucide-react';

import { CardBase } from '@/components/ui/card-base';

const itens = [
  { titulo: 'Relatório executivo', descricao: 'Visão consolidada de conformidade, treinamentos e pendências.' },
  { titulo: 'Indicadores operacionais', descricao: 'Métricas por posto para acompanhamento de performance.' },
  { titulo: 'Exportações', descricao: 'Geração de relatórios para reuniões e auditorias externas.' },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Relatórios</h1>
        <p className="mt-1 text-zinc-500">Painel de análises e documentos gerenciais do FREE SAFE.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {itens.map((item) => (
          <CardBase key={item.titulo}>
            <div className="w-fit rounded-xl bg-orange-50 p-2 text-orange-600">
              <BarChart3 className="h-5 w-5" />
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
  );
}
