import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { CursoRepository } from '@/domain/ports/curso.repository';
import type { ProvaAttemptRepository } from '@/domain/ports/prova-attempt.repository';

export interface GetResultadoProvaInput {
  usuario: UsuarioAutenticado;
  cursoId: string;
  colaboradorId?: string;
}

export interface GetResultadoProvaOutput {
  tentativas: number;
  melhorNota: number;
  aprovado: boolean;
  ultimoAttemptId: string;
}

export class GetResultadoProvaUseCase {
  constructor(
    private readonly cursoRepo: CursoRepository,
    private readonly attemptRepo: ProvaAttemptRepository,
    private readonly colaboradorRepo: ColaboradorRepository,
  ) {}

  async execute(input: GetResultadoProvaInput): Promise<GetResultadoProvaOutput | null> {
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

    if (!this.usuarioPodeConsultar(input.usuario.perfil, curso.obrigatorio)) {
      throw new DomainError('Curso fora da trilha do colaborador');
    }

    const attempts = await this.attemptRepo.listarPorColaborador(colaborador.id);
    const attemptsCurso = attempts.filter((attempt) => attempt.cursoId === input.cursoId);

    if (attemptsCurso.length === 0) {
      return null;
    }

    const ultimoAttempt = attemptsCurso[0];
    const melhorNota = attemptsCurso.reduce((melhor, attempt) => Math.max(melhor, attempt.nota), 0);
    const aprovado = attemptsCurso.some((attempt) => attempt.aprovado);

    return {
      tentativas: attemptsCurso.length,
      melhorNota,
      aprovado,
      ultimoAttemptId: ultimoAttempt.id,
    };
  }

  private async resolverColaboradorAlvo(input: GetResultadoProvaInput) {
    if ((input.usuario.perfil === 'ADMIN' || input.usuario.perfil === 'GERENTE') && input.colaboradorId) {
      return this.colaboradorRepo.buscarPorId(input.colaboradorId);
    }

    return this.colaboradorRepo.buscarPorUserId(input.usuario.id);
  }

  private usuarioPodeConsultar(
    perfil: UsuarioAutenticado['perfil'],
    obrigatorio: boolean,
  ): boolean {
    if (perfil === 'ADMIN' || perfil === 'GERENTE') {
      return true;
    }

    return obrigatorio;
  }
}
