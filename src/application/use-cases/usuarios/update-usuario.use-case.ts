import bcrypt from 'bcryptjs';

import type { PerfilUsuario, UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface UpdateUsuarioInput {
  usuario: UsuarioAutenticado;
  usuarioId: string;
  nome?: string;
  perfil?: PerfilUsuario;
  postoId?: string;
  ativo?: boolean;
  novaSenha?: string;
}

export interface UpdateUsuarioOutput {
  id: string;
}

function isPerfilOperacional(perfil: PerfilUsuario): perfil is 'GERENTE' | 'ADMINISTRATIVO' | 'ADMIN' {
  return perfil === 'GERENTE' || perfil === 'ADMINISTRATIVO' || perfil === 'ADMIN';
}

export class UpdateUsuarioUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: UpdateUsuarioInput): Promise<UpdateUsuarioOutput> {
    autorizar(input.usuario, 'usuarios', 'editar');

    const alvo = await this.userRepo.buscarPorId(input.usuarioId);
    if (!alvo) {
      throw new DomainError('Usuário não encontrado.');
    }

    if (
      alvo.id === input.usuario.id
      && (input.perfil !== undefined || input.ativo !== undefined)
    ) {
      throw new DomainError('Você não pode alterar seu próprio perfil ou status de ativação.');
    }

    if (input.perfil !== undefined && !isPerfilOperacional(input.perfil)) {
      throw new DomainError('Perfil inválido para login operacional.');
    }

    if (input.novaSenha !== undefined && input.novaSenha.length < 8) {
      throw new DomainError('A nova senha deve ter pelo menos 8 caracteres.');
    }

    const perfilFinal = input.perfil ?? alvo.perfil;
    const postoIdFinal = input.postoId ?? alvo.postoId;

    if ((perfilFinal === 'GERENTE' || perfilFinal === 'ADMINISTRATIVO') && !postoIdFinal) {
      throw new DomainError('GERENTE e ADMINISTRATIVO exigem posto vinculado.');
    }

    const senhaHash = input.novaSenha
      ? await bcrypt.hash(input.novaSenha, 10)
      : alvo.senhaHash;

    await this.userRepo.atualizar({
      ...alvo,
      nome: input.nome ?? alvo.nome,
      perfil: perfilFinal,
      postoId: postoIdFinal,
      ativo: input.ativo ?? alvo.ativo,
      senhaHash,
      atualizadoEm: new Date(),
    });

    return { id: alvo.id };
  }
}
