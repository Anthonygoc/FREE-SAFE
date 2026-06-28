import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import { NotFoundError } from '@/domain/errors/domain.errors';
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
    const bico = await this.bicoRepo.buscarPorId(input.bicoId);
    if (!bico) {
      throw new NotFoundError('Bico não encontrado');
    }

    const bomba = await this.bombaRepo.buscarPorId(bico.bombaId);
    if (!bomba) {
      throw new NotFoundError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'editar', bomba.postoId);

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
