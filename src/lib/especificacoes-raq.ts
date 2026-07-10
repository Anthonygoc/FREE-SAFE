import type { ProdutoCombustivel } from '@/domain/entities/raq.entity';

const ROTULO_ASPECTO_CONFORME_GENERICO = 'Límpido e isento de impurezas';
const ROTULO_COR_CONFORME_GENERICO = 'Característica';

const ROTULOS_ASPECTO_CONFORME: Partial<Record<ProdutoCombustivel, string>> = {
  ETANOL_HIDRATADO: 'Límpido e isento de impurezas',
  GASOLINA_COMUM: 'Homogêneo, límpido e isento de impurezas',
  GASOLINA_ADITIVADA: 'Homogêneo, límpido e isento de impurezas',
  GASOLINA_PREMIUM: 'Homogêneo, límpido e isento de impurezas',
  DIESEL_S10: 'Homogêneo, límpido e isento de material particulado',
  DIESEL_S500: 'Homogêneo, límpido e isento de material particulado',
};

const ROTULOS_COR_CONFORME: Partial<Record<ProdutoCombustivel, string>> = {
  ETANOL_HIDRATADO: 'Sem coloração laranja ou azul',
  GASOLINA_COMUM: 'Sem coloração azul',
  GASOLINA_ADITIVADA: 'Sem coloração azul',
  GASOLINA_PREMIUM: 'Sem coloração azul',
  DIESEL_S10: 'De incolor a amarelado',
  DIESEL_S500: 'Vermelho',
};

export function rotuloAspectoConforme(produto?: ProdutoCombustivel | null): string {
  if (!produto) {
    return ROTULO_ASPECTO_CONFORME_GENERICO;
  }

  return ROTULOS_ASPECTO_CONFORME[produto] ?? ROTULO_ASPECTO_CONFORME_GENERICO;
}

export function rotuloCorConforme(produto?: ProdutoCombustivel | null): string {
  if (!produto) {
    return ROTULO_COR_CONFORME_GENERICO;
  }

  return ROTULOS_COR_CONFORME[produto] ?? ROTULO_COR_CONFORME_GENERICO;
}

export function formatAspecto(
  aspecto: string,
  produto?: ProdutoCombustivel | null,
): string {
  if (aspecto === 'LIQUIDO_E_ISENTO') {
    return rotuloAspectoConforme(produto);
  }

  const labels: Record<string, string> = {
    TURVO: 'Turvo',
    COM_IMPUREZAS: 'Com impurezas',
  };

  return labels[aspecto] ?? aspecto;
}

export function formatCor(
  cor: string,
  produto?: ProdutoCombustivel | null,
): string {
  if (cor === 'CARACTERISTICA') {
    return rotuloCorConforme(produto);
  }

  return cor === 'ALTERADA' ? 'Alterada' : cor;
}
