import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';

export interface DeleteAfericaoInput {
  usuario: UsuarioAutenticado;
  afericaoId: string;
}

export interface DeleteAfericaoOutput {
  deletado: true;
}

export class DeleteAfericaoUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: DeleteAfericaoInput): Promise<DeleteAfericaoOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const afericao = await this.afericaoRepo.buscarPorId(input.afericaoId);
    if (!afericao) {
      throw new DomainError('Aferição não encontrada');
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== afericao.postoId) {
        throw new UnauthorizedError('Gerente só pode excluir aferições do próprio posto');
      }
    }

    await this.afericaoRepo.deletar(input.afericaoId);

    return { deletado: true };
  }
}
