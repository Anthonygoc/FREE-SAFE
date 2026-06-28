import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { NotFoundError } from '@/domain/errors/domain.errors';
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
      throw new NotFoundError('Bico não encontrado');
    }

    const bomba = await this.bombaRepo.buscarPorId(bico.bombaId);
    if (!bomba) {
      throw new NotFoundError('Bomba não encontrada');
    }

    autorizar(input.usuario, 'bombas', 'excluir', bomba.postoId);

    const totalAfericoes = await this.bicoRepo.contarAfericoes(bico.id);
    const desativado = totalAfericoes > 0;

    if (desativado) {
      await this.bicoRepo.desativar(bico.id);
    } else {
      await this.bicoRepo.deletar(bico.id);
    }
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EXCLUIR',
      recurso: 'BOMBA',
      entidadeId: bico.id,
      postoId: bomba.postoId,
      descricao: `Removeu bico ${bico.numero} da bomba ${bomba.numero}`,
      detalhes: {
        bombaNumero: bomba.numero,
        bicoNumero: bico.numero,
        desativado,
      },
    });

    return { deletado: true };
  }
}
