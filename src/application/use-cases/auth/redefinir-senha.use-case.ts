import bcrypt from 'bcryptjs';

import { DomainError } from '@/domain/errors/domain.errors';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface RedefinirSenhaInput {
  token: string;
  novaSenha: string;
}

export class RedefinirSenhaUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: RedefinirSenhaInput): Promise<void> {
    if (input.novaSenha.length < 8) {
      throw new DomainError('A senha deve ter no mínimo 8 caracteres');
    }

    const user = await this.userRepo.buscarPorResetToken(input.token);

    if (
      !user
      || !user.ativo
      || !user.resetTokenExpiraEm
      || user.resetTokenExpiraEm.getTime() < Date.now()
    ) {
      throw new DomainError('Link inválido ou expirado');
    }

    const senhaHash = await bcrypt.hash(input.novaSenha, 10);
    await this.userRepo.atualizarSenhaELimparToken(user.id, senhaHash);
  }
}
