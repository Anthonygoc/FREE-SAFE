import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { CursoRepository } from '@/domain/ports/curso.repository';
import type { ProvaAttemptRepository } from '@/domain/ports/prova-attempt.repository';

export interface GetCursoByIdInput {
  usuario: UsuarioAutenticado;
  cursoId: string;
}

export interface GetCursoByIdOutput {
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

export class GetCursoByIdUseCase {
  constructor(
    private readonly cursoRepo: CursoRepository,
    private readonly colaboradorRepo: ColaboradorRepository,
    private readonly attemptRepo: ProvaAttemptRepository,
  ) {}

  async execute(input: GetCursoByIdInput): Promise<GetCursoByIdOutput> {
    autorizar(input.usuario, 'cursos', 'ver');

    const colaborador = await this.colaboradorRepo.buscarPorUserId(input.usuario.id);

    const curso = await this.cursoRepo.buscarPorIdComProgresso(input.cursoId, {
      cargo: colaborador?.cargo,
      colaboradorId: colaborador?.id,
    });

    if (!curso) {
      throw new DomainError('Curso não encontrado');
    }

    const ultimaTentativa = colaborador
      ? await this.attemptRepo.buscarUltimoPorColaboradorECurso(colaborador.id, input.cursoId)
      : null;

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
    };
  }
}
