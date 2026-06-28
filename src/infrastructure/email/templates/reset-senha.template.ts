import { APP_URL } from '../resend-client';
import { baseTemplate, botaoCta } from './base-template';

export function templateResetSenha(nome: string, token: string): string {
  const link = `${APP_URL}/redefinir-senha?token=${token}`;

  return baseTemplate(`
    <p style="margin:0 0 16px;">Olá, ${nome}.</p>
    <p style="margin:0 0 16px;">Recebemos um pedido para redefinir sua senha.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td>${botaoCta('Redefinir senha', link)}</td>
      </tr>
    </table>
    <p style="margin:0;color:#52525b;">Este link expira em 1 hora. Se não foi você, ignore este email.</p>
  `);
}
