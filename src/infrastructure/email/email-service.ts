import { EMAIL_FROM, resend } from './resend-client';
import { templateResetSenha } from './templates/reset-senha.template';

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
