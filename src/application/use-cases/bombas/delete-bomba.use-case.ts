import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { NotFoundError } from '@/domain/errors/domain.errors';
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
      throw new NotFoundError('Bomba não encontrada');
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
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EXCLUIR',
      recurso: 'BOMBA',
      entidadeId: bomba.id,
      postoId: bomba.postoId,
      descricao: `Removeu bomba ${bomba.numero}`,
      detalhes: {
        bicosProcessados: bicos.length,
        desativada: deveDesativarBomba,
      },
    });

    return { deletado: true };
  }
}
