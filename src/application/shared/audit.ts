import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import type { RegistrarAuditoriaInput } from '@/domain/ports/audit-log.repository';
import { auditLogRepository } from '@/lib/container';

type RegistrarParams = {
  usuario: UsuarioAutenticado;
  acao: RegistrarAuditoriaInput['acao'];
  recurso: RegistrarAuditoriaInput['recurso'];
  descricao: string;
  entidadeId?: string | null;
  postoId?: string | null;
  detalhes?: unknown;
  ip?: string | null;
};

/**
 * Registra uma ação no log de auditoria.
 * NUNCA lança erro para o chamador: se o log falhar, apenas loga no console.
 * A ação principal do usuário não pode ser revertida por falha de auditoria.
 */
export async function registrarAuditoria(params: RegistrarParams): Promise<void> {
  try {
    await auditLogRepository().registrar({
      usuarioId: params.usuario.id,
      usuarioNome: params.usuario.nome,
      usuarioEmail: params.usuario.email,
      perfil: params.usuario.perfil,
      acao: params.acao,
      recurso: params.recurso,
      entidadeId: params.entidadeId ?? null,
      postoId: params.postoId ?? null,
      descricao: params.descricao,
      detalhes: params.detalhes == null ? null : JSON.stringify(params.detalhes),
      ip: params.ip ?? null,
    });
  } catch (error) {
    console.error('[auditoria] falha ao registrar log:', error);
  }
}
