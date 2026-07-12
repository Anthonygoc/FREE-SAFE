import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

import type { Afericao } from '@/domain/entities/afericao.entity';
import type { AfericaoPdfPort } from '@/domain/ports/afericao-pdf.port';
import type { Posto } from '@/domain/ports/posto.repository';

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingRight: 28,
    paddingBottom: 28,
    paddingLeft: 28,
    fontSize: 9,
    color: '#18181B',
  },
  logo: {
    width: 150,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#F97316',
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 14,
  },
  infoBlock: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
  },
  infoRow: {
    marginBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F97316',
    color: '#FFFFFF',
    fontWeight: 700,
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#FDBA74',
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
  },
  rowInside: {
    backgroundColor: '#DCFCE7',
  },
  rowOutside: {
    backgroundColor: '#FEE2E2',
  },
  cell: {
    padding: 6,
    fontSize: 8.5,
    borderRightWidth: 1,
    borderRightColor: '#E4E4E7',
  },
  footer: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FAFAFA',
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
  },
  fotoSectionTitle: {
    color: '#F97316',
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 8,
  },
  fotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: 6,
  },
  fotoItem: {
    width: '31%',
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  fotoImagem: {
    width: 150,
    height: 110,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  fotoLabel: {
    marginTop: 4,
    fontSize: 8,
    textAlign: 'center',
    color: '#52525B',
  },
});

const columns = {
  bomba: '12%',
  bico: '12%',
  produto: '30%',
  resultado: '20%',
  situacao: '26%',
} as const;

interface FotoAfericaoItem {
  id: string;
  bomba: number;
  bico: number;
  src: string;
}

export class AfericaoPdfAdapter implements AfericaoPdfPort {
  async gerarRelatorioLote(afericoes: Afericao[], posto: Posto): Promise<Buffer> {
    const primeira = afericoes[0];
    const logoSrc = resolveLogoSrc(posto.logoUrl);
    const fotos = extractFotoAfericoes(afericoes);
    const foraDaTolerancia = afericoes.filter((item) => item.situacao === 'FORA_DA_TOLERANCIA').length;
    const responsavel = primeira?.responsavelNome ?? 'Responsável não identificado';
    const dataLote = primeira ? formatDateTime(primeira.criadoEm) : '';

    const renderAttempts = [
      { logoSrc, fotos },
      ...(fotos.length > 0 ? [{ logoSrc, fotos: [] as FotoAfericaoItem[] }] : []),
      ...(logoSrc ? [{ logoSrc: null, fotos }] : []),
      ...(logoSrc && fotos.length > 0 ? [{ logoSrc: null, fotos: [] as FotoAfericaoItem[] }] : []),
    ];

    let lastError: unknown;

    for (const attempt of renderAttempts) {
      try {
        return await renderToBuffer(
          buildDocument({
            afericoes,
            posto,
            responsavel,
            dataLote,
            foraDaTolerancia,
            logoSrc: attempt.logoSrc,
            fotos: attempt.fotos,
          }),
        );
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }
}

interface BuildDocumentParams {
  afericoes: Afericao[];
  posto: Posto;
  responsavel: string;
  dataLote: string;
  foraDaTolerancia: number;
  logoSrc: string | null;
  fotos: FotoAfericaoItem[];
}

function buildDocument({
  afericoes,
  posto,
  responsavel,
  dataLote,
  foraDaTolerancia,
  logoSrc,
  fotos,
}: BuildDocumentParams) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      ...(logoSrc ? [React.createElement(Image, { key: 'logo', src: logoSrc, style: styles.logo })] : []),
      React.createElement(Text, { key: 'title', style: styles.title }, 'RELATÓRIO DE AFERIÇÃO INMETRO'),
      React.createElement(
        View,
        { key: 'posto', style: styles.infoBlock },
        React.createElement(Text, { style: styles.infoTitle }, 'Dados do posto'),
        React.createElement(Text, { style: styles.infoRow }, `Razão social: ${posto.razaoSocial}`),
        React.createElement(Text, { style: styles.infoRow }, `CNPJ: ${posto.cnpj}`),
        React.createElement(Text, { style: styles.infoRow }, `Endereço: ${formatEndereco(posto.endereco, posto.cidade, posto.uf)}`),
      ),
      React.createElement(
        View,
        { key: 'lote', style: styles.infoBlock },
        React.createElement(Text, { style: styles.infoTitle }, 'Dados do lote'),
        React.createElement(Text, { style: styles.infoRow }, `Responsável: ${responsavel}`),
        React.createElement(Text, { style: styles.infoRow }, `Data/hora: ${dataLote}`),
        React.createElement(Text, { style: styles.infoRow }, `Total de bicos aferidos: ${afericoes.length}`),
      ),
      React.createElement(
        View,
        { key: 'table', style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.tableHeaderCell, { width: columns.bomba }] }, 'Bomba'),
          React.createElement(Text, { style: [styles.tableHeaderCell, { width: columns.bico }] }, 'Bico'),
          React.createElement(Text, { style: [styles.tableHeaderCell, { width: columns.produto }] }, 'Produto'),
          React.createElement(Text, { style: [styles.tableHeaderCell, { width: columns.resultado }] }, 'Resultado (mL)'),
          React.createElement(Text, { style: [{ ...styles.tableHeaderCell, width: columns.situacao, borderRightWidth: 0 }] }, 'Situação'),
        ),
        ...afericoes.map((afericao) =>
          React.createElement(
            View,
            {
              key: afericao.id,
              style: [
                styles.row,
                afericao.situacao === 'DENTRO_DA_LEGISLACAO' ? styles.rowInside : styles.rowOutside,
              ],
            },
            React.createElement(Text, { style: [styles.cell, { width: columns.bomba }] }, String(afericao.bomba)),
            React.createElement(Text, { style: [styles.cell, { width: columns.bico }] }, String(afericao.bico)),
            React.createElement(Text, { style: [styles.cell, { width: columns.produto }] }, formatProduto(afericao.produto)),
            React.createElement(Text, { style: [styles.cell, { width: columns.resultado }] }, formatResultado(afericao.resultadoMl)),
            React.createElement(Text, { style: [{ ...styles.cell, width: columns.situacao, borderRightWidth: 0 }] }, formatSituacao(afericao.situacao)),
          ),
        ),
      ),
      React.createElement(
        View,
        { key: 'footer', style: styles.footer },
        React.createElement(Text, { style: styles.footerTitle }, 'Resumo do lote'),
        React.createElement(Text, null, `Total de bicos aferidos: ${afericoes.length}`),
        React.createElement(Text, null, `Fora da tolerância: ${foraDaTolerancia}`),
      ),
      ...(fotos.length > 0
        ? [
            React.createElement(
              View,
              { key: 'photo-section', style: styles.infoBlock },
              React.createElement(Text, { style: styles.fotoSectionTitle }, 'REGISTRO FOTOGRÁFICO'),
              React.createElement(
                View,
                { style: styles.fotoGrid },
                ...fotos.map((foto) =>
                  React.createElement(
                    View,
                    { key: foto.id, style: styles.fotoItem },
                    React.createElement(Image, { src: foto.src, style: styles.fotoImagem }),
                    React.createElement(Text, { style: styles.fotoLabel }, `Bomba ${foto.bomba} · Bico ${foto.bico}`),
                  ),
                ),
              ),
            ),
          ]
        : []),
    ),
  );
}

function resolveLogoSrc(logoUrl?: string | null): string | null {
  const normalized = normalizeLogoSrc(logoUrl);
  if (normalized) {
    return normalized;
  }

  return resolveLocalFallbackLogoPath();
}

function normalizeLogoSrc(logoUrl?: string | null): string | null {
  const trimmed = logoUrl?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  return null;
}

function normalizeFotoSrc(fotoUrl?: string | null): string | null {
  const trimmed = fotoUrl?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  return null;
}

function extractFotoAfericoes(afericoes: Afericao[]): FotoAfericaoItem[] {
  return afericoes.flatMap((afericao) => {
    const src = normalizeFotoSrc(afericao.fotoUrl);
    if (!src) {
      return [];
    }

    return [{
      id: afericao.id,
      bomba: afericao.bomba,
      bico: afericao.bico,
      src,
    }];
  });
}

function resolveLocalFallbackLogoPath(): string | null {
  const fallbackPaths = [
    path.join(process.cwd(), 'public', 'logo.png'),
    path.join(process.cwd(), 'src', 'public', 'logo.png'),
  ];

  return fallbackPaths.find((logoPath) => fs.existsSync(logoPath)) ?? null;
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

function formatSituacao(situacao: string): string {
  return situacao === 'DENTRO_DA_LEGISLACAO' ? 'DENTRO' : 'FORA';
}

function formatResultado(resultadoMl: number): string {
  return `${resultadoMl.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} mL`;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
