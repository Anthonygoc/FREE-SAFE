import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import type { AlternativaQuestao } from '@/domain/entities/curso-questao.entity';
import { ProvaAttempt } from '@/domain/entities/prova-attempt.entity';
import { DomainError } from '@/domain/errors/domain.errors';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { CursoQuestaoRepository } from '@/domain/ports/curso-questao.repository';
import type { CursoRepository } from '@/domain/ports/curso.repository';
import type { ProvaAttemptRepository } from '@/domain/ports/prova-attempt.repository';
import type { TreinamentoRepository } from '@/domain/ports/treinamento.repository';

export interface SubmitProvaRespostaInput {
  questaoId: string;
  resposta: AlternativaQuestao;
}

export interface SubmitProvaInput {
  usuario: UsuarioAutenticado;
  cursoId: string;
  respostas: SubmitProvaRespostaInput[];
  colaboradorId?: string;
}

export interface SubmitProvaOutput {
  attemptId: string;
  nota: number;
  aprovado: boolean;
  acertos: number;
  total: number;
  detalhe: Array<{
    questaoId: string;
    respostaColaborador: AlternativaQuestao;
    correta: boolean;
  }>;
}

export class SubmitProvaUseCase {
  constructor(
    private readonly cursoRepo: CursoRepository,
    private readonly questaoRepo: CursoQuestaoRepository,
    private readonly attemptRepo: ProvaAttemptRepository,
    private readonly colaboradorRepo: ColaboradorRepository,
    private readonly treinamentoRepo: TreinamentoRepository,
  ) {}

  async execute(input: SubmitProvaInput): Promise<SubmitProvaOutput> {
    autorizar(input.usuario, 'cursos', 'criar');

    if (input.respostas.length === 0) {
      throw new DomainError('A prova precisa de ao menos uma resposta');
    }

    const colaborador = await this.resolverColaboradorAlvo(input);
    if (!colaborador) {
      throw new DomainError('Usuário não está vinculado a um colaborador');
    }

    const curso = await this.cursoRepo.buscarPorIdComProgresso(input.cursoId, {
      cargo: colaborador.cargo,
      colaboradorId: colaborador.id,
    });

    if (!curso || !curso.ativo) {
      throw new DomainError('Curso não encontrado');
    }

    if (!this.usuarioPodeSubmeter(input.usuario.perfil, curso.obrigatorio)) {
      throw new DomainError('Curso fora da trilha do colaborador');
    }

    const questoes = await this.questaoRepo.listarPorCurso(input.cursoId);
    if (questoes.length === 0) {
      throw new DomainError('Curso sem questões cadastradas');
    }

    const respostasPorQuestao = new Map<string, AlternativaQuestao>();
    for (const resposta of input.respostas) {
      if (respostasPorQuestao.has(resposta.questaoId)) {
        throw new DomainError('Não é permitido responder a mesma questão mais de uma vez');
      }

      respostasPorQuestao.set(resposta.questaoId, resposta.resposta);
    }

    const questoesPorId = new Map(questoes.map((questao) => [questao.id, questao]));

    for (const resposta of input.respostas) {
      if (!questoesPorId.has(resposta.questaoId)) {
        throw new DomainError('Resposta enviada para uma questão inválida');
      }
    }

    const respostasFaltantes = questoes.filter((questao) => !respostasPorQuestao.has(questao.id));
    if (respostasFaltantes.length > 0) {
      throw new DomainError('Todas as questões da prova devem ser respondidas');
    }

    const detalhe = questoes.map((questao) => {
      const respostaColaborador = respostasPorQuestao.get(questao.id);
      if (!respostaColaborador) {
        throw new DomainError('Resposta ausente para uma das questões');
      }

      return {
        questaoId: questao.id,
        respostaColaborador,
        correta: respostaColaborador === questao.gabarito,
      };
    });

    const acertos = detalhe.filter((item) => item.correta).length;
    const total = questoes.length;
    const nota = Number(((acertos / total) * 100).toFixed(2));
    const aprovado = nota >= 70;

    const attempt = ProvaAttempt.criar({
      colaboradorId: colaborador.id,
      cursoId: input.cursoId,
      nota,
      aprovado,
      respostas: detalhe.map((item) => ({
        questaoId: item.questaoId,
        resposta: item.respostaColaborador,
        correta: item.correta,
      })),
    });

    await this.attemptRepo.salvar(attempt);
    await this.treinamentoRepo.upsert({
      colaboradorId: colaborador.id,
      cursoId: input.cursoId,
      status: aprovado ? 'CONCLUIDO' : 'EM_ANDAMENTO',
      nota,
      dataConclusao: aprovado ? new Date() : undefined,
    });

    return {
      attemptId: attempt.id,
      nota,
      aprovado,
      acertos,
      total,
      detalhe,
    };
  }

  private async resolverColaboradorAlvo(input: SubmitProvaInput) {
    if ((input.usuario.perfil === 'ADMIN' || input.usuario.perfil === 'GERENTE') && input.colaboradorId) {
      return this.colaboradorRepo.buscarPorId(input.colaboradorId);
    }

    return this.colaboradorRepo.buscarPorUserId(input.usuario.id);
  }

  private usuarioPodeSubmeter(
    perfil: UsuarioAutenticado['perfil'],
    obrigatorio: boolean,
  ): boolean {
    if (perfil === 'ADMIN' || perfil === 'GERENTE') {
      return true;
    }

    return obrigatorio;
  }
}
