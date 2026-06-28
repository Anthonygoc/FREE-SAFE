import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { Colaborador, type StatusColaborador } from '@/domain/entities/colaborador.entity';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';

export interface CreateColaboradorInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  userId?: string;
  nome: string;
  cpf: string;
  fotoUrl?: string;
  cargo: string;
  dataAdmissao: Date;
  status?: StatusColaborador;
  turno?: string;
  escala?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export class CreateColaboradorUseCase {
  constructor(private readonly colaboradorRepo: ColaboradorRepository) {}

  async execute(input: CreateColaboradorInput): Promise<{ id: string }> {
    const { usuario } = input;

    autorizar(usuario, 'colaboradores', 'criar', input.postoId);

    const colaborador = Colaborador.criar({
      postoId: input.postoId,
      userId: input.userId,
      nome: input.nome,
      cpf: input.cpf,
      fotoUrl: input.fotoUrl,
      cargo: input.cargo,
      dataAdmissao: input.dataAdmissao,
      status: input.status,
      turno: input.turno,
      escala: input.escala,
      telefone: input.telefone,
      email: input.email,
      endereco: input.endereco,
    });

    await this.colaboradorRepo.salvar(colaborador);
    await registrarAuditoria({
      usuario,
      acao: 'CRIAR',
      recurso: 'COLABORADOR',
      entidadeId: colaborador.id,
      postoId: colaborador.postoId,
      descricao: `Cadastrou colaborador ${colaborador.nome}`,
      detalhes: {
        cargo: colaborador.cargo,
        status: colaborador.status,
      },
    });

    return { id: colaborador.id };
  }
}
