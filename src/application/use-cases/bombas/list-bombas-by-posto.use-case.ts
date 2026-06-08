import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface ListBombasByPostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
}

export interface ListBombasByPostoOutputItem {
  id: string;
  numero: number;
  modelo?: string;
  bicos: Array<{
    id: string;
    numero: number;
    produto: string;
    capacidade?: number;
  }>;
}

export class ListBombasByPostoUseCase {
  constructor(private readonly bombaRepo: BombaRepository) {}

  async execute(input: ListBombasByPostoInput): Promise<ListBombasByPostoOutputItem[]> {
    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== input.postoId) {
        throw new UnauthorizedError('Gerente só pode visualizar bombas do próprio posto');
      }
    }

    const bombas = await this.bombaRepo.listarPorPosto(input.postoId);

    return bombas.map((bomba) => ({
      id: bomba.id,
      numero: bomba.numero,
      modelo: bomba.modelo,
      bicos: bomba.bicos.map((bico) => ({
        id: bico.id,
        numero: bico.numero,
        produto: bico.produto,
        capacidade: bico.capacidade,
      })),
    }));
  }
}
