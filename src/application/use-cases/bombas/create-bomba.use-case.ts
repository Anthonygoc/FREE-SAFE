import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
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
    autorizar(input.usuario, 'bombas', 'criar', input.postoId);

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
