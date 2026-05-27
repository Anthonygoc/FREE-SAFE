import { DomainError } from '@/domain/errors/domain.errors';
import type { AlternativaQuestao } from '@/domain/entities/curso-questao.entity';

export interface ProvaRespostaProps {
  id: string;
  attemptId: string;
  questaoId: string;
  resposta: AlternativaQuestao;
  correta: boolean;
}

export interface ProvaAttemptProps {
  id: string;
  colaboradorId: string;
  cursoId: string;
  nota: number;
  aprovado: boolean;
  certificadoUrl?: string;
  criadoEm: Date;
  respostas: ProvaRespostaProps[];
}

interface CriarProvaAttemptInput {
  colaboradorId: string;
  cursoId: string;
  nota: number;
  aprovado: boolean;
  certificadoUrl?: string;
  respostas: Array<Omit<ProvaRespostaProps, 'id' | 'attemptId'>>;
}

export class ProvaAttempt {
  private constructor(private readonly props: ProvaAttemptProps) {}

  static criar(input: CriarProvaAttemptInput): ProvaAttempt {
    if (!input.colaboradorId.trim()) {
      throw new DomainError('colaboradorId é obrigatório');
    }

    if (!input.cursoId.trim()) {
      throw new DomainError('cursoId é obrigatório');
    }

    const id = crypto.randomUUID();

    return new ProvaAttempt({
      id,
      colaboradorId: input.colaboradorId,
      cursoId: input.cursoId,
      nota: input.nota,
      aprovado: input.aprovado,
      certificadoUrl: input.certificadoUrl,
      criadoEm: new Date(),
      respostas: input.respostas.map((resposta) => ({
        id: crypto.randomUUID(),
        attemptId: id,
        questaoId: resposta.questaoId,
        resposta: resposta.resposta,
        correta: resposta.correta,
      })),
    });
  }

  static reconstituir(props: ProvaAttemptProps): ProvaAttempt {
    if (!props.colaboradorId.trim()) {
      throw new DomainError('colaboradorId é obrigatório');
    }

    if (!props.cursoId.trim()) {
      throw new DomainError('cursoId é obrigatório');
    }

    return new ProvaAttempt(props);
  }

  toJSON(): ProvaAttemptProps {
    return this.props;
  }

  get id() { return this.props.id; }
  get colaboradorId() { return this.props.colaboradorId; }
  get cursoId() { return this.props.cursoId; }
  get nota() { return this.props.nota; }
  get aprovado() { return this.props.aprovado; }
  get certificadoUrl() { return this.props.certificadoUrl; }
  get criadoEm() { return this.props.criadoEm; }
  get respostas() { return this.props.respostas; }
}
