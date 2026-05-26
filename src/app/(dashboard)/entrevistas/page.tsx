import { ClipboardCheck } from 'lucide-react';

import { CardBase } from '@/components/ui/card-base';

const tipos = [
  { titulo: 'Admissão', descricao: 'Entrevista inicial e alinhamento de rotina operacional.' },
  { titulo: 'Integração', descricao: 'Acompanhamento de adaptação e checklist de integração.' },
  { titulo: '30 dias', descricao: 'Avaliação do primeiro ciclo e reforço de padrões.' },
  { titulo: 'Experiência', descricao: 'Fechamento do período de experiência do colaborador.' },
  { titulo: 'Periódica', descricao: 'Entrevista recorrente para desempenho e clima.' },
  { titulo: 'Ocorrência', descricao: 'Registro de conversa técnica após ocorrência operacional.' },
  { titulo: 'Retorno', descricao: 'Reintegração do colaborador após afastamento.' },
  { titulo: 'Desligamento', descricao: 'Entrevista final com consolidação de aprendizados.' },
];

export default function EntrevistasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Entrevistas e Acompanhamentos</h1>
        <p className="mt-1 text-zinc-500">Modelos de entrevistas para gestão de pessoas e conformidade.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tipos.map((tipo) => (
          <CardBase key={tipo.titulo}>
            <div className="rounded-xl bg-orange-50 p-2 text-orange-600 w-fit">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-bold text-zinc-900">{tipo.titulo}</h2>
            <p className="mt-1 text-sm text-zinc-500">{tipo.descricao}</p>
          </CardBase>
        ))}
      </div>
    </div>
  );
}
