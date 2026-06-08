import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { BicoRepository } from '@/domain/ports/bico.repository';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface UpdateBicoInput {
  usuario: UsuarioAutenticado;
  bicoId: string;
  produto: ProdutoCombustivel;
  capacidade?: number;
}

export interface UpdateBicoOutput {
  id: string;
  bombaId: string;
  postoId: string;
}

export class UpdateBicoUseCase {
  constructor(
    private readonly bombaRepo: BombaRepository,
    private readonly bicoRepo: BicoRepository,
  ) {}

  async execute(input: UpdateBicoInput): Promise<UpdateBicoOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const bico = await this.bicoRepo.buscarPorId(input.bicoId);
    if (!bico) {
      throw new DomainError('Bico não encontrado');
    }

    const bomba = await this.bombaRepo.buscarPorId(bico.bombaId);
    if (!bomba) {
      throw new DomainError('Bomba não encontrada');
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== bomba.postoId) {
        throw new UnauthorizedError('Gerente só pode configurar bicos do próprio posto');
      }
    }

    await this.bicoRepo.salvar({
      ...bico,
      produto: input.produto,
      capacidade: input.capacidade,
    });

    return {
      id: bico.id,
      bombaId: bico.bombaId,
      postoId: bomba.postoId,
    };
  }
}
