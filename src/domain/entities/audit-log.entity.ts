export const AUDIT_ACOES = ['CRIAR', 'EDITAR', 'EXCLUIR', 'LOGIN', 'LOGOUT', 'EXPORTAR'] as const;

export type AuditAcao = (typeof AUDIT_ACOES)[number];

export const AUDIT_RECURSOS = [
  'AFERICAO',
  'BOMBA',
  'RAQ',
  'DOCUMENTO',
  'COLABORADOR',
  'USUARIO',
  'CURSO',
  'CERTIFICADO',
  'CATEGORIA',
] as const;

export type AuditRecurso = (typeof AUDIT_RECURSOS)[number];

export interface AuditLog {
  id: string;
  usuarioId?: string | null;
  usuarioNome: string;
  usuarioEmail: string;
  perfil: string;
  acao: AuditAcao;
  recurso: AuditRecurso;
  entidadeId?: string | null;
  postoId?: string | null;
  descricao: string;
  detalhes?: string | null;
  ip?: string | null;
  criadoEm: Date;
}
