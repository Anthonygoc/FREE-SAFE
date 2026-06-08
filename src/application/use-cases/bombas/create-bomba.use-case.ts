import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface CreateBombaInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  numero: number;
  modelo?: string;
}

export interface CreateBombaOutput {
  id: string;
}

export class CreateBombaUseCase {
  constructor(private readonly bombaRepo: BombaRepository) {}

  async execute(input: CreateBombaInput): Promise<CreateBombaOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== input.postoId) {
        throw new UnauthorizedError('Gerente só pode criar bomba no próprio posto');
      }
    }

    const id = crypto.randomUUID();

    await this.bombaRepo.salvar({
      id,
      postoId: input.postoId,
      numero: input.numero,
      modelo: input.modelo,
      ativo: true,
      criadoEm: new Date(),
    });

    return { id };
  }
}
