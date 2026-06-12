import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';

export interface DeleteLoteAfericaoInput {
  usuario: UsuarioAutenticado;
  loteId: string;
}

export interface DeleteLoteAfericaoOutput {
  deletado: true;
}

export class DeleteLoteAfericaoUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: DeleteLoteAfericaoInput): Promise<DeleteLoteAfericaoOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const afericoes = await this.afericaoRepo.listarPorLote(input.loteId);

    if (afericoes.length === 0) {
      throw new DomainError('Lote de aferições não encontrado');
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      const loteDoPosto = afericoes.some((afericao) => afericao.postoId === input.usuario.postoId);
      if (!loteDoPosto) {
        throw new UnauthorizedError('Gerente só pode excluir lotes do próprio posto');
      }
    }

    await this.afericaoRepo.deletarLote(input.loteId);

    return { deletado: true };
  }
}
