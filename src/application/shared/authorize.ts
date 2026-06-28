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
    throw new ForbiddenError('Você não tem permissão para acessar este recurso');
  }

  if (postoIdAlvo && !podeAcessarPosto(usuario, postoIdAlvo)) {
    throw new ForbiddenError('Você só pode acessar dados do seu posto');
  }
}
