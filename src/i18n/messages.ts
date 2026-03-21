import meckanoHeJson from './he.json';
import meckanoEnJson from './en.json';

export type AppLocale = 'he' | 'en';

export const LOCALE_STORAGE_KEY = 'bsd-ybm-locale';

type MeckanoKeys = keyof typeof meckanoHeJson;

const baseHe = {
  'nav.dashboard': 'דשבורד ראשי',
  'nav.projects': 'פרויקטים',
  'nav.finance': 'ניהול תקציב',
  'nav.budgetActual': 'תקציב מול ביצוע',
  'nav.payroll': 'שכר ועובדים',
  'nav.settingsHub': 'הגדרות',
  'nav.createProject': 'פרויקט חדש',
  'nav.moreTools': 'עוד כלים',
  'nav.executiveFinance': 'דוח רווח והפסד',
  'nav.expenseLog': 'יומן הוצאות',
  'nav.reports': 'דוחות לפי אתר',
  'nav.team': 'צוות',
  'nav.scan': 'סריקת מסמכים',
  'nav.integrations': 'חיבורים',
  'nav.import': 'ייבוא היסטוריה',
  'nav.archiveSearch': 'ארכיון OCR',
  'nav.fleet': 'צי נורות',
  'nav.developer': 'מפתח מערכת',
  'nav.ownerVault': 'אזור בעלים',
  'nav.ownerAiCoder': 'AI מפתח (בעלים)',
  'locale.he': 'עברית',
  'locale.en': 'English',
  'select.title': 'בחירת ארגון',
  'select.subtitle': 'BSD-YBM',
  'select.hint': 'בחרו את החברה שבה תעבדו כעת.',
  'select.continue': 'המשך',
  'select.loading': 'טוען…',
  'select.signIn': 'יש להתחבר תחילה.',
  'select.loginCta': 'התחברות',
} as const;

const baseEn = {
  'nav.dashboard': 'Dashboard',
  'nav.projects': 'Projects',
  'nav.finance': 'Finance',
  'nav.budgetActual': 'Budget vs actual',
  'nav.payroll': 'Payroll & workers',
  'nav.settingsHub': 'Settings',
  'nav.createProject': 'Create new project',
  'nav.moreTools': 'More tools',
  'nav.executiveFinance': 'Executive P&L',
  'nav.expenseLog': 'Expense log',
  'nav.reports': 'Location reports',
  'nav.team': 'Team',
  'nav.scan': 'Document scan',
  'nav.integrations': 'Integrations',
  'nav.import': 'History import',
  'nav.archiveSearch': 'OCR archive',
  'nav.fleet': 'Fleet lights',
  'nav.developer': 'Developer',
  'nav.ownerVault': 'Owner vault',
  'nav.ownerAiCoder': 'AI coder (owner)',
  'locale.he': 'עברית',
  'locale.en': 'English',
  'select.title': 'Choose organization',
  'select.subtitle': 'BSD-YBM',
  'select.hint': 'Select the company you want to work in.',
  'select.continue': 'Continue',
  'select.loading': 'Loading…',
  'select.signIn': 'Please sign in first.',
  'select.loginCta': 'Sign in',
} as const;

export const messages = {
  he: { ...baseHe, ...meckanoHeJson },
  en: { ...baseEn, ...meckanoEnJson },
} as const;

export type MessageKey =
  | keyof typeof baseHe
  | MeckanoKeys;

export function translate(locale: AppLocale, key: MessageKey): string {
  const table = messages[locale] as Record<string, string>;
  return table[key as string] ?? (messages.en as Record<string, string>)[key as string] ?? key;
}
