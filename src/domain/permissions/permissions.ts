import type { PerfilUsuario, UsuarioAutenticado } from '@/application/dtos/auth.dto';

export type Recurso =
  | 'inmetro'
  | 'anp'
  | 'bombas'
  | 'calendario'
  | 'documentos'
  | 'colaboradores'
  | 'cursos'
  | 'usuarios'
  | 'postos'
  | 'dashboard'
  | 'auditorias'
  | 'relatorios'
  | 'manutencao'
  | 'drenagem'
  | 'entrevistas';

export type Acao = 'ver' | 'criar' | 'editar' | 'excluir' | 'configurar';

const TODAS_AS_ACOES: Acao[] = ['ver', 'criar', 'editar', 'excluir', 'configurar'];

const TODOS_OS_RECURSOS: Recurso[] = [
  'inmetro',
  'anp',
  'bombas',
  'calendario',
  'documentos',
  'colaboradores',
  'cursos',
  'usuarios',
  'postos',
  'dashboard',
  'auditorias',
  'relatorios',
  'manutencao',
  'drenagem',
  'entrevistas',
];

const permissoesAdmin = TODOS_OS_RECURSOS.reduce<Partial<Record<Recurso, Acao[]>>>((acc, recurso) => {
  acc[recurso] = TODAS_AS_ACOES;
  return acc;
}, {});

export const PERMISSOES: Record<PerfilUsuario, Partial<Record<Recurso, Acao[]>>> = {
  ADMIN: permissoesAdmin,
  GERENTE: {
    inmetro: ['ver', 'criar', 'editar', 'excluir', 'configurar'],
    anp: ['ver', 'criar', 'editar', 'excluir'],
    bombas: ['ver', 'criar', 'editar', 'excluir', 'configurar'],
    calendario: ['ver'],
    documentos: ['ver', 'criar', 'editar', 'excluir'],
    colaboradores: ['ver', 'criar', 'editar', 'excluir'],
    cursos: ['ver', 'criar', 'editar'],
    dashboard: ['ver'],
    postos: ['ver'],
  },
  ADMINISTRATIVO: {
    documentos: ['ver', 'criar', 'editar', 'excluir'],
    colaboradores: ['ver', 'criar', 'editar', 'excluir'],
    dashboard: ['ver'],
    postos: ['ver'],
  },
  COLABORADOR: {},
  RH: {},
  MANUTENCAO: {},
};

export function podeAcessar(perfil: PerfilUsuario, recurso: Recurso, acao: Acao): boolean {
  if (perfil === 'ADMIN') {
    return true;
  }

  return PERMISSOES[perfil][recurso]?.includes(acao) ?? false;
}

export function podeAcessarPosto(usuario: UsuarioAutenticado, postoIdAlvo: string): boolean {
  if (usuario.perfil === 'ADMIN') {
    return true;
  }

  if (usuario.perfil === 'GERENTE' || usuario.perfil === 'ADMINISTRATIVO') {
    return usuario.postoId === postoIdAlvo;
  }

  return false;
}
