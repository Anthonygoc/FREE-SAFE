import bcrypt from 'bcryptjs';

import type { PerfilUsuario, UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { autorizar } from '@/application/shared/authorize';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface UpdateUsuarioInput {
  usuario: UsuarioAutenticado;
  usuarioId: string;
  nome?: string;
  email?: string;
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
      throw new NotFoundError('Usuário não encontrado');
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
      throw new DomainError('A senha deve ter no mínimo 8 caracteres');
    }

    const emailNormalizado = input.email?.trim();

    if (emailNormalizado !== undefined && !/\S+@\S+\.\S+/.test(emailNormalizado)) {
      throw new DomainError('Informe um e-mail válido.');
    }

    if (emailNormalizado !== undefined) {
      const existente = await this.userRepo.buscarPorEmail(emailNormalizado);
      if (existente && existente.id !== alvo.id) {
        throw new DomainError('Este e-mail já está cadastrado');
      }
    }

    const perfilFinal = input.perfil ?? alvo.perfil;
    const postoIdFinal = input.postoId ?? alvo.postoId;

    if ((perfilFinal === 'GERENTE' || perfilFinal === 'ADMINISTRATIVO') && !postoIdFinal) {
      throw new DomainError('Selecione um posto para este perfil.');
    }

    const emailFinal = emailNormalizado ?? alvo.email;
    const senhaHash = input.novaSenha
      ? await bcrypt.hash(input.novaSenha, 10)
      : alvo.senhaHash;
    const emailAlterado = emailFinal !== alvo.email;
    const atualizado = {
      ...alvo,
      nome: input.nome ?? alvo.nome,
      email: emailFinal,
      perfil: perfilFinal,
      postoId: postoIdFinal,
      ativo: input.ativo ?? alvo.ativo,
      senhaHash,
      atualizadoEm: new Date(),
    };

    await this.userRepo.atualizar(atualizado);
    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EDITAR',
      recurso: 'USUARIO',
      entidadeId: atualizado.id,
      postoId: atualizado.postoId,
      descricao: `Editou usuário ${atualizado.nome}`,
      detalhes: {
        perfil: atualizado.perfil,
        postoId: atualizado.postoId,
        ativo: atualizado.ativo,
        emailAlterado,
        senhaAlterada: input.novaSenha !== undefined,
      },
    });

    return { id: alvo.id };
  }
}
