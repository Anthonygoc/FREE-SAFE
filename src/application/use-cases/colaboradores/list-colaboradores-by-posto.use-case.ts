import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { StatusColaborador } from '@/domain/entities/colaborador.entity';

export interface ListColaboradoresByPostoInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  cargo?: string;
  status?: StatusColaborador;
}

export interface ListColaboradoresByPostoOutputItem {
  id: string;
  postoId: string;
  userId?: string;
  nome: string;
  cpf: string;
  fotoUrl?: string;
  cargo: string;
  dataAdmissao: Date;
  status: StatusColaborador;
  turno?: string;
  escala?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  criadoEm: Date;
}

export class ListColaboradoresByPostoUseCase {
  constructor(private readonly colaboradorRepo: ColaboradorRepository) {}

  async execute(input: ListColaboradoresByPostoInput): Promise<ListColaboradoresByPostoOutputItem[]> {
    autorizar(input.usuario, 'colaboradores', 'ver', input.postoId);

    const colaboradores = await this.colaboradorRepo.listarPorPosto(input.postoId, {
      cargo: input.cargo,
      status: input.status,
    });

    return colaboradores.map((colaborador) => ({
      id: colaborador.id,
      postoId: colaborador.postoId,
      userId: colaborador.userId,
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      fotoUrl: colaborador.fotoUrl,
      cargo: colaborador.cargo,
      dataAdmissao: colaborador.dataAdmissao,
      status: colaborador.status,
      turno: colaborador.turno,
      escala: colaborador.escala,
      telefone: colaborador.telefone,
      email: colaborador.email,
      endereco: colaborador.endereco,
      criadoEm: colaborador.criadoEm,
    }));
  }
}
