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

import type { CertificadoPort, CertificadoProps } from '@/domain/ports/certificado.port';

const ORANGE = '#f97316';
const ORANGE_DARK = '#ea580c';
const ZINC_900 = '#18181b';
const ZINC_600 = '#52525b';
const ZINC_400 = '#a1a1aa';
const WHITE = '#ffffff';

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingRight: 32,
    paddingBottom: 28,
    paddingLeft: 32,
    backgroundColor: WHITE,
    fontSize: 12,
    color: ZINC_900,
  },
  outerBorder: {
    flex: 1,
    border: `3 solid ${ORANGE}`,
    padding: 10,
  },
  innerBorder: {
    flex: 1,
    border: `1.5 solid ${ORANGE_DARK}`,
    paddingTop: 28,
    paddingRight: 34,
    paddingBottom: 24,
    paddingLeft: 34,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: 132,
    marginBottom: 16,
  },
  logoFallback: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ORANGE_DARK,
    marginBottom: 16,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: ORANGE_DARK,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 11,
    color: ZINC_600,
    textAlign: 'center',
  },
  body: {
    marginTop: 24,
    alignItems: 'center',
  },
  lead: {
    fontSize: 14,
    textAlign: 'center',
    color: ZINC_600,
    marginBottom: 12,
  },
  collaboratorName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: ZINC_900,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    maxWidth: 620,
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: 'center',
    color: ZINC_900,
    marginBottom: 20,
  },
  highlight: {
    fontWeight: 'bold',
    color: ORANGE_DARK,
  },
  detailsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailCard: {
    width: '48.5%',
    border: `1 solid ${ORANGE}`,
    borderRadius: 10,
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
    backgroundColor: '#fff7ed',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    color: ZINC_600,
    marginBottom: 4,
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ZINC_900,
  },
  footer: {
    marginTop: 26,
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signatureBlock: {
    width: '47%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTop: `1 solid ${ZINC_400}`,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 10,
    color: ZINC_600,
    textAlign: 'center',
  },
  verification: {
    fontSize: 10,
    textAlign: 'center',
    color: ZINC_600,
  },
  verificationCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: ORANGE_DARK,
  },
});

export class CertificadoAdapter implements CertificadoPort {
  async gerar(props: CertificadoProps): Promise<Buffer> {
    const logoPath = resolveLogoPath();

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', orientation: 'landscape', style: styles.page },
        React.createElement(
          View,
          { style: styles.outerBorder },
          React.createElement(
            View,
            { style: styles.innerBorder },
            React.createElement(
              View,
              { style: styles.header },
              logoPath
                ? React.createElement(Image, {
                    src: logoPath,
                    style: styles.logo,
                  })
                : React.createElement(Text, { style: styles.logoFallback }, 'FREE SAFE'),
              React.createElement(Text, { style: styles.title }, 'CERTIFICADO DE CONCLUSÃO'),
              React.createElement(
                Text,
                { style: styles.subtitle },
                'Treinamento, qualidade e conformidade operacional',
              ),
            ),
            React.createElement(
              View,
              { style: styles.body },
              React.createElement(Text, { style: styles.lead }, 'Certificamos que'),
              React.createElement(Text, { style: styles.collaboratorName }, props.colaboradorNome),
              React.createElement(
                Text,
                { style: styles.description },
                `concluiu com aproveitamento o curso `,
                React.createElement(Text, { style: styles.highlight }, props.cursoNome),
                `, exercendo o cargo de `,
                React.createElement(Text, { style: styles.highlight }, props.cargo),
                ` no posto `,
                React.createElement(
                  Text,
                  { style: styles.highlight },
                  `${props.postoNome} (${props.postoCidade}/${props.postoUf})`,
                ),
                `.`,
              ),
              React.createElement(
                View,
                { style: styles.detailsGrid },
                React.createElement(DetailCard, {
                  label: 'Curso',
                  value: props.cursoNome,
                }),
                React.createElement(DetailCard, {
                  label: 'Nota final',
                  value: `${formatNota(props.nota)} pontos`,
                }),
                React.createElement(DetailCard, {
                  label: 'Data de conclusao',
                  value: formatDate(props.dataConclusao),
                }),
                React.createElement(DetailCard, {
                  label: 'Posto',
                  value: `${props.postoNome} - ${props.postoCidade}/${props.postoUf}`,
                }),
              ),
            ),
            React.createElement(
              View,
              { style: styles.footer },
              React.createElement(
                View,
                { style: styles.signatures },
                React.createElement(
                  View,
                  { style: styles.signatureBlock },
                  React.createElement(View, { style: styles.signatureLine }),
                  React.createElement(
                    Text,
                    { style: styles.signatureLabel },
                    'Responsavel pelo treinamento',
                  ),
                ),
                React.createElement(
                  View,
                  { style: styles.signatureBlock },
                  React.createElement(View, { style: styles.signatureLine }),
                  React.createElement(Text, { style: styles.signatureLabel }, 'Colaborador'),
                ),
              ),
              React.createElement(
                Text,
                { style: styles.verification },
                'Codigo de verificacao: ',
                React.createElement(Text, { style: styles.verificationCode }, props.codigoVerificacao),
              ),
            ),
          ),
        ),
      ),
    );

    return renderToBuffer(doc);
  }
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return React.createElement(
    View,
    { style: styles.detailCard },
    React.createElement(Text, { style: styles.detailLabel }, label),
    React.createElement(Text, { style: styles.detailValue }, value),
  );
}

function resolveLogoPath(): string | null {
  const logoPaths = [
    path.join(process.cwd(), 'public', 'logo.png'),
    path.join(process.cwd(), 'src', 'public', 'logo.png'),
  ];

  const logoPath = logoPaths.find((candidate) => fs.existsSync(candidate));
  return logoPath ?? null;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatNota(nota: number): string {
  return nota.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
