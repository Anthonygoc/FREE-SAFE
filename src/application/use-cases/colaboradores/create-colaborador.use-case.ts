import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { Colaborador, type StatusColaborador } from '@/domain/entities/colaborador.entity';
import { UnauthorizedError } from '@/domain/errors/domain.errors';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';

export interface CreateColaboradorInput {
  usuario: UsuarioAutenticado;
  postoId: string;
  userId?: string;
  nome: string;
  cpf: string;
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

    if (usuario.perfil !== 'ADMIN' && usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    if (usuario.perfil === 'GERENTE' && usuario.postoId !== input.postoId) {
      throw new UnauthorizedError('Gerente só pode criar colaborador no próprio posto');
    }

    const colaborador = Colaborador.criar({
      postoId: input.postoId,
      userId: input.userId,
      nome: input.nome,
      cpf: input.cpf,
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

    return { id: colaborador.id };
  }
}
