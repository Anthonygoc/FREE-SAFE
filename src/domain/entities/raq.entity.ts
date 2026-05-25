import { CampoObrigatorioError } from '@/domain/errors/domain.errors';

export type ProdutoCombustivel =
  | 'GASOLINA_COMUM'
  | 'GASOLINA_ADITIVADA'
  | 'GASOLINA_PREMIUM'
  | 'ETANOL_HIDRATADO'
  | 'DIESEL_S10'
  | 'DIESEL_S500';

export type ResultadoAnalise = 'APROVADO' | 'REPROVADO';

export type AspectoCombustivel = 'LIQUIDO_E_ISENTO' | 'TURVO' | 'COM_IMPUREZAS';

export interface CriarRAQProps {
  postoId: string;
  responsavelId: string;
  produto: ProdutoCombustivel;
  temperaturaObservada: number;
  densidadeObservada: number;
  aspecto: AspectoCombustivel;
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  tanqueDestino?: string;
}

export interface ReconstituirRAQProps extends CriarRAQProps {
  id: string;
  resultado: ResultadoAnalise;
  boletimUrl?: string;
  fotoProvetaUrl?: string;
  criadoEm: Date;
}

export class RAQ {
  readonly id: string;
  readonly postoId: string;
  readonly responsavelId: string;
  readonly produto: ProdutoCombustivel;
  readonly temperaturaObservada: number;
  readonly densidadeObservada: number;
  readonly aspecto: AspectoCombustivel;
  readonly cor: 'CARACTERISTICA' | 'ALTERADA';
  readonly faseAquosa?: number;
  readonly teorAlcoolico?: number;
  readonly distribuidora?: string;
  readonly notaFiscal?: string;
  readonly placaCaminhao?: string;
  readonly tanqueDestino?: string;
  readonly resultado: ResultadoAnalise;
  readonly boletimUrl?: string;
  readonly fotoProvetaUrl?: string;
  readonly criadoEm: Date;

  private constructor(props: ReconstituirRAQProps) {
    this.id = props.id;
    this.postoId = props.postoId;
    this.responsavelId = props.responsavelId;
    this.produto = props.produto;
    this.temperaturaObservada = props.temperaturaObservada;
    this.densidadeObservada = props.densidadeObservada;
    this.aspecto = props.aspecto;
    this.cor = props.cor;
    this.faseAquosa = props.faseAquosa;
    this.teorAlcoolico = props.teorAlcoolico;
    this.distribuidora = props.distribuidora;
    this.notaFiscal = props.notaFiscal;
    this.placaCaminhao = props.placaCaminhao;
    this.tanqueDestino = props.tanqueDestino;
    this.resultado = props.resultado;
    this.boletimUrl = props.boletimUrl;
    this.fotoProvetaUrl = props.fotoProvetaUrl;
    this.criadoEm = props.criadoEm;
  }

  static criar(props: CriarRAQProps): RAQ {
    if (!props.postoId) throw new CampoObrigatorioError('postoId');
    if (!props.responsavelId) throw new CampoObrigatorioError('responsavelId');

    const resultado = RAQ.calcularResultado(props);

    return new RAQ({
      ...props,
      id: crypto.randomUUID(),
      resultado,
      criadoEm: new Date(),
    });
  }

  static reconstituir(props: ReconstituirRAQProps): RAQ {
    return new RAQ(props);
  }

  get estaAprovado(): boolean {
    return this.resultado === 'APROVADO';
  }

  private static calcularResultado(props: CriarRAQProps): ResultadoAnalise {
    if (props.aspecto !== 'LIQUIDO_E_ISENTO' || props.cor !== 'CARACTERISTICA') {
      return 'REPROVADO';
    }

    switch (props.produto) {
      case 'GASOLINA_COMUM':
      case 'GASOLINA_ADITIVADA':
        return RAQ.avaliarGasolina(props.faseAquosa, 29, 31);
      case 'GASOLINA_PREMIUM':
        return RAQ.avaliarGasolina(props.faseAquosa, 24, 26);
      case 'ETANOL_HIDRATADO':
        return RAQ.avaliarEtanol(props.teorAlcoolico);
      case 'DIESEL_S10':
        return RAQ.avaliarDiesel(props.densidadeObservada, 0.815, 0.853);
      case 'DIESEL_S500':
        return RAQ.avaliarDiesel(props.densidadeObservada, 0.815, 0.865);
      default:
        return 'REPROVADO';
    }
  }

  private static avaliarGasolina(
    faseAquosa: number | undefined,
    min: number,
    max: number,
  ): ResultadoAnalise {
    if (faseAquosa === undefined || isNaN(faseAquosa)) return 'REPROVADO';

    const teorEtanol = (faseAquosa - 50) * 2 + 1;
    return teorEtanol >= min && teorEtanol <= max ? 'APROVADO' : 'REPROVADO';
  }

  private static avaliarEtanol(teorAlcoolico: number | undefined): ResultadoAnalise {
    if (teorAlcoolico === undefined || isNaN(teorAlcoolico)) return 'REPROVADO';

    return teorAlcoolico >= 92.5 && teorAlcoolico <= 95.4 ? 'APROVADO' : 'REPROVADO';
  }

  private static avaliarDiesel(
    densidadeObservada: number,
    min: number,
    max: number,
  ): ResultadoAnalise {
    if (isNaN(densidadeObservada)) return 'REPROVADO';

    return densidadeObservada >= min && densidadeObservada <= max ? 'APROVADO' : 'REPROVADO';
  }
}
