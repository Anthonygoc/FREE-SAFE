import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';
import { DomainError } from '@/domain/errors/domain.errors';
import type { BicoRepository } from '@/domain/ports/bico.repository';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface CreateBicoInput {
  usuario: UsuarioAutenticado;
  bombaId: string;
  numero: number;
  produto: ProdutoCombustivel;
  capacidade?: number;
}

export interface CreateBicoOutput {
  id: string;
}

export class CreateBicoUseCase {
  constructor(
    private readonly bombaRepo: BombaRepository,
    private readonly bicoRepo: BicoRepository,
  ) {}

  async execute(input: CreateBicoInput): Promise<CreateBicoOutput> {
    const bomba = await this.bombaRepo.buscarPorId(input.bombaId);
    if (!bomba) {
      throw new DomainError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'criar', bomba.postoId);

    const id = crypto.randomUUID();

    await this.bicoRepo.salvar({
      id,
      bombaId: input.bombaId,
      numero: input.numero,
      produto: input.produto,
      capacidade: input.capacidade,
      ativo: true,
      criadoEm: new Date(),
    });

    return { id };
  }
}
