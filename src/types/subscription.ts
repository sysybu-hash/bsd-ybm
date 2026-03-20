/** SaaS tier for BSD-YBM tenants (stored on `companies/{id}.plan`). */
export type TenantPlan = 'basic' | 'pro' | 'alloy';

export type SubscriptionFeatureKey =
  | 'attendance'
  | 'timeline'
  | 'finance_dashboard'
  | 'reports'
  | 'multi_engine_scan'
  | 'ai_referee';

/** Features enabled per plan (cumulative). */
export const PLAN_FEATURES: Record<TenantPlan, ReadonlySet<SubscriptionFeatureKey>> = {
  basic: new Set<SubscriptionFeatureKey>(['attendance', 'timeline']),
  pro: new Set<SubscriptionFeatureKey>([
    'attendance',
    'timeline',
    'finance_dashboard',
    'reports',
  ]),
  alloy: new Set<SubscriptionFeatureKey>([
    'attendance',
    'timeline',
    'finance_dashboard',
    'reports',
    'multi_engine_scan',
    'ai_referee',
  ]),
};

/** Companies without `plan` keep previous product behavior. */
export const LEGACY_DEFAULT_PLAN: TenantPlan = 'pro';

export function normalizeTenantPlan(value: unknown): TenantPlan {
  if (value === 'basic' || value === 'pro' || value === 'alloy') return value;
  return LEGACY_DEFAULT_PLAN;
}
