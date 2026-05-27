import { DomainError } from '@/domain/errors/domain.errors';

export type TipoConteudo = 'PDF_TEXTO' | 'VIDEO_YOUTUBE' | 'TEXTO_RICO';

export interface CursoConteudoProps {
  id: string;
  cursoId: string;
  ordem: number;
  titulo: string;
  tipo: TipoConteudo;
  conteudo: string;
  criadoEm: Date;
}

export class CursoConteudo {
  private constructor(private readonly props: CursoConteudoProps) {}

  static reconstituir(props: CursoConteudoProps): CursoConteudo {
    if (!props.cursoId.trim()) {
      throw new DomainError('cursoId é obrigatório');
    }

    if (!props.titulo.trim()) {
      throw new DomainError('titulo é obrigatório');
    }

    return new CursoConteudo(props);
  }

  toJSON(): CursoConteudoProps {
    return this.props;
  }

  get id() { return this.props.id; }
  get cursoId() { return this.props.cursoId; }
  get ordem() { return this.props.ordem; }
  get titulo() { return this.props.titulo; }
  get tipo() { return this.props.tipo; }
  get conteudo() { return this.props.conteudo; }
  get criadoEm() { return this.props.criadoEm; }
}
