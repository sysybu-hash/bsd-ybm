/**
 * BSD-YBM AI Solutions — WhatsApp Cloud API (Meta) notifications.
 * Configure: WHATSAPP_CLOUD_ACCESS_TOKEN, WHATSAPP_CLOUD_PHONE_NUMBER_ID, WHATSAPP_CLOUD_API_VERSION (default v21.0)
 */

export type ContractSignedNotifyInput = {
  contractorPhoneE164: string;
  projectName: string;
  companyDisplayName: string;
  signedAtIso: string;
};

export type QuoteApprovedNotifyInput = ContractSignedNotifyInput & { quoteTitle: string };

export const WhatsAppService = {
  async sendQuoteApprovedAlert(input: QuoteApprovedNotifyInput): Promise<{ ok: boolean; reason?: string }> {
    const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim();
    const version = process.env.WHATSAPP_CLOUD_API_VERSION?.trim() || 'v21.0';

    if (!token || !phoneNumberId) {
      console.info('[BSD-YBM WhatsApp] Quote approved — WhatsApp not configured.');
      return { ok: false, reason: 'not_configured' };
    }

    const to = input.contractorPhoneE164.replace(/\s/g, '');
    if (!to.startsWith('+')) {
      console.warn('[BSD-YBM WhatsApp] Phone must be E.164 (+972...)');
      return { ok: false, reason: 'bad_phone' };
    }

    const body = `היי — הצעת מחיר "${input.quoteTitle}" אושרה ונחתמה לפרויקט "${input.projectName}" (${input.companyDisplayName}). זמן: ${input.signedAtIso} · BSD-YBM AI Solutions`;

    try {
      const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace('+', ''),
          type: 'text',
          text: { body },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.warn('[BSD-YBM WhatsApp] send failed', res.status, t);
        return { ok: false, reason: 'api_error' };
      }
      return { ok: true };
    } catch (e) {
      console.warn('[BSD-YBM WhatsApp]', e);
      return { ok: false, reason: 'network' };
    }
  },

  async sendContractSignedAlert(input: ContractSignedNotifyInput): Promise<{ ok: boolean; reason?: string }> {
    const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim();
    const version = process.env.WHATSAPP_CLOUD_API_VERSION?.trim() || 'v21.0';

    if (!token || !phoneNumberId) {
      console.info(
        '[BSD-YBM WhatsApp] Contract signed — set WHATSAPP_CLOUD_ACCESS_TOKEN + WHATSAPP_CLOUD_PHONE_NUMBER_ID to enable alerts.'
      );
      return { ok: false, reason: 'not_configured' };
    }

    const to = input.contractorPhoneE164.replace(/\s/g, '');
    if (!to.startsWith('+')) {
      console.warn('[BSD-YBM WhatsApp] Phone must be E.164 (+972...)');
      return { ok: false, reason: 'bad_phone' };
    }

    const body = `היי — לקוח חתם על הסכם בפרויקט "${input.projectName}" (${input.companyDisplayName}). זמן: ${input.signedAtIso} · BSD-YBM AI Solutions`;

    try {
      const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replace('+', ''),
          type: 'text',
          text: { body },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.warn('[BSD-YBM WhatsApp] send failed', res.status, t);
        return { ok: false, reason: 'api_error' };
      }
      return { ok: true };
    } catch (e) {
      console.warn('[BSD-YBM WhatsApp]', e);
      return { ok: false, reason: 'network' };
    }
  },
};
