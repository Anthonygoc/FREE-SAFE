import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { ForbiddenError } from '@/domain/errors/forbidden.error';
import { type Acao, type Recurso, podeAcessar, podeAcessarPosto } from '@/domain/permissions/permissions';

export function autorizar(
  usuario: UsuarioAutenticado,
  recurso: Recurso,
  acao: Acao,
  postoIdAlvo?: string,
) {
  if (!podeAcessar(usuario.perfil, recurso, acao)) {
    throw new ForbiddenError(`Perfil ${usuario.perfil} não pode ${acao} em ${recurso}.`);
  }

  if (postoIdAlvo && !podeAcessarPosto(usuario, postoIdAlvo)) {
    throw new ForbiddenError('Usuário não pode acessar dados de outro posto.');
  }
}
