import { APP_URL } from '../resend-client';
import { baseTemplate, botaoCta } from './base-template';

export type DocumentoVencimentoEmail = {
  titulo: string;
  categoria: string;
  dataVencimento: Date;
  status: 'VENCIDO' | 'VENCENDO';
  diasRestantes: number;
};

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(data);
}

function formatarSituacao(doc: DocumentoVencimentoEmail): { texto: string; cor: string } {
  if (doc.status === 'VENCIDO') {
    return {
      texto: 'Vencido',
      cor: '#dc2626',
    };
  }

  if (doc.diasRestantes === 0) {
    return {
      texto: 'Vence hoje',
      cor: '#d97706',
    };
  }

  return {
    texto: `Vence em ${doc.diasRestantes} dias`,
    cor: '#d97706',
  };
}

export function templateVencimento(
  nomePosto: string,
  docs: DocumentoVencimentoEmail[],
): string {
  const linhas = docs
    .map((doc) => {
      const situacao = formatarSituacao(doc);

      return `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e4e4e7;color:#18181b;font-size:14px;">${doc.titulo}</td>
          <td style="padding:12px;border-bottom:1px solid #e4e4e7;color:#52525b;font-size:14px;">${doc.categoria}</td>
          <td style="padding:12px;border-bottom:1px solid #e4e4e7;color:#18181b;font-size:14px;">${formatarData(doc.dataVencimento)}</td>
          <td style="padding:12px;border-bottom:1px solid #e4e4e7;color:${situacao.cor};font-size:14px;font-weight:bold;">${situacao.texto}</td>
        </tr>
      `;
    })
    .join('');

  return baseTemplate(`
    <p style="margin:0 0 16px;">Os seguintes documentos do posto <strong>${nomePosto}</strong> precisam de atenção:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:10px;overflow:hidden;">
      <tr style="background:#f4f4f5;">
        <td style="padding:12px;color:#18181b;font-size:13px;font-weight:bold;">Documento</td>
        <td style="padding:12px;color:#18181b;font-size:13px;font-weight:bold;">Categoria</td>
        <td style="padding:12px;color:#18181b;font-size:13px;font-weight:bold;">Vencimento</td>
        <td style="padding:12px;color:#18181b;font-size:13px;font-weight:bold;">Situação</td>
      </tr>
      ${linhas}
    </table>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td>${botaoCta('Acessar documentos', `${APP_URL}/documentos`)}</td>
      </tr>
    </table>
  `);
}
