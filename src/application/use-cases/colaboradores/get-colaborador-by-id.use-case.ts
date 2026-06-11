import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { StatusColaborador } from '@/domain/entities/colaborador.entity';

export interface GetColaboradorByIdInput {
  usuario: UsuarioAutenticado;
  colaboradorId: string;
}

export interface GetColaboradorByIdOutput {
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

export class GetColaboradorByIdUseCase {
  constructor(private readonly colaboradorRepo: ColaboradorRepository) {}

  async execute(input: GetColaboradorByIdInput): Promise<GetColaboradorByIdOutput> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const colaborador = await this.colaboradorRepo.buscarPorId(input.colaboradorId);
    if (!colaborador) {
      throw new DomainError('Colaborador não encontrado');
    }

    if (input.usuario.perfil === 'GERENTE') {
      if (!input.usuario.postoId) {
        throw new UnauthorizedError('Gerente sem posto vinculado');
      }

      if (input.usuario.postoId !== colaborador.postoId) {
        throw new UnauthorizedError('Gerente só pode visualizar colaborador do próprio posto');
      }
    }

    return {
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
    };
  }
}
