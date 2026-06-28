import { EMAIL_FROM, resend } from './resend-client';
import { templateResetSenha } from './templates/reset-senha.template';
import {
  templateVencimento,
  type DocumentoVencimentoEmail,
} from './templates/vencimento-documentos.template';

export type { DocumentoVencimentoEmail } from './templates/vencimento-documentos.template';

type EnviarEmailParams = {
  para: string | string[];
  assunto: string;
  html: string;
};

export async function enviarEmail({
  para,
  assunto,
  html,
}: EnviarEmailParams): Promise<boolean> {
  if (!resend) {
    console.warn('[email] envio ignorado (sem API key):', assunto);
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(para) ? para : [para],
      subject: assunto,
      html,
    });

    if (error) {
      console.error('[email] erro Resend:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[email] exceção ao enviar:', error);
    return false;
  }
}

export async function enviarEmailResetSenha(
  para: string,
  nome: string,
  token: string,
): Promise<boolean> {
  const html = templateResetSenha(nome, token);

  return enviarEmail({
    para,
    assunto: 'Redefinição de senha — FREE SAFE',
    html,
  });
}

export async function enviarEmailVencimentoDocumentos(
  para: string | string[],
  nomePosto: string,
  docs: DocumentoVencimentoEmail[],
): Promise<boolean> {
  const html = templateVencimento(nomePosto, docs);

  return enviarEmail({
    para,
    assunto: `Documentos a vencer — ${nomePosto}`,
    html,
  });
}
