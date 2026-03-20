/** Default Reply-To for all transactional mail (Phase 26.1). Override with `EMAIL_REPLY_TO` if needed. */
export const DEFAULT_EMAIL_REPLY_TO = 'sysybu@gmail.com';

export function resolveEmailReplyTo(override?: string | null): string {
  const fromEnv = (process.env.EMAIL_REPLY_TO || '').trim();
  if (fromEnv) return fromEnv;
  const o = (override ?? '').trim();
  return o || DEFAULT_EMAIL_REPLY_TO;
}
