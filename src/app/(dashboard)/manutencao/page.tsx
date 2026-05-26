import { Wrench } from 'lucide-react';

import { CardBase } from '@/components/ui/card-base';

const itens = [
  { titulo: 'Plano preventivo', descricao: 'Cronograma de bombas, compressores e equipamentos críticos.' },
  { titulo: 'Chamados corretivos', descricao: 'Registro e tratativa de ocorrências operacionais em aberto.' },
  { titulo: 'Controle de fornecedores', descricao: 'Gestão de terceiros, SLA e histórico de atendimento.' },
];

export default function ManutencaoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Manutenção</h1>
        <p className="mt-1 text-zinc-500">Gestão de manutenção preventiva, corretiva e emergencial.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {itens.map((item) => (
          <CardBase key={item.titulo}>
            <div className="w-fit rounded-xl bg-orange-50 p-2 text-orange-600">
              <Wrench className="h-5 w-5" />
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
