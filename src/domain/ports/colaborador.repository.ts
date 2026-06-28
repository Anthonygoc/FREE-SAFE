import type { Colaborador, StatusColaborador } from '@/domain/entities/colaborador.entity';

export interface ListarColaboradoresFiltros {
  cargo?: string;
  status?: StatusColaborador;
  limite?: number;
  offset?: number;
}

export interface ColaboradorRepository {
  listarPorPosto(
    postoId: string,
    filtros?: ListarColaboradoresFiltros,
  ): Promise<{ itens: Colaborador[]; total: number }>;
  buscarPorId(id: string): Promise<Colaborador | null>;
  buscarPorUserId(userId: string): Promise<Colaborador | null>;
  salvar(colaborador: Colaborador): Promise<void>;
  atualizar(colaborador: Colaborador): Promise<void>;
  contarAtivos(): Promise<number>;
}
