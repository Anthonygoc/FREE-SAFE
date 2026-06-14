import bcrypt from 'bcryptjs';

import type { PerfilUsuario, UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface CreateUsuarioInput {
  usuario: UsuarioAutenticado;
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
  postoId: string | null;
}

export interface CreateUsuarioOutput {
  id: string;
}

function isPerfilOperacional(perfil: PerfilUsuario): perfil is 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN' {
  return perfil === 'GERENTE' || perfil === 'ADMINISTRATIVO' || perfil === 'ADMIN';
}

export class CreateUsuarioUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: CreateUsuarioInput): Promise<CreateUsuarioOutput> {
    autorizar(input.usuario, 'usuarios', 'criar');

    if (!isPerfilOperacional(input.perfil) || input.perfil === 'ADMIN') {
      throw new DomainError('Este cadastro permite criar apenas usuários GERENTE ou ADMINISTRATIVO.');
    }

    if (input.senha.length < 8) {
      throw new DomainError('A senha deve ter pelo menos 8 caracteres.');
    }

    if ((input.perfil === 'GERENTE' || input.perfil === 'ADMINISTRATIVO') && !input.postoId) {
      throw new DomainError('GERENTE e ADMINISTRATIVO exigem posto vinculado.');
    }

    const existente = await this.userRepo.buscarPorEmail(input.email);
    if (existente) {
      throw new DomainError('Já existe um usuário com este e-mail.');
    }

    const senhaHash = await bcrypt.hash(input.senha, 10);
    const agora = new Date();
    const id = crypto.randomUUID();

    await this.userRepo.salvar({
      id,
      nome: input.nome,
      email: input.email,
      senhaHash,
      perfil: input.perfil,
      postoId: input.postoId,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    return { id };
  }
}
