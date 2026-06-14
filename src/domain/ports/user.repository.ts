import type { PerfilUsuario } from '@/application/dtos/auth.dto';

export interface User {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  perfil: PerfilUsuario;
  postoId: string | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface UserResumo {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  postoId: string | null;
  ativo: boolean;
  criadoEm: Date;
}

export interface UserRepository {
  listarPorPosto(postoId: string): Promise<UserResumo[]>;
  listarTodos(): Promise<UserResumo[]>;
  buscarPorId(id: string): Promise<User | null>;
  buscarPorEmail(email: string): Promise<User | null>;
  salvar(user: User): Promise<void>;
  atualizar(user: User): Promise<void>;
}
