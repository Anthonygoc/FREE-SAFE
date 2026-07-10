import ExcelJS, { type Cell, type Fill } from 'exceljs';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { autorizar } from '@/application/shared/authorize';
import { DomainError } from '@/domain/errors/domain.errors';
import type { PostoRepository } from '@/domain/ports/posto.repository';
import type { RAQRepository } from '@/domain/ports/raq.repository';
import { formatAspecto, formatCor } from '@/lib/especificacoes-raq';

export interface EmitRAQXlsxInput {
  usuario: UsuarioAutenticado;
  raqId: string;
}

const THIN_BLACK_BORDER = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } },
} as const;

const WHITE_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFFFF' },
};

const GRAY_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF595959' },
};

const APPROVED_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF16A34A' },
};

const REPROVED_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDC2626' },
};

export class EmitRAQXlsxUseCase {
  constructor(
    private readonly raqRepo: RAQRepository,
    private readonly postoRepo: PostoRepository,
  ) {}

  async execute(input: EmitRAQXlsxInput): Promise<Buffer> {
    const raq = await this.raqRepo.buscarPorId(input.raqId);
    if (!raq) {
      throw new DomainError('RAQ não encontrada');
    }

    autorizar(input.usuario, 'anp', 'ver', raq.postoId);

    const posto = await this.postoRepo.buscarPorId(raq.postoId);
    if (!posto) {
      throw new DomainError('Posto da RAQ não encontrado');
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('RAQ');

    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 45;

    const rows: Array<[string, string]> = [
      ['POSTOS FREE', ''],
      ['REGISTRO DE ANÁLISE DE QUALIDADE', ''],
      ['', ''],
      ['DADOS DO POSTO REVENDEDOR', ''],
      ['RAZÃO SOCIAL DO POSTO REVENDEDOR:', posto.razaoSocial],
      ['CNPJ DO POSTO REVENDEDOR:', posto.cnpj],
      ['ENDEREÇO DO POSTO REVENDEDOR:', formatEndereco(posto.endereco, posto.cidade, posto.uf)],
      ['', ''],
      ['DADOS DO RECEBIMENTO', ''],
      ['PRODUTO:', formatProduto(raq.produto)],
      ['VOLUME RECEBIDO (Litros):', formatNumber(raq.volumeRecebido)],
      ['DATA DA COLETA:', formatDate(raq.criadoEm)],
      ['DISTRIBUIDOR:', raq.distribuidora ?? ''],
      ['CNPJ DO DISTRIBUIDOR:', raq.cnpjDistribuidora ?? ''],
      ['TRANSPORTADOR:', raq.transportador ?? ''],
      ['CNPJ DO TRANSPORTADOR:', raq.cnpjTransportador ?? ''],
      ['NOTA FISCAL DO PRODUTO:', raq.notaFiscal ?? ''],
      ['PLACA DO CAMINHÃO REBOQUE:', raq.placaCaminhao ?? ''],
      ['NOME DO MOTORISTA:', raq.nomeMotorista ?? ''],
      ['CPF DO MOTORISTA:', raq.cpfMotorista ?? ''],
      ['ASSINATURA DO MOTORISTA:', '________'],
      ['NOME DO ANALISTA:', raq.nomeAnalista ?? ''],
      ['', ''],
      ['RESULTADO DA ANÁLISE', ''],
      ['ASPECTO:', formatAspecto(raq.aspecto, raq.produto)],
      ['COR:', formatCor(raq.cor, raq.produto)],
      ['DENSIDADE RELATIVA:', formatDecimal(raq.densidadeObservada)],
      ['TEMPERATURA:', formatDecimal(raq.temperaturaObservada)],
      ['MASSA ESPECÍFICA A 20°C:', formatDecimal(raq.massa20c)],
      ['TEOR DE ÁLCOOL NA GASOLINA:', formatPercentForGasolina(raq.produto, raq.teorEtanol)],
      ['TEOR ALCOÓLICO NO AEHC:', formatPercentForEtanol(raq.produto, raq.teorAlcoolico)],
      ['RESULTADO FINAL:', raq.resultado],
      ['RESPONSÁVEL PELO PREENCHIMENTO:', raq.nomeAnalista ?? ''],
      ['ASSINATURA:', '________'],
    ];

    rows.forEach(([label, value], index) => {
      const rowNumber = index + 1;
      sheet.getCell(`A${rowNumber}`).value = label;
      sheet.getCell(`B${rowNumber}`).value = value;
    });

    for (const range of ['A1:B1', 'A2:B2', 'A4:B4', 'A9:B9', 'A24:B24']) {
      sheet.mergeCells(range);
    }

    applyMergedTitleStyle(sheet.getCell('A1'), sheet.getCell('B1'));
    applyMergedSectionStyle(sheet.getCell('A2'), sheet.getCell('B2'));
    applyMergedSectionStyle(sheet.getCell('A4'), sheet.getCell('B4'));
    applyMergedSectionStyle(sheet.getCell('A9'), sheet.getCell('B9'));
    applyMergedSectionStyle(sheet.getCell('A24'), sheet.getCell('B24'));

    for (const rowNumber of DATA_ROW_NUMBERS) {
      applyLabelStyle(sheet.getCell(`A${rowNumber}`));
      applyValueStyle(sheet.getCell(`B${rowNumber}`));
    }

    applyResultStyle(sheet.getCell('B32'), raq.resultado);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

const DATA_ROW_NUMBERS = [
  5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34,
];

function applyMergedTitleStyle(leftCell: Cell, rightCell: Cell) {
  for (const cell of [leftCell, rightCell]) {
    cell.font = {
      bold: true,
      size: 16,
      color: { argb: 'FFE85C0D' },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
  }
}

function applyMergedSectionStyle(leftCell: Cell, rightCell: Cell) {
  for (const cell of [leftCell, rightCell]) {
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.fill = GRAY_FILL;
    cell.border = THIN_BLACK_BORDER;
  }
}

function applyLabelStyle(cell: Cell) {
  cell.font = {
    bold: true,
    color: { argb: 'FF000000' },
  };
  cell.alignment = {
    vertical: 'middle',
    wrapText: true,
  };
  cell.fill = WHITE_FILL;
  cell.border = THIN_BLACK_BORDER;
}

function applyValueStyle(cell: Cell) {
  cell.font = {
    bold: false,
    color: { argb: 'FF000000' },
  };
  cell.alignment = {
    vertical: 'middle',
    wrapText: true,
  };
  cell.fill = WHITE_FILL;
  cell.border = THIN_BLACK_BORDER;
}

function applyResultStyle(cell: Cell, resultado: 'APROVADO' | 'REPROVADO') {
  cell.font = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  cell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };
  cell.fill = resultado === 'APROVADO' ? APPROVED_FILL : REPROVED_FILL;
  cell.border = THIN_BLACK_BORDER;
}

function formatEndereco(endereco: string, cidade: string, uf: string): string {
  return `${endereco} ${cidade}/${uf}`;
}

function formatProduto(produto: string): string {
  const labels: Record<string, string> = {
    GASOLINA_COMUM: 'Gasolina Comum',
    GASOLINA_ADITIVADA: 'Gasolina Aditivada',
    GASOLINA_PREMIUM: 'Gasolina Premium',
    ETANOL_HIDRATADO: 'Etanol Hidratado',
    DIESEL_S10: 'Diesel S10',
    DIESEL_S500: 'Diesel S500',
  };

  return labels[produto] ?? produto;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatNumber(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

function formatDecimal(value: number | undefined): string {
  if (value === undefined) {
    return '';
  }

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function formatPercentForGasolina(produto: string, value: number | undefined): string {
  if (!['GASOLINA_COMUM', 'GASOLINA_ADITIVADA', 'GASOLINA_PREMIUM'].includes(produto)) {
    return '';
  }

  return formatPercent(value);
}

function formatPercentForEtanol(produto: string, value: number | undefined): string {
  if (produto !== 'ETANOL_HIDRATADO') {
    return '';
  }

  return formatPercent(value);
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) {
    return '';
  }

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}
