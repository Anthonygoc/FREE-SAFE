import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { Colaborador, type StatusColaborador } from '@/domain/entities/colaborador.entity';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
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
        throw new UnauthorizedError('Gerente só pode editar colaborador do próprio posto');
      }
    }

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

    return { id: atualizado.id };
  }
}
