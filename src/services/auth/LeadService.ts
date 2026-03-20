/**
 * Trial / Demo lead capture — persists to Firestore `leads` via secured API (Admin SDK).
 * - `trial`: 7-day window + 10-scan quota (`accountTier: trial`, server-managed counters).
 * - `demo`: demo-only data mode (`accountTier: demo`, `isTrialUser: true` for legacy clients).
 */

export type RegistrationType = 'trial' | 'demo';

export type TrialLeadPayload = {
  name: string;
  email: string;
  phone: string;
  /** Matches sector presets: CONSTRUCTION | RENOVATION | PROPERTY_MGMT | ELECTRICAL */
  business_sector: string;
  registration_type?: RegistrationType;
  /** Firebase ID token — when valid and email matches, server updates `users/{uid}` tier fields. */
  idToken?: string | null;
};

export type TrialLeadResponse = {
  ok: boolean;
  leadId?: string;
  /** @deprecated use `profileApplied` — true when demo tier / legacy demo flag was set */
  trialUserApplied?: boolean;
  /** Server updated the signed-in user profile for this registration type */
  profileApplied?: boolean;
  /** Which tier was written when `profileApplied` */
  appliedRegistrationType?: RegistrationType;
  error?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clamp(s: string, max: number): string {
  return s.trim().slice(0, max);
}

export function validateTrialLeadPayload(p: TrialLeadPayload): string | null {
  const name = clamp(p.name, 120);
  const email = clamp(p.email, 200).toLowerCase();
  const phone = clamp(p.phone, 40);
  const business_sector = clamp(p.business_sector, 64);
  const rt = p.registration_type;
  if (rt !== undefined && rt !== 'trial' && rt !== 'demo') return 'invalid_registration_type';
  if (name.length < 2) return 'invalid_name';
  if (!EMAIL_RE.test(email)) return 'invalid_email';
  if (phone.length < 6) return 'invalid_phone';
  if (business_sector.length < 2) return 'invalid_sector';
  return null;
}

export async function submitTrialLead(payload: TrialLeadPayload): Promise<TrialLeadResponse> {
  const err = validateTrialLeadPayload(payload);
  if (err) {
    return { ok: false, error: err };
  }

  const registration_type: RegistrationType =
    payload.registration_type === 'demo' ? 'demo' : 'trial';

  const res = await fetch('/api/leads/trial', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: clamp(payload.name, 120),
      email: clamp(payload.email, 200).toLowerCase(),
      phone: clamp(payload.phone, 40),
      business_sector: clamp(payload.business_sector, 64),
      registration_type,
      idToken: payload.idToken?.trim() || undefined,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as TrialLeadResponse;
  if (!res.ok) {
    return { ok: false, error: data.error || 'request_failed' };
  }
  return data;
}
