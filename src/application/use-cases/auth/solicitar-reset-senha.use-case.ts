import { randomBytes } from 'crypto';

import type { UserRepository } from '@/domain/ports/user.repository';
import { enviarEmailResetSenha } from '@/infrastructure/email/email-service';

export interface SolicitarResetSenhaInput {
  email: string;
}

export class SolicitarResetSenhaUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: SolicitarResetSenhaInput): Promise<void> {
    const user = await this.userRepo.buscarPorEmail(input.email);

    if (!user || !user.ativo) {
      return;
    }

    const token = randomBytes(32).toString('hex');
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

    await this.userRepo.salvarResetToken(user.id, token, expiraEm);
    await enviarEmailResetSenha(user.email, user.nome, token);
  }
}
