import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
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
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const bomba = await this.bombaRepo.buscarPorId(input.bombaId);
    if (!bomba) {
      throw new DomainError('Bomba não encontrada');
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== bomba.postoId) {
        throw new UnauthorizedError('Gerente só pode excluir bombas do próprio posto');
      }
    }

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
