"use client";

import CrmClient from "./CrmClient";

export default function CrmPage() {
  // 🛡️ BSD-YBM 2026: HYBRID RECOVERY MODE
  // Sanitized CrmClient (No FM) with Mock Data to isolate DB failures.
  
  const contacts: any[] = [
    {
      id: "mock-stable-2026",
      name: "לקוח יציבות פרימיום (Mock)",
      email: "platinum@bsd-ybm.ai",
      phone: "03-1234567",
      status: "CLOSED_WON",
      value: 150000,
      createdAt: new Date().toISOString(),
      issuedDocuments: [],
      erp: { totalBilled: 150000, totalPaid: 150000, totalPending: 0, invoiceCount: 1 }
    }
  ];

  return (
    <CrmClient
      contacts={contacts}
      projects={[]}
      hasOrganization={true}
      organizations={[]}
      orgBilling={null}
    />
  );
}
