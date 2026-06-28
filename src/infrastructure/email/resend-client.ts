import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('[email] RESEND_API_KEY não configurada — emails não serão enviados');
}

export const resend = apiKey ? new Resend(apiKey) : null;
export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'FREE SAFE <onboarding@resend.dev>';
export const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';
