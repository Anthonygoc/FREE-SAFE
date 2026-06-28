import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { Colaborador, type StatusColaborador } from '@/domain/entities/colaborador.entity';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';

export interface UpdateColaboradorInput {
  usuario: UsuarioAutenticado;
  colaboradorId: string;
  nome?: string;
  cpf?: string;
  cargo?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  turno?: string;
  escala?: string;
  status?: StatusColaborador;
  fotoUrl?: string;
}

export interface UpdateColaboradorOutput {
  id: string;
}

export class UpdateColaboradorUseCase {
  constructor(private readonly colaboradorRepo: ColaboradorRepository) {}

  async execute(input: UpdateColaboradorInput): Promise<UpdateColaboradorOutput> {
    const colaborador = await this.colaboradorRepo.buscarPorId(input.colaboradorId);
    if (!colaborador) {
      throw new NotFoundError('Colaborador não encontrado');
    }

    autorizar(input.usuario, 'colaboradores', 'editar', colaborador.postoId);

    if (
      input.nome === undefined
      && input.cpf === undefined
      && input.cargo === undefined
      && input.telefone === undefined
      && input.email === undefined
      && input.endereco === undefined
      && input.turno === undefined
      && input.escala === undefined
      && input.status === undefined
      && input.fotoUrl === undefined
    ) {
      throw new DomainError('Nenhum dado informado para atualização');
    }

    const atualizado = Colaborador.reconstituir({
      ...colaborador.toJSON(),
      nome: input.nome ?? colaborador.nome,
      cpf: input.cpf ?? colaborador.cpf,
      cargo: input.cargo ?? colaborador.cargo,
      telefone: input.telefone ?? colaborador.telefone,
      email: input.email ?? colaborador.email,
      endereco: input.endereco ?? colaborador.endereco,
      turno: input.turno ?? colaborador.turno,
      escala: input.escala ?? colaborador.escala,
      status: input.status ?? colaborador.status,
      fotoUrl: input.fotoUrl ?? colaborador.fotoUrl,
    });

    await this.colaboradorRepo.atualizar(atualizado);
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EDITAR',
      recurso: 'COLABORADOR',
      entidadeId: atualizado.id,
      postoId: atualizado.postoId,
      descricao: `Editou dados do colaborador ${atualizado.nome}`,
      detalhes: {
        cargo: atualizado.cargo,
        status: atualizado.status,
      },
    });

    return { id: atualizado.id };
  }
}
