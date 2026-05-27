import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError } from '@/domain/errors/domain.errors';
import type { CursoConteudoRepository } from '@/domain/ports/curso-conteudo.repository';
import type { CursoRepository } from '@/domain/ports/curso.repository';

export interface GetCursoConteudoInput {
  usuario: UsuarioAutenticado;
  cursoId: string;
}

export interface GetCursoConteudoOutput {
  curso: {
    id: string;
    nome: string;
    descricao?: string;
  };
  conteudos: Array<{
    id: string;
    cursoId: string;
    ordem: number;
    titulo: string;
    tipo: 'PDF_TEXTO' | 'VIDEO_YOUTUBE' | 'TEXTO_RICO';
    conteudo: string;
    criadoEm: Date;
  }>;
}

export class GetCursoConteudoUseCase {
  constructor(
    private readonly cursoRepo: CursoRepository,
    private readonly conteudoRepo: CursoConteudoRepository,
  ) {}

  async execute(input: GetCursoConteudoInput): Promise<GetCursoConteudoOutput> {
    const curso = await this.cursoRepo.buscarPorId(input.cursoId);

    if (!curso || !curso.ativo) {
      throw new DomainError('Curso não encontrado');
    }

    const conteudos = await this.conteudoRepo.listarPorCurso(input.cursoId);

    return {
      curso: {
        id: curso.id,
        nome: curso.nome,
        descricao: curso.descricao,
      },
      conteudos: conteudos.map((conteudo) => conteudo.toJSON()),
    };
  }
}
