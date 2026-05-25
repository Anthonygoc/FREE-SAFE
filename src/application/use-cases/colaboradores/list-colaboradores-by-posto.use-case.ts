import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
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
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    if (input.usuario.perfil === 'GERENTE' && input.usuario.postoId !== input.postoId) {
      throw new UnauthorizedError('Gerente só pode listar colaboradores do próprio posto');
    }

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
