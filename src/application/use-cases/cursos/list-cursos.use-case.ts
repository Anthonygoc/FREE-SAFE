import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { CursoRepository } from '@/domain/ports/curso.repository';
import type { ProvaAttemptRepository } from '@/domain/ports/prova-attempt.repository';

export interface ListCursosInput {
  usuario: UsuarioAutenticado;
}

export interface ListCursosOutputItem {
  id: string;
  nome: string;
  descricao?: string;
  cargaHoraria?: number;
  validadeDias?: number;
  cargosObrigatorios: string[];
  obrigatorio: boolean;
  totalConteudos: number;
  totalQuestoes: number;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  progresso: number;
  nota?: number;
  dataConclusao?: Date;
  certificadoUrl?: string;
  ultimaTentativa?: {
    id: string;
    nota: number;
    aprovado: boolean;
    criadoEm: Date;
  };
}

export class ListCursosUseCase {
  constructor(
    private readonly cursoRepo: CursoRepository,
    private readonly colaboradorRepo: ColaboradorRepository,
    private readonly attemptRepo: ProvaAttemptRepository,
  ) {}

  async execute(input: ListCursosInput): Promise<ListCursosOutputItem[]> {
    const colaborador = await this.colaboradorRepo.buscarPorUserId(input.usuario.id);

    const [cursos, attempts] = await Promise.all([
      this.cursoRepo.listarAtivosComProgresso({
        cargo: colaborador?.cargo,
        colaboradorId: colaborador?.id,
      }),
      colaborador
        ? this.attemptRepo.listarPorColaborador(colaborador.id)
        : Promise.resolve([]),
    ]);

    const attemptsPorCurso = new Map<string, typeof attempts[number]>();
    for (const attempt of attempts) {
      if (!attemptsPorCurso.has(attempt.cursoId)) {
        attemptsPorCurso.set(attempt.cursoId, attempt);
      }
    }

    return cursos.map((curso) => {
      const ultimaTentativa = attemptsPorCurso.get(curso.id);
      const concluido = curso.treinamento?.status === 'CONCLUIDO' || ultimaTentativa?.aprovado === true;

      const status = curso.treinamento?.status === 'CONCLUIDO'
        ? 'CONCLUIDO'
        : ultimaTentativa
          ? (ultimaTentativa.aprovado ? 'CONCLUIDO' : 'EM_ANDAMENTO')
          : 'PENDENTE';

      return {
        id: curso.id,
        nome: curso.nome,
        descricao: curso.descricao,
        cargaHoraria: curso.cargaHoraria,
        validadeDias: curso.validadeDias,
        cargosObrigatorios: curso.cargosObrigatorios,
        obrigatorio: curso.obrigatorio,
        totalConteudos: curso.totalConteudos,
        totalQuestoes: curso.totalQuestoes,
        status,
        progresso: concluido ? 100 : 0,
        nota: curso.treinamento?.nota ?? ultimaTentativa?.nota,
        dataConclusao: curso.treinamento?.dataConclusao,
        certificadoUrl: curso.treinamento?.certificadoUrl ?? ultimaTentativa?.certificadoUrl,
        ultimaTentativa: ultimaTentativa
          ? {
              id: ultimaTentativa.id,
              nota: ultimaTentativa.nota,
              aprovado: ultimaTentativa.aprovado,
              criadoEm: ultimaTentativa.criadoEm,
            }
          : undefined,
      } satisfies ListCursosOutputItem;
    });
  }
}
