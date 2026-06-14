import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface ToggleUsuarioAtivoInput {
  usuario: UsuarioAutenticado;
  usuarioId: string;
  ativo: boolean;
}

export interface ToggleUsuarioAtivoOutput {
  id: string;
}

export class ToggleUsuarioAtivoUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: ToggleUsuarioAtivoInput): Promise<ToggleUsuarioAtivoOutput> {
    autorizar(input.usuario, 'usuarios', 'editar');

    const alvo = await this.userRepo.buscarPorId(input.usuarioId);
    if (!alvo) {
      throw new DomainError('Usuário não encontrado.');
    }

    if (alvo.id === input.usuario.id && input.ativo === false) {
      throw new DomainError('Você não pode desativar o próprio usuário.');
    }

    await this.userRepo.atualizar({
      ...alvo,
      ativo: input.ativo,
      atualizadoEm: new Date(),
    });

    return { id: alvo.id };
  }
}
