import { sendTransactionalHtml } from '@/lib/email/sendTransactionalEmail';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type WelcomeEmailParams = {
  to: string;
  displayName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

/**
 * Sends welcome email with temp password (SMTP or Resend). Reply-To: sysybu@gmail.com via sendTransactionalHtml.
 * Returns true if sent, false if transport not configured or send skipped.
 */
export async function sendWelcomeEmailWithTempPassword(params: WelcomeEmailParams): Promise<boolean> {
  const safeName = escapeHtml(params.displayName);
  const safeEmail = escapeHtml(params.email);
  const safePass = escapeHtml(params.temporaryPassword);
  const safeUrl = escapeHtml(params.loginUrl);

  const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8" /></head>
<body style="font-family:Segoe UI,Helvetica,Arial,sans-serif;background:#FDFDFD;color:#1a1a1a;padding:24px;">
  <p>שלום ${safeName},</p>
  <p>בקשת ההרשמה שלך אושרה. להלן פרטי כניסה זמניים ל־BSD-YBM:</p>
  <ul>
    <li><strong>אימייל:</strong> ${safeEmail}</li>
    <li><strong>סיסמה זמנית:</strong> ${safePass}</li>
  </ul>
  <p>היכנסו לכאן: <a href="${safeUrl}">${safeUrl}</a></p>
  <p>מומלץ להחליף סיסמה לאחר הכניסה הראשונה.</p>
</body>
</html>
`.trim();

  try {
    await sendTransactionalHtml({
      to: params.to,
      subject: 'BSD-YBM AI Solutions — פרטי כניסה (אושר על ידי מנהל)',
      html,
    });
    return true;
  } catch (e) {
    console.warn('[sendWelcomeEmailWithTempPassword]', e);
    return false;
  }
}
