import { BadgeStatus } from '@/components/ui/badge-status';
import { CardBase } from '@/components/ui/card-base';

const cursos = [
  { nome: 'NR-01', publico: 'Todos os colaboradores', validade: '12 meses', concluidos: 98, pendentes: 6 },
  { nome: 'NR-09', publico: 'Operação e pista', validade: '12 meses', concluidos: 76, pendentes: 11 },
  { nome: 'NR-17', publico: 'Administrativo e atendimento', validade: '24 meses', concluidos: 54, pendentes: 9 },
  { nome: 'NR-20', publico: 'Frentistas e líderes', validade: '12 meses', concluidos: 83, pendentes: 7 },
  { nome: 'Educação Financeira', publico: 'Todos os colaboradores', validade: 'Semestral', concluidos: 61, pendentes: 22 },
];

export default function TreinamentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Cursos e Treinamentos</h1>
        <p className="mt-1 text-zinc-500">Acompanhe adesão e pendências por capacitação obrigatória.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {cursos.map((curso) => (
          <CardBase key={curso.nome}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{curso.nome}</h2>
                <p className="mt-1 text-sm text-zinc-500">{curso.publico}</p>
              </div>
              <BadgeStatus label={`Validade: ${curso.validade}`} tone="dark" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-700">Concluídos</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">{curso.concluidos}</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-700">Pendentes</p>
                <p className="mt-1 text-2xl font-bold text-amber-800">{curso.pendentes}</p>
              </div>
            </div>
          </CardBase>
        ))}
      </div>
    </div>
  );
}
