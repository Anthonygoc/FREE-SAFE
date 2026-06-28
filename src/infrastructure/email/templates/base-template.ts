export function baseTemplate(conteudo: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#f97316;padding:20px 28px;">
              <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:-0.5px;">FREE SAFE</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#18181b;font-size:15px;line-height:1.6;">
              ${conteudo}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;border-top:1px solid #e4e4e7;color:#71717a;font-size:12px;line-height:1.5;">
              Mensagem automática, não responda. Rede Free · Compliance Operacional
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export function botaoCta(texto: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:15px;">${texto}</a>`;
}
