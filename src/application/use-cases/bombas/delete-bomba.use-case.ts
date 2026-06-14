import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { BicoRepository } from '@/domain/ports/bico.repository';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface DeleteBombaInput {
  usuario: UsuarioAutenticado;
  bombaId: string;
}

export interface DeleteBombaOutput {
  deletado: true;
}

export class DeleteBombaUseCase {
  constructor(
    private readonly bombaRepo: BombaRepository,
    private readonly bicoRepo: BicoRepository,
  ) {}

  async execute(input: DeleteBombaInput): Promise<DeleteBombaOutput> {
    const bomba = await this.bombaRepo.buscarPorId(input.bombaId);
    if (!bomba) {
      throw new DomainError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'excluir', bomba.postoId);

    const bicos = await this.bicoRepo.listarPorBomba(bomba.id, true);
    let deveDesativarBomba = false;

    for (const bico of bicos) {
      const totalAfericoes = await this.bicoRepo.contarAfericoes(bico.id);

      if (totalAfericoes > 0) {
        deveDesativarBomba = true;

        if (bico.ativo) {
          await this.bicoRepo.desativar(bico.id);
        }

        continue;
      }

      await this.bicoRepo.deletar(bico.id);
    }

    if (deveDesativarBomba) {
      await this.bombaRepo.atualizar(bomba.id, { ativo: false });
    } else {
      await this.bombaRepo.deletar(bomba.id);
    }

    return { deletado: true };
  }
}
