import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface UpdateBombaInput {
  usuario: UsuarioAutenticado;
  bombaId: string;
  modelo?: string;
  numero?: number;
}

export interface UpdateBombaOutput {
  id: string;
}

export class UpdateBombaUseCase {
  constructor(private readonly bombaRepo: BombaRepository) {}

  async execute(input: UpdateBombaInput): Promise<UpdateBombaOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const bomba = await this.bombaRepo.buscarPorId(input.bombaId);
    if (!bomba) {
      throw new DomainError('Bomba não encontrada');
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== bomba.postoId) {
        throw new UnauthorizedError('Gerente só pode editar bombas do próprio posto');
      }
    }

    if (input.modelo === undefined && input.numero === undefined) {
      throw new DomainError('Nenhum dado informado para atualização');
    }

    await this.bombaRepo.atualizar(bomba.id, {
      modelo: input.modelo,
      numero: input.numero,
    });

    return { id: bomba.id };
  }
}
