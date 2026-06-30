import bcrypt from 'bcryptjs';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { registrarAuditoria } from '@/application/shared/audit';
import { DomainError, NotFoundError } from '@/domain/errors/domain.errors';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface AlterarMinhaSenhaInput {
  usuario: UsuarioAutenticado;
  senhaAtual: string;
  novaSenha: string;
}

export class AlterarMinhaSenhaUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: AlterarMinhaSenhaInput): Promise<void> {
    const user = await this.userRepo.buscarPorId(input.usuario.id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const senhaAtualConfere = await bcrypt.compare(input.senhaAtual, user.senhaHash);
    if (!senhaAtualConfere) {
      throw new DomainError('Senha atual incorreta');
    }

    if (input.novaSenha.length < 8) {
      throw new DomainError('A nova senha deve ter no mínimo 8 caracteres');
    }

    const senhaHash = await bcrypt.hash(input.novaSenha, 10);

    await this.userRepo.atualizar({
      ...user,
      senhaHash,
      atualizadoEm: new Date(),
    });

    await registrarAuditoria({
      usuario: input.usuario,
      acao: 'EDITAR',
      recurso: 'USUARIO',
      entidadeId: user.id,
      postoId: user.postoId,
      descricao: `Alterou a própria senha (${user.nome})`,
      detalhes: {
        senhaAlterada: true,
      },
    });
  }
}
