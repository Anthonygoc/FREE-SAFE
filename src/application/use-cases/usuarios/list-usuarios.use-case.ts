import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { UserRepository, UserResumo } from '@/domain/ports/user.repository';

export interface ListUsuariosInput {
  usuario: UsuarioAutenticado;
  postoId?: string;
}

export class ListUsuariosUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: ListUsuariosInput): Promise<UserResumo[]> {
    autorizar(input.usuario, 'usuarios', 'ver');

    if (input.postoId) {
      return this.userRepo.listarPorPosto(input.postoId);
    }

    return this.userRepo.listarTodos();
  }
}
