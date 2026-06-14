import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { ColaboradorRepository } from '@/domain/ports/colaborador.repository';
import type { CursoQuestaoRepository } from '@/domain/ports/curso-questao.repository';
import type { CursoRepository } from '@/domain/ports/curso.repository';

export interface GetCursoQuestoesInput {
  usuario: UsuarioAutenticado;
  cursoId: string;
}

export interface GetCursoQuestoesOutputItem {
  id: string;
  ordem: number;
  enunciado: string;
  alternativas: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

export class GetCursoQuestoesUseCase {
  constructor(
    private readonly cursoRepo: CursoRepository,
    private readonly questaoRepo: CursoQuestaoRepository,
    private readonly colaboradorRepo: ColaboradorRepository,
  ) {}

  async execute(input: GetCursoQuestoesInput): Promise<GetCursoQuestoesOutputItem[]> {
    autorizar(input.usuario, 'cursos', 'ver');

    const colaborador = await this.colaboradorRepo.buscarPorUserId(input.usuario.id);
    const curso = await this.cursoRepo.buscarPorIdComProgresso(input.cursoId, {
      cargo: colaborador?.cargo,
      colaboradorId: colaborador?.id,
    });

    if (!curso || !curso.ativo) {
      throw new DomainError('Curso não encontrado');
    }

    if (!this.usuarioPodeAcessarQuestoes(input.usuario.perfil, colaborador?.cargo, curso.obrigatorio)) {
      throw new DomainError('Curso fora da trilha do colaborador');
    }

    const questoes = await this.questaoRepo.listarPorCurso(input.cursoId);

    return questoes.map((questao) => ({
      id: questao.id,
      ordem: questao.ordem,
      enunciado: questao.enunciado,
      alternativas: questao.alternativas,
    }));
  }

  private usuarioPodeAcessarQuestoes(
    perfil: UsuarioAutenticado['perfil'],
    cargo: string | undefined,
    obrigatorio: boolean,
  ): boolean {
    if (perfil === 'ADMIN' || perfil === 'GERENTE') {
      return true;
    }

    return Boolean(cargo) && obrigatorio;
  }
}
