import { CampoObrigatorioError } from '@/domain/errors/domain.errors';
import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';

export type SituacaoAfericao = 'DENTRO_DA_LEGISLACAO' | 'FORA_DA_TOLERANCIA';

export interface CriarAfericaoProps {
  postoId: string;
  responsavelId: string;
  bicoId?: string;
  produto: ProdutoCombustivel;
  bomba: number;
  bico: number;
  medidaPadrao?: number;
  resultadoMl: number;
  observacoes?: string;
  fotoUrl?: string;
}

export interface ReconstituirAfericaoProps extends Omit<CriarAfericaoProps, 'medidaPadrao'> {
  id: string;
  medidaPadrao: number;
  situacao: SituacaoAfericao;
  criadoEm: Date;
}

export class Afericao {
  readonly id: string;
  readonly postoId: string;
  readonly responsavelId: string;
  readonly bicoId?: string;
  readonly produto: ProdutoCombustivel;
  readonly bomba: number;
  readonly bico: number;
  readonly medidaPadrao: number;
  readonly resultadoMl: number;
  readonly situacao: SituacaoAfericao;
  readonly observacoes?: string;
  readonly fotoUrl?: string;
  readonly criadoEm: Date;

  private constructor(props: ReconstituirAfericaoProps) {
    this.id = props.id;
    this.postoId = props.postoId;
    this.responsavelId = props.responsavelId;
    this.bicoId = props.bicoId;
    this.produto = props.produto;
    this.bomba = props.bomba;
    this.bico = props.bico;
    this.medidaPadrao = props.medidaPadrao;
    this.resultadoMl = props.resultadoMl;
    this.situacao = props.situacao;
    this.observacoes = props.observacoes;
    this.fotoUrl = props.fotoUrl;
    this.criadoEm = props.criadoEm;
  }

  static criar(props: CriarAfericaoProps): Afericao {
    if (!props.postoId) throw new CampoObrigatorioError('postoId');
    if (!props.responsavelId) throw new CampoObrigatorioError('responsavelId');

    const situacao = Afericao.calcularSituacao(props.resultadoMl);

    return new Afericao({
      ...props,
      id: crypto.randomUUID(),
      medidaPadrao: props.medidaPadrao ?? 20,
      situacao,
      criadoEm: new Date(),
    });
  }

  static reconstituir(props: ReconstituirAfericaoProps): Afericao {
    if (!props.postoId) throw new CampoObrigatorioError('postoId');
    if (!props.responsavelId) throw new CampoObrigatorioError('responsavelId');

    return new Afericao(props);
  }

  private static calcularSituacao(resultadoMl: number): SituacaoAfericao {
    return resultadoMl >= -100 && resultadoMl <= 100
      ? 'DENTRO_DA_LEGISLACAO'
      : 'FORA_DA_TOLERANCIA';
  }
}
