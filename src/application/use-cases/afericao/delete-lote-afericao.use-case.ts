import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';

export interface DeleteLoteAfericaoInput {
  usuario: UsuarioAutenticado;
  loteId: string;
}

export interface DeleteLoteAfericaoOutput {
  deletado: true;
}

export class DeleteLoteAfericaoUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: DeleteLoteAfericaoInput): Promise<DeleteLoteAfericaoOutput> {
    const afericoes = await this.afericaoRepo.listarPorLote(input.loteId);

    if (afericoes.length === 0) {
      throw new DomainError('Lote de aferições não encontrado');
    }

    autorizar(input.usuario, 'inmetro', 'excluir', afericoes[0].postoId);

    await this.afericaoRepo.deletarLote(input.loteId);

    return { deletado: true };
  }
}
