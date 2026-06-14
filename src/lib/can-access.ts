import type { PerfilUsuario } from '@/application/dtos/auth.dto';
import { type Recurso, podeAcessar } from '@/domain/permissions/permissions';

const perfisValidos = new Set<PerfilUsuario>([
  'ADMIN',
  'GERENTE',
  'ADMINISTRATIVO',
  'RH',
  'COLABORADOR',
  'MANUTENCAO',
]);

export function podeVer(perfil: string | undefined, recurso: Recurso): boolean {
  if (!perfil) {
    return false;
  }

  if (!perfisValidos.has(perfil as PerfilUsuario)) {
    return false;
  }

  return podeAcessar(perfil as PerfilUsuario, recurso, 'ver');
}
