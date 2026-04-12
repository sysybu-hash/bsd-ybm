"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type CashFlowData = {
  actual: number;       // כסף שכבר נכנס (חשבוניות שולמו)
  pending: number;      // כסף בדרך (חשבוניות פתוחות)
  forecast: number;     // תחזית CRM (לידים בשלבי סגירה)
  totalProjected: number;
};

/**
 * מחשב תחזית פיננסית משולבת CRM + ERP
 */
export async function getFinancialForecastAction(): Promise<CashFlowData> {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.organizationId;
  if (!orgId) return { actual: 0, pending: 0, forecast: 0, totalProjected: 0 };

  // 1. נתוני ERP - חשבוניות שהונפקו
  const issuedDocs = await prisma.issuedDocument.findMany({
    where: { organizationId: orgId },
    select: { total: true, status: true }
  });

  const actual = issuedDocs
    .filter(d => d.status === "PAID")
    .reduce((sum, d) => sum + d.total, 0);

  const pending = issuedDocs
    .filter(d => d.status === "PENDING")
    .reduce((sum, d) => sum + d.total, 0);

  // 2. נתוני CRM - הסתברות לפי סטטוס
  const contacts = await prisma.contact.findMany({
    where: { 
      organizationId: orgId,
      status: { in: ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"] }
    },
    select: { value: true, status: true }
  });

  const statusProbability: Record<string, number> = {
    "LEAD": 0.1,
    "QUALIFIED": 0.3,
    "PROPOSAL": 0.6,
    "NEGOTIATION": 0.8
  };

  const forecast = contacts.reduce((sum, c) => {
    const prob = statusProbability[c.status] || 0;
    return sum + ((c.value || 0) * prob);
  }, 0);

  return {
    actual,
    pending,
    forecast: Math.round(forecast),
    totalProjected: Math.round(actual + pending + forecast)
  };
}
