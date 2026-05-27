import type { Colaborador, StatusColaborador } from '@/domain/entities/colaborador.entity';

export interface ListarColaboradoresFiltros {
  cargo?: string;
  status?: StatusColaborador;
}

export interface ColaboradorRepository {
  listarPorPosto(postoId: string, filtros?: ListarColaboradoresFiltros): Promise<Colaborador[]>;
  buscarPorId(id: string): Promise<Colaborador | null>;
  buscarPorUserId(userId: string): Promise<Colaborador | null>;
  salvar(colaborador: Colaborador): Promise<void>;
  contarAtivos(): Promise<number>;
}
