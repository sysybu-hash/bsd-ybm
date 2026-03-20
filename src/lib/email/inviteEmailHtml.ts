import { LEGAL_BRAND_NAME } from '@/lib/site';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const GOLD = '#D4AF37';
const GOLD_DEEP = '#C9A227';
const NAVY = '#1B365D';
const BG = '#FDFDFD';
const TEXT = '#1a1a1a';

export type InviteEmailParams = {
  inviterDisplayName: string;
  loginUrl: string;
};

/**
 * Golden Helix–style RTL HTML for transactional invites (table layout for clients).
 */
export function buildInviteEmailHtml(params: InviteEmailParams): string {
  const name = escapeHtml(params.inviterDisplayName.trim() || 'מנהל המערכת');
  const url = escapeHtml(params.loginUrl.replace(/"/g, ''));

  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>הזמנה — ${LEGAL_BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;border-collapse:separate;border-spacing:0;border-radius:32px;overflow:hidden;border:2px solid ${GOLD};background:#ffffff;box-shadow:0 12px 40px rgba(27,54,93,0.08);">
          <tr>
            <td style="padding:0;background:linear-gradient(135deg, ${NAVY} 0%, #0f2744 100%);text-align:center;">
              <div style="padding:28px 24px 20px;">
                <div style="display:inline-block;width:56px;height:56px;border-radius:32px;border:2px solid ${GOLD};background:rgba(212,175,55,0.12);line-height:52px;font-size:28px;color:${GOLD};font-weight:800;">◎</div>
                <p style="margin:16px 0 0;font-size:11px;letter-spacing:0.2em;color:${GOLD};font-weight:700;">BSD-YBM · Golden Helix</p>
                <h1 style="margin:12px 0 0;font-size:20px;font-weight:800;color:#ffffff;line-height:1.35;">${LEGAL_BRAND_NAME}</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <p style="margin:0;font-size:16px;line-height:1.7;color:${TEXT};">
                שלום,<br /><br />
                <strong style="color:${NAVY};">${name}</strong> הזמין אותך להצטרף לניהול חברה בפורטל BSD-YBM.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.75;color:#4b5563;">
                המערכת מאפשרת לך לנהל פרויקטים, לסרוק מסמכים ב-AI ולחתום על חוזים דיגיטליים.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px;text-align:center;">
              <a href="${url}" style="display:inline-block;min-width:200px;padding:14px 28px;border-radius:32px;font-size:16px;font-weight:800;text-decoration:none;color:#1a1a1a;background:linear-gradient(145deg, ${GOLD} 0%, ${GOLD_DEEP} 100%);box-shadow:0 4px 24px rgba(212,175,55,0.45);border:2px solid rgba(255,255,255,0.35);">
                כניסה למערכת
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all;">
                או העתקו לדפדפן:<br />
                <a href="${url}" style="color:${NAVY};">${url}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 8px 0;font-size:11px;color:#9ca3af;text-align:center;">
          הודעה אוטומטית · ${LEGAL_BRAND_NAME}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export const INVITE_EMAIL_SUBJECT = `הזמנה להצטרפות למערכת הניהול - ${LEGAL_BRAND_NAME}`;

/** Phase 26.1 — multi-tenant portal invite (fixed portal URL). */
export const SEND_INVITE_EMAIL_SUBJECT = 'הזמנה אישית לניהול בפורטל BSD-YBM AI Solutions';

export type SendInviteEmailParams = {
  inviterDisplayName: string;
};

/**
 * Golden Helix RTL template — body copy per Phase 26.1; CTA → https://www.bsd-ybm.co.il
 */
export function buildSendInviteEmailHtml(params: SendInviteEmailParams): string {
  const name = escapeHtml(params.inviterDisplayName.trim() || 'יוחנן בוקשפן');
  const portalUrl = escapeHtml('https://www.bsd-ybm.co.il');

  return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${SEND_INVITE_EMAIL_SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;border-collapse:separate;border-spacing:0;border-radius:32px;overflow:hidden;border:2px solid ${GOLD};background:#ffffff;box-shadow:0 12px 40px rgba(27,54,93,0.08);">
          <tr>
            <td style="padding:0;background:linear-gradient(135deg, ${NAVY} 0%, #0f2744 100%);text-align:center;">
              <div style="padding:28px 24px 20px;">
                <div style="display:inline-block;width:56px;height:56px;border-radius:32px;border:2px solid ${GOLD};background:rgba(212,175,55,0.12);line-height:52px;font-size:28px;color:${GOLD};font-weight:800;">◎</div>
                <p style="margin:16px 0 0;font-size:11px;letter-spacing:0.2em;color:${GOLD};font-weight:700;">BSD-YBM · Golden Helix</p>
                <h1 style="margin:12px 0 0;font-size:18px;font-weight:800;color:#ffffff;line-height:1.35;">${LEGAL_BRAND_NAME}</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;">
              <p style="margin:0;font-size:16px;line-height:1.85;color:${TEXT};">
                שלום,<br /><br />
                <strong style="color:${NAVY};">${name}</strong> הזמין אותך להצטרף לניהול חברה בפורטל BSD-YBM.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.85;color:#4b5563;">
                המערכת מאפשרת ניהול פרויקטים, סריקת מסמכים ב-AI וחתימה דיגיטלית בסטנדרט הגבוה ביותר.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px;text-align:center;">
              <a href="https://www.bsd-ybm.co.il" style="display:inline-block;min-width:220px;padding:14px 28px;border-radius:32px;font-size:16px;font-weight:800;text-decoration:none;color:#1a1a1a;background:linear-gradient(145deg, ${GOLD} 0%, ${GOLD_DEEP} 100%);box-shadow:0 4px 24px rgba(212,175,55,0.45);border:2px solid rgba(255,255,255,0.35);">
                כניסה לפורטל
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;word-break:break-all;">
                <a href="https://www.bsd-ybm.co.il" style="color:${NAVY};">${portalUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 8px 0;font-size:11px;color:#9ca3af;text-align:center;">
          הודעה אוטומטית · ${LEGAL_BRAND_NAME}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}
