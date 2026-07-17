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

// Limites ANP 907/2022 (revenda). Unidade da massa específica: kg/m³.
export const LIMITES_RAQ = {
  GASOLINA: {
    MASSA_20C_MIN: 715.0,
    TEOR_ETANOL_COMUM_ADITIVADA_MIN: 29.0,
    TEOR_ETANOL_COMUM_ADITIVADA_MAX: 31.0,
    TEOR_ETANOL_PREMIUM_MIN: 24.0,
    TEOR_ETANOL_PREMIUM_MAX: 26.0,
  },
  ETANOL_HIDRATADO: {
    MASSA_20C_MIN: 805.2,
    MASSA_20C_MAX: 811.2,
    TEOR_ALCOOLICO_MIN: 92.5,
    TEOR_ALCOOLICO_MAX: 94.6,
  },
  DIESEL_S10: {
    MASSA_20C_MIN: 815.0,
    MASSA_20C_MAX: 853.0,
  },
  DIESEL_S500: {
    MASSA_20C_MIN: 815.0,
    MASSA_20C_MAX: 865.0,
  },
} as const;

export interface AvaliarRAQProps {
  produto: ProdutoCombustivel;
  aspecto: AspectoCombustivel;
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorAlcoolico?: number;
  massa20c?: number;
}

export function calcularTeorEtanol(faseAquosa: number | undefined): number | undefined {
  if (faseAquosa === undefined || Number.isNaN(faseAquosa)) {
    return undefined;
  }

  return (faseAquosa - 50) * 2;
}

export function avaliarRAQ(props: AvaliarRAQProps): ResultadoAnalise {
  if (props.aspecto !== 'LIQUIDO_E_ISENTO' || props.cor !== 'CARACTERISTICA') {
    return 'REPROVADO';
  }

  switch (props.produto) {
    case 'GASOLINA_COMUM':
    case 'GASOLINA_ADITIVADA':
      return avaliarGasolina(
        props.faseAquosa,
        props.massa20c,
        LIMITES_RAQ.GASOLINA.TEOR_ETANOL_COMUM_ADITIVADA_MIN,
        LIMITES_RAQ.GASOLINA.TEOR_ETANOL_COMUM_ADITIVADA_MAX,
      );
    case 'GASOLINA_PREMIUM':
      return avaliarGasolina(
        props.faseAquosa,
        props.massa20c,
        LIMITES_RAQ.GASOLINA.TEOR_ETANOL_PREMIUM_MIN,
        LIMITES_RAQ.GASOLINA.TEOR_ETANOL_PREMIUM_MAX,
      );
    case 'ETANOL_HIDRATADO':
      return avaliarEtanol(props.teorAlcoolico, props.massa20c);
    case 'DIESEL_S10':
      return avaliarDiesel(
        props.massa20c,
        LIMITES_RAQ.DIESEL_S10.MASSA_20C_MIN,
        LIMITES_RAQ.DIESEL_S10.MASSA_20C_MAX,
      );
    case 'DIESEL_S500':
      return avaliarDiesel(
        props.massa20c,
        LIMITES_RAQ.DIESEL_S500.MASSA_20C_MIN,
        LIMITES_RAQ.DIESEL_S500.MASSA_20C_MAX,
      );
    default:
      return 'REPROVADO';
  }
}

function avaliarGasolina(
  faseAquosa: number | undefined,
  massa20c: number | undefined,
  min: number,
  max: number,
): ResultadoAnalise {
  if (massa20c === undefined || Number.isNaN(massa20c)) return 'REPROVADO';
  if (faseAquosa === undefined || Number.isNaN(faseAquosa)) return 'REPROVADO';
  if (massa20c < LIMITES_RAQ.GASOLINA.MASSA_20C_MIN) return 'REPROVADO';

  const teorEtanol = calcularTeorEtanol(faseAquosa);
  if (teorEtanol === undefined) return 'REPROVADO';

  return teorEtanol >= min && teorEtanol <= max ? 'APROVADO' : 'REPROVADO';
}

function avaliarEtanol(
  teorAlcoolico: number | undefined,
  massa20c: number | undefined,
): ResultadoAnalise {
  if (massa20c === undefined || Number.isNaN(massa20c)) return 'REPROVADO';
  if (teorAlcoolico === undefined || Number.isNaN(teorAlcoolico)) return 'REPROVADO';

  const massaDentroDaFaixa =
    massa20c >= LIMITES_RAQ.ETANOL_HIDRATADO.MASSA_20C_MIN &&
    massa20c <= LIMITES_RAQ.ETANOL_HIDRATADO.MASSA_20C_MAX;
  const teorDentroDaFaixa =
    teorAlcoolico >= LIMITES_RAQ.ETANOL_HIDRATADO.TEOR_ALCOOLICO_MIN &&
    teorAlcoolico <= LIMITES_RAQ.ETANOL_HIDRATADO.TEOR_ALCOOLICO_MAX;

  return massaDentroDaFaixa && teorDentroDaFaixa ? 'APROVADO' : 'REPROVADO';
}

function avaliarDiesel(
  massa20c: number | undefined,
  min: number,
  max: number,
): ResultadoAnalise {
  if (massa20c === undefined || Number.isNaN(massa20c)) return 'REPROVADO';

  return massa20c >= min && massa20c <= max ? 'APROVADO' : 'REPROVADO';
}

export interface CriarRAQProps {
  postoId: string;
  responsavelId: string;
  produto: ProdutoCombustivel;
  volumeRecebido?: number;
  temperaturaObservada: number;
  densidadeObservada: number;
  massa20c?: number;
  aspecto: AspectoCombustivel;
  cor: 'CARACTERISTICA' | 'ALTERADA';
  faseAquosa?: number;
  teorEtanol?: number;
  teorAlcoolico?: number;
  distribuidora?: string;
  cnpjDistribuidora?: string;
  transportador?: string;
  cnpjTransportador?: string;
  notaFiscal?: string;
  placaCaminhao?: string;
  nomeMotorista?: string;
  cpfMotorista?: string;
  tanqueDestino?: string;
  nomeAnalista?: string;
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
  readonly volumeRecebido?: number;
  readonly temperaturaObservada: number;
  readonly densidadeObservada: number;
  readonly massa20c?: number;
  readonly aspecto: AspectoCombustivel;
  readonly cor: 'CARACTERISTICA' | 'ALTERADA';
  readonly faseAquosa?: number;
  readonly teorEtanol?: number;
  readonly teorAlcoolico?: number;
  readonly distribuidora?: string;
  readonly cnpjDistribuidora?: string;
  readonly transportador?: string;
  readonly cnpjTransportador?: string;
  readonly notaFiscal?: string;
  readonly placaCaminhao?: string;
  readonly nomeMotorista?: string;
  readonly cpfMotorista?: string;
  readonly tanqueDestino?: string;
  readonly nomeAnalista?: string;
  readonly resultado: ResultadoAnalise;
  readonly boletimUrl?: string;
  readonly fotoProvetaUrl?: string;
  readonly criadoEm: Date;

  private constructor(props: ReconstituirRAQProps) {
    this.id = props.id;
    this.postoId = props.postoId;
    this.responsavelId = props.responsavelId;
    this.produto = props.produto;
    this.volumeRecebido = props.volumeRecebido;
    this.temperaturaObservada = props.temperaturaObservada;
    this.densidadeObservada = props.densidadeObservada;
    this.massa20c = props.massa20c;
    this.aspecto = props.aspecto;
    this.cor = props.cor;
    this.faseAquosa = props.faseAquosa;
    this.teorEtanol = props.teorEtanol;
    this.teorAlcoolico = props.teorAlcoolico;
    this.distribuidora = props.distribuidora;
    this.cnpjDistribuidora = props.cnpjDistribuidora;
    this.transportador = props.transportador;
    this.cnpjTransportador = props.cnpjTransportador;
    this.notaFiscal = props.notaFiscal;
    this.placaCaminhao = props.placaCaminhao;
    this.nomeMotorista = props.nomeMotorista;
    this.cpfMotorista = props.cpfMotorista;
    this.tanqueDestino = props.tanqueDestino;
    this.nomeAnalista = props.nomeAnalista;
    this.resultado = props.resultado;
    this.boletimUrl = props.boletimUrl;
    this.fotoProvetaUrl = props.fotoProvetaUrl;
    this.criadoEm = props.criadoEm;
  }

  static criar(props: CriarRAQProps): RAQ {
    if (!props.postoId) throw new CampoObrigatorioError('postoId');
    if (!props.responsavelId) throw new CampoObrigatorioError('responsavelId');

    const resultado = RAQ.calcularResultado(props);
    const teorEtanol =
      props.produto === 'GASOLINA_COMUM' ||
      props.produto === 'GASOLINA_ADITIVADA' ||
      props.produto === 'GASOLINA_PREMIUM'
        ? calcularTeorEtanol(props.faseAquosa)
        : props.teorEtanol;

    return new RAQ({
      ...props,
      teorEtanol,
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
    return avaliarRAQ({
      produto: props.produto,
      aspecto: props.aspecto,
      cor: props.cor,
      faseAquosa: props.faseAquosa,
      teorAlcoolico: props.teorAlcoolico,
      massa20c: props.massa20c,
    });
  }

}
