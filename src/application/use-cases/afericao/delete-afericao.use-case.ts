import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';

export interface DeleteAfericaoInput {
  usuario: UsuarioAutenticado;
  afericaoId: string;
}

export interface DeleteAfericaoOutput {
  deletado: true;
}

export class DeleteAfericaoUseCase {
  constructor(private readonly afericaoRepo: AfericaoRepository) {}

  async execute(input: DeleteAfericaoInput): Promise<DeleteAfericaoOutput> {
    const afericao = await this.afericaoRepo.buscarPorId(input.afericaoId);
    if (!afericao) {
      throw new DomainError('Aferição não encontrada');
    }

    autorizar(input.usuario, 'inmetro', 'excluir', afericao.postoId);

    await this.afericaoRepo.deletar(input.afericaoId);
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EXCLUIR',
      recurso: 'AFERICAO',
      entidadeId: input.afericaoId,
      postoId: afericao.postoId,
      descricao: `Excluiu aferição do bico ${afericao.bico} (bomba ${afericao.bomba})`,
      detalhes: {
        loteId: afericao.loteId ?? null,
        situacao: afericao.situacao,
        resultadoMl: afericao.resultadoMl,
      },
    });

    return { deletado: true };
  }
}
