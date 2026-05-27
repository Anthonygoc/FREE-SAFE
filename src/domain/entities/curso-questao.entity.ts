import { DomainError } from '@/domain/errors/domain.errors';

export type AlternativaQuestao = 'A' | 'B' | 'C' | 'D';

export interface CursoQuestaoAlternativas {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface CursoQuestaoProps {
  id: string;
  cursoId: string;
  ordem: number;
  enunciado: string;
  alternativas: CursoQuestaoAlternativas;
  gabarito: AlternativaQuestao;
  criadoEm: Date;
}

export class CursoQuestao {
  private constructor(private readonly props: CursoQuestaoProps) {}

  static reconstituir(props: CursoQuestaoProps): CursoQuestao {
    if (!props.cursoId.trim()) {
      throw new DomainError('cursoId é obrigatório');
    }

    if (!props.enunciado.trim()) {
      throw new DomainError('enunciado é obrigatório');
    }

    return new CursoQuestao(props);
  }

  toJSON(): CursoQuestaoProps {
    return this.props;
  }

  get id() { return this.props.id; }
  get cursoId() { return this.props.cursoId; }
  get ordem() { return this.props.ordem; }
  get enunciado() { return this.props.enunciado; }
  get alternativas() { return this.props.alternativas; }
  get gabarito() { return this.props.gabarito; }
  get criadoEm() { return this.props.criadoEm; }
}
