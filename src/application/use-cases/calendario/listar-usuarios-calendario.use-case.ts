import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { UserRepository, UserResumo } from '@/domain/ports/user.repository';
import { resolverPostoId } from './calendario.shared';

export interface ListarUsuariosCalendarioInput {
  usuario: UsuarioAutenticado;
  postoId?: string;
}

export class ListarUsuariosCalendarioUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(input: ListarUsuariosCalendarioInput): Promise<UserResumo[]> {
    const postoId = resolverPostoId(input.usuario, input.postoId);
    autorizar(input.usuario, 'calendario', 'ver', postoId);

    if (!postoId) {
      return [];
    }

    return this.userRepo.listarPorPosto(postoId);
  }
}
