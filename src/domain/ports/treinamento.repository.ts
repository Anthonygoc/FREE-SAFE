export interface AtualizarTreinamentoColaboradorInput {
  colaboradorId: string;
  cursoId: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  nota?: number;
  dataConclusao?: Date;
}

export interface TreinamentoRepository {
  upsert(input: AtualizarTreinamentoColaboradorInput): Promise<void>;
}
