import type { CursoConteudo } from '@/domain/entities/curso-conteudo.entity';

export interface CursoConteudoRepository {
  listarPorCurso(cursoId: string): Promise<CursoConteudo[]>;
  buscarPorId(id: string): Promise<CursoConteudo | null>;
}
