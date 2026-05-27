import type { CursoQuestao } from '@/domain/entities/curso-questao.entity';

export interface CursoQuestaoRepository {
  listarPorCurso(cursoId: string): Promise<CursoQuestao[]>;
}
