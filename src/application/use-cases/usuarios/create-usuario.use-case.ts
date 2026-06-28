import bcrypt from 'bcryptjs';

import type { PerfilUsuario, UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
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
      throw new DomainError('Você só pode criar usuários GERENTE ou ADMINISTRATIVO nesta tela.');
    }

    if (input.senha.length < 8) {
      throw new DomainError('A senha deve ter no mínimo 8 caracteres');
    }

    if ((input.perfil === 'GERENTE' || input.perfil === 'ADMINISTRATIVO') && !input.postoId) {
      throw new DomainError('Selecione um posto para este perfil.');
    }

    const existente = await this.userRepo.buscarPorEmail(input.email);
    if (existente) {
      throw new DomainError('Este email já está cadastrado');
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
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'CRIAR',
      recurso: 'USUARIO',
      entidadeId: id,
      postoId: input.postoId,
      descricao: `Criou usuário ${input.nome} (${input.perfil})`,
      detalhes: {
        email: input.email,
        perfil: input.perfil,
        postoId: input.postoId,
      },
    });

    return { id };
  }
}
