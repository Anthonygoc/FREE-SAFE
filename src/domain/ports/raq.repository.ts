import type { ProdutoCombustivel, RAQ, ResultadoAnalise } from '@/domain/entities/raq.entity';

export interface FiltrosRAQ {
  postoId?: string;
  produto?: ProdutoCombustivel;
  resultado?: ResultadoAnalise;
  dataInicio?: Date;
  dataFim?: Date;
}

export interface RAQRepository {
  salvar(raq: RAQ): Promise<void>;
  buscarPorId(id: string): Promise<RAQ | null>;
  listar(filtros: FiltrosRAQ): Promise<RAQ[]>;
  contarPorPosto(postoId: string): Promise<number>;
  contarSemBoletim(): Promise<number>;
}
