import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface ListBombasByPostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
}

export interface ListBombasByPostoOutputItem {
  id: string;
  numero: number;
  modelo?: string;
  bicos: Array<{
    id: string;
    numero: number;
    numeroSequencial: number;
    produto: string;
    capacidade?: number;
  }>;
}

export class ListBombasByPostoUseCase {
  constructor(private readonly bombaRepo: BombaRepository) {}

  async execute(input: ListBombasByPostoInput): Promise<ListBombasByPostoOutputItem[]> {
    autorizar(input.usuario, 'bombas', 'ver', input.postoId);

    const bombas = await this.bombaRepo.listarPorPosto(input.postoId);

    return bombas.map((bomba) => ({
      id: bomba.id,
      numero: bomba.numero,
      modelo: bomba.modelo,
      bicos: bomba.bicos.map((bico) => ({
        id: bico.id,
        numero: bico.numero,
        numeroSequencial: bico.numeroSequencial,
        produto: bico.produto,
        capacidade: bico.capacidade,
      })),
    }));
  }
}
