import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
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
    const bomba = await this.bombaRepo.buscarPorId(input.bombaId);
    if (!bomba) {
      throw new DomainError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'editar', bomba.postoId);

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
