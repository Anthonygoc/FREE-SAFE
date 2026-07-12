import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { NotFoundError } from '@/domain/errors/domain.errors';
import type { BombaRepository } from '@/domain/ports/bomba.repository';

export interface DeleteBombaInput {
  usuario: UsuarioAutenticado;
  bombaId: string;
}

export interface DeleteBombaOutput {
  deletado: true;
  acao: 'excluida' | 'desativada';
}

export class DeleteBombaUseCase {
  constructor(private readonly bombaRepo: BombaRepository) {}

  async execute(input: DeleteBombaInput): Promise<DeleteBombaOutput> {
    const bomba = await this.bombaRepo.buscarPorId(input.bombaId);
    if (!bomba) {
      throw new NotFoundError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'excluir', bomba.postoId);

    const totalAfericoes = await this.bombaRepo.contarAfericoes(bomba.id);
    const acao = totalAfericoes === 0 ? 'excluida' : 'desativada';

    if (acao === 'desativada') {
      await this.bombaRepo.atualizar(bomba.id, { ativo: false });
    } else {
      await this.bombaRepo.excluirDefinitivo(bomba.id);
    }

    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EXCLUIR',
      recurso: 'BOMBA',
      entidadeId: bomba.id,
      postoId: bomba.postoId,
      descricao: `Removeu bomba ${bomba.numero}`,
      detalhes: {
        totalAfericoes,
        acao,
      },
    });

    return { deletado: true, acao };
  }
}
