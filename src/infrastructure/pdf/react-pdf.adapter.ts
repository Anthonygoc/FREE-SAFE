import React from 'react';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

import type { RAQ } from '@/domain/entities/raq.entity';
import type { PDFPort } from '@/domain/ports/pdf.port';
import type { Posto } from '@/domain/ports/posto.repository';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: '2 solid #f97316',
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f97316',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginTop: 12,
    border: '1 solid #e5e7eb',
    padding: 10,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#f97316',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 12,
  },
  label: {
    fontWeight: 700,
  },
  value: {
    color: '#111827',
  },
  resultBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 4,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
    color: '#ffffff',
  },
  resultText: {
    fontSize: 11,
    color: '#ffffff',
  },
  footer: {
    marginTop: 20,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
  },
});

function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(data);
}

function produtoLabel(produto: RAQ['produto']): string {
  return produto.replaceAll('_', ' ');
}

export class ReactPDFAdapter implements PDFPort {
  async gerarRAQ(raq: RAQ, posto: Posto): Promise<Buffer> {
    const aprovado = raq.resultado === 'APROVADO';
    const resultadoCor = aprovado ? '#16a34a' : '#dc2626';

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(Text, { style: styles.brand }, 'FREE SAFE'),
          React.createElement(Text, { style: styles.subtitle }, 'Relatório de Análise de Qualidade (RAQ)'),
        ),

        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Dados do Posto'),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'Nome: '), React.createElement(Text, { style: styles.value }, posto.nome)),
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'CNPJ: '), React.createElement(Text, { style: styles.value }, posto.cnpj)),
          ),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'Razão social: '), React.createElement(Text, { style: styles.value }, posto.razaoSocial)),
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'Cidade/UF: '), React.createElement(Text, { style: styles.value }, `${posto.cidade}/${posto.uf}`)),
          ),
        ),

        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, 'Dados da Análise'),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'RAQ ID: '), React.createElement(Text, { style: styles.value }, raq.id)),
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'Produto: '), React.createElement(Text, { style: styles.value }, produtoLabel(raq.produto))),
          ),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'Temperatura: '), React.createElement(Text, { style: styles.value }, `${raq.temperaturaObservada} ºC`)),
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'Densidade: '), React.createElement(Text, { style: styles.value }, String(raq.densidadeObservada))),
          ),
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'Aspecto: '), React.createElement(Text, { style: styles.value }, raq.aspecto)),
            React.createElement(Text, null, React.createElement(Text, { style: styles.label }, 'Cor: '), React.createElement(Text, { style: styles.value }, raq.cor)),
          ),
        ),

        React.createElement(
          View,
          { style: [styles.resultBox, { backgroundColor: resultadoCor }] },
          React.createElement(Text, { style: styles.resultTitle }, 'Resultado'),
          React.createElement(
            Text,
            { style: styles.resultText },
            aprovado ? 'APROVADO - Combustível dentro dos critérios' : 'REPROVADO - Combustível fora dos critérios',
          ),
        ),

        React.createElement(
          Text,
          { style: styles.footer },
          `Emitido em ${formatarDataHora(new Date())}`,
        ),
      ),
    );

    return renderToBuffer(doc);
  }
}
