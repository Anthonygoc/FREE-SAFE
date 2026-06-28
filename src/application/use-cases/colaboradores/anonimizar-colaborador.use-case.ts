import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { NotFoundError } from '@/domain/errors/domain.errors';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';

export interface AnonimizarColaboradorInput {
  usuario: UsuarioAutenticado;
  colaboradorId: string;
}

export interface AnonimizarColaboradorOutput {
  id: string;
  anonimizado: true;
}

export class AnonimizarColaboradorUseCase {
  constructor(private readonly colaboradorRepo: ColaboradorRepository) {}

  async execute(input: AnonimizarColaboradorInput): Promise<AnonimizarColaboradorOutput> {
    const colaborador = await this.colaboradorRepo.buscarPorId(input.colaboradorId);
    if (!colaborador) {
      throw new NotFoundError('Colaborador não encontrado');
    }

    autorizar(input.usuario, 'colaboradores', 'excluir', colaborador.postoId);

    await this.colaboradorRepo.anonimizar(colaborador.id);
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EXCLUIR',
      recurso: 'COLABORADOR',
      entidadeId: colaborador.id,
      postoId: colaborador.postoId,
      descricao: 'Anonimizou dados do colaborador (LGPD)',
      detalhes: {
        colaboradorId: colaborador.id,
        status: 'anonimizado',
      },
    });

    return {
      id: colaborador.id,
      anonimizado: true,
    };
  }
}
