import ExcelJS, { type Cell, type Fill } from 'exceljs';

import type { UsuarioAutenticado } from '@/application/dtos/auth.dto';
import { DomainError, UnauthorizedError } from '@/domain/errors/domain.errors';
import type { AfericaoRepository } from '@/domain/ports/afericao.repository';
import type { PostoRepository } from '@/domain/ports/posto.repository';

export interface EmitAfericaoXlsxInput {
  usuario: UsuarioAutenticado;
  loteId: string;
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

const INSIDE_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDCFCE7' },
};

const OUTSIDE_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFEE2E2' },
};

export class EmitAfericaoXlsxUseCase {
  constructor(
    private readonly afericaoRepo: AfericaoRepository,
    private readonly postoRepo: PostoRepository,
  ) {}

  async execute(input: EmitAfericaoXlsxInput): Promise<Buffer> {
    if (input.usuario.perfil !== 'ADMIN' && input.usuario.perfil !== 'GERENTE') {
      throw new UnauthorizedError();
    }

    const afericoes = await this.afericaoRepo.listarPorLote(input.loteId);
    if (afericoes.length === 0) {
      throw new DomainError('Lote de aferições não encontrado');
    }

    const postoId = afericoes[0].postoId;
    if (input.usuario.perfil === 'GERENTE' && input.usuario.postoId !== postoId) {
      throw new UnauthorizedError('Gerente só pode emitir planilha de aferições do próprio posto');
    }

    const posto = await this.postoRepo.buscarPorId(postoId);
    if (!posto) {
      throw new DomainError('Posto das aferições não encontrado');
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Aferição');

    sheet.columns = [
      { width: 14 },
      { width: 14 },
      { width: 24 },
      { width: 18 },
      { width: 20 },
      { width: 28 },
      { width: 22 },
    ];

    const rows: Array<[string, string]> = [
      ['POSTOS FREE', ''],
      ['RELATÓRIO DE AFERIÇÃO INMETRO', ''],
      ['', ''],
      ['RAZÃO SOCIAL:', posto.razaoSocial],
      ['CNPJ:', posto.cnpj],
      ['ENDEREÇO:', `${posto.endereco} ${posto.cidade}/${posto.uf}`],
      ['LOTE:', input.loteId],
      ['RESPONSÁVEL:', afericoes[0].responsavelNome ?? 'Responsável não identificado'],
      ['DATA/HORA DO LOTE:', formatDateTime(afericoes[0].criadoEm)],
    ];

    rows.forEach(([label, value], index) => {
      const rowNumber = index + 1;
      sheet.getCell(`A${rowNumber}`).value = label;
      sheet.getCell(`B${rowNumber}`).value = value;
    });

    sheet.mergeCells('A1:G1');
    sheet.mergeCells('A2:G2');

    applyMergedTitleStyle(sheet.getCell('A1'), sheet.getCell('G1'));
    applyMergedSectionStyle(sheet.getCell('A2'), sheet.getCell('G2'));

    for (const rowNumber of [4, 5, 6, 7, 8, 9]) {
      applyLabelStyle(sheet.getCell(`A${rowNumber}`));
      applyValueStyle(sheet.getCell(`B${rowNumber}`));
    }

    const headerRow = 11;
    const headers = ['Bomba', 'Bico', 'Produto', 'Resultado (mL)', 'Situação', 'Responsável', 'Data/Hora'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(headerRow, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = GRAY_FILL;
      cell.border = THIN_BLACK_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    afericoes.forEach((afericao, index) => {
      const rowNumber = headerRow + index + 1;
      const row = sheet.getRow(rowNumber);
      row.values = [
        '',
        afericao.bomba,
        afericao.bico,
        formatProduto(afericao.produto),
        afericao.resultadoMl,
        formatSituacao(afericao.situacao),
        afericao.responsavelNome ?? '',
        formatDateTime(afericao.criadoEm),
      ];

      const fill = afericao.situacao === 'DENTRO_DA_LEGISLACAO' ? INSIDE_FILL : OUTSIDE_FILL;
      for (let column = 1; column <= 7; column += 1) {
        const cell = row.getCell(column);
        cell.fill = fill;
        cell.border = THIN_BLACK_BORDER;
        cell.alignment = { vertical: 'middle', horizontal: column <= 2 ? 'center' : 'left' };
      }
    });

    const summaryRow = headerRow + afericoes.length + 2;
    const foraDaTolerancia = afericoes.filter((item) => item.situacao === 'FORA_DA_TOLERANCIA').length;
    sheet.getCell(`A${summaryRow}`).value = 'Resumo';
    sheet.getCell(`A${summaryRow}`).font = { bold: true };
    sheet.getCell(`A${summaryRow + 1}`).value = `Total de bicos aferidos: ${afericoes.length}`;
    sheet.getCell(`A${summaryRow + 2}`).value = `Fora da tolerância: ${foraDaTolerancia}`;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

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

function formatSituacao(situacao: string): string {
  return situacao === 'DENTRO_DA_LEGISLACAO' ? 'DENTRO' : 'FORA';
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
