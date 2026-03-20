/**
 * One-time dev console guidance for Google/Firebase domain alignment (bsd-ybm.co.il).
 */
import { PUBLIC_SITE_URL } from '@/lib/site';

let logged = false;

export function logAuthDomainSetupOnce(): void {
  if (typeof window === 'undefined' || logged) return;
  if (process.env.NODE_ENV === 'production') return;
  logged = true;
  const lines = [
    '[BSD-YBM Auth] Domain checklist for live site:',
    `  • Public site URL: ${PUBLIC_SITE_URL}`,
    '  • Firebase Console → Authentication → Settings → Authorized domains:',
    '      add: bsd-ybm.co.il , www.bsd-ybm.co.il',
    '  • Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client (Web):',
    `      Authorized JavaScript origins: ${PUBLIC_SITE_URL} , https://bsd-ybm.co.il`,
    `      Authorized redirect URIs: ${PUBLIC_SITE_URL}/api/auth/callback/google`,
    '      (Also keep your Firebase handler URI, e.g. https://<project>.firebaseapp.com/__/auth/handler)',
    '  • Firebase Google sign-in uses popup; ensure the Web client ID matches Firebase Auth settings.',
  ];
  // eslint-disable-next-line no-console
  console.info(lines.join('\n'));
}
