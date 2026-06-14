import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { BicoRepository } from '@/domain/ports/bico.repository';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface ListBicosByBombaInput {
  usuario: UsuarioAutenticado;
  bombaId: string;
}

export interface ListBicosByBombaOutputItem {
  id: string;
  numero: number;
  produto: string;
  capacidade?: number;
}

export class ListBicosByBombaUseCase {
  constructor(
    private readonly bombaRepo: BombaRepository,
    private readonly bicoRepo: BicoRepository,
  ) {}

  async execute(input: ListBicosByBombaInput): Promise<ListBicosByBombaOutputItem[]> {
    const bomba = await this.bombaRepo.buscarPorId(input.bombaId);

    if (!bomba) {
      throw new DomainError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'ver', bomba.postoId);

    const bicos = await this.bicoRepo.listarPorBomba(input.bombaId);

    return bicos
      .filter((bico) => bico.ativo)
      .map((bico) => ({
      id: bico.id,
      numero: bico.numero,
      produto: bico.produto,
      capacidade: bico.capacidade,
      }));
  }
}
