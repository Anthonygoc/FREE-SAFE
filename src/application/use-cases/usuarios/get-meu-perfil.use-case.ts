import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { NotFoundError } from '@/domain/errors/domain.errors';
import type { PostoRepository } from '@/domain/ports/posto.repository';
import type { UserRepository } from '@/domain/ports/user.repository';

export interface GetMeuPerfilInput {
  usuario: UsuarioAutenticado;
}

export interface GetMeuPerfilOutput {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  postoId: string | null;
  postoNome: string | null;
}

export class GetMeuPerfilUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly postoRepo: PostoRepository,
  ) {}

  async execute(input: GetMeuPerfilInput): Promise<GetMeuPerfilOutput> {
    const user = await this.userRepo.buscarPorId(input.usuario.id);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    const posto = user.postoId ? await this.postoRepo.buscarPorId(user.postoId) : null;

    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      postoId: user.postoId,
      postoNome: posto?.nome ?? null,
    };
  }
}
