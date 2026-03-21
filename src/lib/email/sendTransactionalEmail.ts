import nodemailer from 'nodemailer';
import { resolveEmailReplyTo } from '@/lib/email/replyTo';

export type SendTransactionalHtmlParams = {
  to: string;
  subject: string;
  html: string;
  /** Defaults to `EMAIL_REPLY_TO` or sysybu@gmail.com */
  replyTo?: string;
};

/**
 * Sends HTML mail using either SMTP (`EMAIL_SERVER_*`) or Resend (`RESEND_API_KEY`).
 * `EMAIL_FROM` is used for the From header (both transports).
 * Reply-To defaults to sysybu@gmail.com (Phase 26.1).
 */
export async function sendTransactionalHtml(params: SendTransactionalHtmlParams): Promise<void> {
  const from =
    process.env.EMAIL_FROM?.trim() || 'BSD-YBM <no-reply@bsd-ybm.co.il>';
  const replyTo = resolveEmailReplyTo(params.replyTo);

  const host = (process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST || '').trim();
  if (host) {
    const port = Number(process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT || 587);
    const secure =
      process.env.EMAIL_SERVER_SECURE === 'true' ||
      process.env.SMTP_SECURE === 'true' ||
      port === 465;
    const user = (process.env.EMAIL_SERVER_USER || process.env.SMTP_USER || '').trim();
    const pass = (process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASSWORD || '').trim();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      from,
      to: params.to,
      replyTo,
      subject: params.subject,
      html: params.html,
    });
    return;
  }

  const key = (process.env.RESEND_API_KEY || '').trim();
  if (key) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        reply_to: replyTo,
        subject: params.subject,
        html: params.html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`Resend error: ${text}`);
    }
    return;
  }

  throw new Error(
    'Email not configured: set EMAIL_SERVER_HOST (SMTP) or RESEND_API_KEY in the server environment.'
  );
}
