import { ClipboardList } from 'lucide-react';

import { CardBase } from '@/components/ui/card-base';

const itens = [
  { titulo: 'Auditoria interna', descricao: 'Roteiros e registros de auditorias operacionais por posto.' },
  { titulo: 'Planos de correção', descricao: 'Acompanhamento de não conformidades e prazos de regularização.' },
  { titulo: 'Evidências', descricao: 'Organização de fotos, documentos e históricos para inspeções.' },
];

export default function AuditoriasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Auditorias</h1>
        <p className="mt-1 text-zinc-500">Gestão de auditorias e conformidade operacional da rede.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {itens.map((item) => (
          <CardBase key={item.titulo}>
            <div className="w-fit rounded-xl bg-orange-50 p-2 text-orange-600">
              <ClipboardList className="h-5 w-5" />
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
