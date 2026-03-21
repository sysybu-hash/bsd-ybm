/** Multi-trade payroll — v6 core */
export const PAYROLL_TRADE_TYPES = [
  'Electric',
  'Plumbing',
  'Finishing',
  'Drywall',
  'HVAC',
  'Concrete',
  'Steel',
  'General',
] as const;

export type PayrollTradeType = (typeof PAYROLL_TRADE_TYPES)[number];

export function isPayrollTradeType(v: string): v is PayrollTradeType {
  return (PAYROLL_TRADE_TYPES as readonly string[]).includes(v);
}

export const PAYROLL_TAX_RATE = 0.165;

export function computePayrollNet(hours: number, dailyRate: number): { gross: number; tax: number; net: number } {
  const gross = Math.round(hours * dailyRate * 100) / 100;
  const tax = Math.round(gross * PAYROLL_TAX_RATE * 100) / 100;
  const net = Math.round(gross * (1 - PAYROLL_TAX_RATE) * 100) / 100;
  return { gross, tax, net };
}
