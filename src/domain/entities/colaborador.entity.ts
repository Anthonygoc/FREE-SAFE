import { DomainError } from '@/domain/errors/domain.errors';

export type StatusColaborador = 'ATIVO' | 'AFASTADO' | 'DESLIGADO';

export interface ColaboradorProps {
  id: string;
  postoId: string;
  userId?: string;
  nome: string;
  cpf: string;
  cargo: string;
  dataAdmissao: Date;
  status: StatusColaborador;
  turno?: string;
  escala?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  criadoEm: Date;
}

interface CriarColaboradorInput {
  postoId: string;
  userId?: string;
  nome: string;
  cpf: string;
  cargo: string;
  dataAdmissao: Date;
  status?: StatusColaborador;
  turno?: string;
  escala?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export class Colaborador {
  private constructor(private readonly props: ColaboradorProps) {}

  static criar(input: CriarColaboradorInput): Colaborador {
    if (!input.postoId?.trim()) {
      throw new DomainError('postoId é obrigatório');
    }

    if (!input.cpf?.trim()) {
      throw new DomainError('CPF é obrigatório');
    }

    return new Colaborador({
      id: crypto.randomUUID(),
      postoId: input.postoId,
      userId: input.userId,
      nome: input.nome,
      cpf: input.cpf,
      cargo: input.cargo,
      dataAdmissao: input.dataAdmissao,
      status: input.status ?? 'ATIVO',
      turno: input.turno,
      escala: input.escala,
      telefone: input.telefone,
      email: input.email,
      endereco: input.endereco,
      criadoEm: new Date(),
    });
  }

  static reconstituir(props: ColaboradorProps): Colaborador {
    if (!props.postoId?.trim()) {
      throw new DomainError('postoId é obrigatório');
    }

    if (!props.cpf?.trim()) {
      throw new DomainError('CPF é obrigatório');
    }

    return new Colaborador(props);
  }

  toJSON(): ColaboradorProps {
    return this.props;
  }

  get id() { return this.props.id; }
  get postoId() { return this.props.postoId; }
  get userId() { return this.props.userId; }
  get nome() { return this.props.nome; }
  get cpf() { return this.props.cpf; }
  get cargo() { return this.props.cargo; }
  get dataAdmissao() { return this.props.dataAdmissao; }
  get status() { return this.props.status; }
  get turno() { return this.props.turno; }
  get escala() { return this.props.escala; }
  get telefone() { return this.props.telefone; }
  get email() { return this.props.email; }
  get endereco() { return this.props.endereco; }
  get criadoEm() { return this.props.criadoEm; }
}
