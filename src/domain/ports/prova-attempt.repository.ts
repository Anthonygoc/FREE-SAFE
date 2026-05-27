import type { ProvaAttempt } from '@/domain/entities/prova-attempt.entity';

export interface ProvaAttemptRepository {
  salvar(attempt: ProvaAttempt): Promise<void>;
  buscarUltimoPorColaboradorECurso(colaboradorId: string, cursoId: string): Promise<ProvaAttempt | null>;
  listarPorColaborador(colaboradorId: string): Promise<ProvaAttempt[]>;
}
