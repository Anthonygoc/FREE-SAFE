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

import type { RAQ } from '@/domain/entities/raq.entity';
import type { PDFPort } from '@/domain/ports/pdf.port';
import type { Posto } from '@/domain/ports/posto.repository';

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 24,
    paddingLeft: 24,
    fontSize: 8,
    color: '#000000',
  },
  logo: {
    width: 180,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    backgroundColor: '#595959',
    color: '#FFFFFF',
    fontWeight: 700,
    textAlign: 'center',
    padding: 6,
    marginBottom: 10,
  },
  section: {
    marginBottom: 10,
    borderTop: '0.5 solid #cccccc',
    borderLeft: '0.5 solid #cccccc',
    borderRight: '0.5 solid #cccccc',
  },
  sectionHeader: {
    backgroundColor: '#595959',
    color: '#FFFFFF',
    fontWeight: 700,
    textAlign: 'center',
    padding: 5,
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #cccccc',
  },
  labelCell: {
    width: '55%',
    padding: 4,
    fontSize: 8,
    fontWeight: 700,
    borderRight: '0.5 solid #cccccc',
  },
  valueCell: {
    width: '45%',
    padding: 4,
    fontSize: 8,
  },
  resultValueApproved: {
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    fontWeight: 700,
    textAlign: 'center',
  },
  resultValueRejected: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    fontWeight: 700,
    textAlign: 'center',
  },
});

type RowValueStyle = typeof styles.valueCell | Array<typeof styles.valueCell | object> | object;

type FieldRowProps = {
  label: string;
  value: string;
  valueStyle?: RowValueStyle;
};

export class ReactPDFAdapter implements PDFPort {
  async gerarRAQ(raq: RAQ, posto: Posto): Promise<Buffer> {
    const logoPath = resolveLogoPath();
    const resultValueStyle =
      raq.resultado === 'APROVADO' ? styles.resultValueApproved : styles.resultValueRejected;

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        React.createElement(Image, {
          src: logoPath,
          style: styles.logo,
        }),
        React.createElement(
          Text,
          { style: styles.title },
          'REGISTRO DE ANÁLISE DE QUALIDADE',
        ),
        React.createElement(
          Section,
          { title: 'DADOS DO POSTO REVENDEDOR' },
          React.createElement(FieldRow, {
            label: 'RAZÃO SOCIAL DO POSTO REVENDEDOR:',
            value: posto.razaoSocial,
          }),
          React.createElement(FieldRow, {
            label: 'CNPJ DO POSTO REVENDEDOR:',
            value: posto.cnpj,
          }),
          React.createElement(FieldRow, {
            label: 'ENDEREÇO DO POSTO REVENDEDOR:',
            value: formatEndereco(posto.endereco, posto.cidade, posto.uf),
          }),
        ),
        React.createElement(
          Section,
          { title: 'DADOS DO RECEBIMENTO' },
          React.createElement(FieldRow, {
            label: 'PRODUTO',
            value: formatProduto(raq.produto),
          }),
          React.createElement(FieldRow, {
            label: 'VOLUME RECEBIDO (Litros)',
            value: formatNumber(raq.volumeRecebido),
          }),
          React.createElement(FieldRow, {
            label: 'DATA DA COLETA',
            value: formatDate(raq.criadoEm),
          }),
          React.createElement(FieldRow, {
            label: 'DISTRIBUIDOR',
            value: raq.distribuidora ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'CNPJ DO DISTRIBUIDOR',
            value: raq.cnpjDistribuidora ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'TRANSPORTADOR',
            value: raq.transportador ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'CNPJ DO TRANSPORTADOR',
            value: raq.cnpjTransportador ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'NOTA FISCAL DO PRODUTO',
            value: raq.notaFiscal ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'PLACA DO CAMINHÃO REBOQUE',
            value: raq.placaCaminhao ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'NOME DO MOTORISTA',
            value: raq.nomeMotorista ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'CPF DO MOTORISTA',
            value: raq.cpfMotorista ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'ASSINATURA DO MOTORISTA',
            value: '',
          }),
          React.createElement(FieldRow, {
            label: 'NOME DO ANALISTA',
            value: raq.nomeAnalista ?? '',
          }),
        ),
        React.createElement(
          Section,
          { title: 'RESULTADO DA ANÁLISE' },
          React.createElement(FieldRow, {
            label: 'ASPECTO',
            value: formatAspecto(raq.aspecto),
          }),
          React.createElement(FieldRow, {
            label: 'COR',
            value: formatCor(raq.cor),
          }),
          React.createElement(FieldRow, {
            label: 'DENSIDADE RELATIVA',
            value: formatDecimal(raq.densidadeObservada),
          }),
          React.createElement(FieldRow, {
            label: 'TEMPERATURA',
            value: formatDecimal(raq.temperaturaObservada),
          }),
          React.createElement(FieldRow, {
            label: 'MASSA ESPECÍFICA A 20°C',
            value: formatDecimal(raq.massa20c),
          }),
          React.createElement(FieldRow, {
            label: 'TEOR DE ÁLCOOL NA GASOLINA',
            value: formatPercentForGasolina(raq.produto, raq.teorEtanol),
          }),
          React.createElement(FieldRow, {
            label: 'TEOR ALCOÓLICO NO AEHC',
            value: formatPercentForEtanol(raq.produto, raq.teorAlcoolico),
          }),
          React.createElement(FieldRow, {
            label: 'RESULTADO FINAL',
            value: raq.resultado,
            valueStyle: [styles.valueCell, resultValueStyle],
          }),
          React.createElement(FieldRow, {
            label: 'RESPONSÁVEL PELO PREENCHIMENTO',
            value: raq.nomeAnalista ?? '',
          }),
          React.createElement(FieldRow, {
            label: 'ASSINATURA',
            value: '',
          }),
        ),
      ),
    );

    return renderToBuffer(doc);
  }
}

function Section({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.sectionHeader }, title),
    children,
  );
}

function FieldRow({ label, value, valueStyle = styles.valueCell }: FieldRowProps) {
  return React.createElement(
    View,
    { style: styles.row },
    React.createElement(Text, { style: styles.labelCell }, label),
    React.createElement(Text, { style: valueStyle }, value || ' '),
  );
}

function resolveLogoPath(): string {
  const publicLogoPath = path.join(process.cwd(), 'public', 'logo.png');
  if (fs.existsSync(publicLogoPath)) {
    return publicLogoPath;
  }

  return path.join(process.cwd(), 'src', 'public', 'logo.png');
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

function formatAspecto(aspecto: string): string {
  const labels: Record<string, string> = {
    LIQUIDO_E_ISENTO: 'Líquido e Isento',
    TURVO: 'Turvo',
    COM_IMPUREZAS: 'Com Impurezas',
  };

  return labels[aspecto] ?? aspecto;
}

function formatCor(cor: string): string {
  return cor === 'CARACTERISTICA' ? 'Característica' : 'Alterada';
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
