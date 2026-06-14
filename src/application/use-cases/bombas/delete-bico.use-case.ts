import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { BicoRepository } from '@/domain/ports/bico.repository';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface DeleteBicoInput {
  usuario: UsuarioAutenticado;
  bicoId: string;
}

export interface DeleteBicoOutput {
  deletado: true;
}

export class DeleteBicoUseCase {
  constructor(
    private readonly bombaRepo: BombaRepository,
    private readonly bicoRepo: BicoRepository,
  ) {}

  async execute(input: DeleteBicoInput): Promise<DeleteBicoOutput> {
    const bico = await this.bicoRepo.buscarPorId(input.bicoId);
    if (!bico) {
      throw new DomainError('Bico não encontrado');
    }

    const bomba = await this.bombaRepo.buscarPorId(bico.bombaId);
    if (!bomba) {
      throw new DomainError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'excluir', bomba.postoId);

    const totalAfericoes = await this.bicoRepo.contarAfericoes(bico.id);

    if (totalAfericoes > 0) {
      await this.bicoRepo.desativar(bico.id);
    } else {
      await this.bicoRepo.deletar(bico.id);
    }

    return { deletado: true };
  }
}
