"use client";

import { useRef } from "react";
import { X, Printer, Download } from "lucide-react";
import { CompanyType } from "@prisma/client";
import DocumentPrintTemplate, {
  type IssuedDocumentPrintModel,
  type OrganizationPrintModel,
} from "@/components/billing/DocumentPrintTemplate";
import type { IssuedDocRow } from "@/components/billing/GlobalBillingPageClient";

type Props = {
  doc: IssuedDocRow;
  org: OrganizationPrintModel;
  onClose: () => void;
};

export default function DocumentPreviewModal({ doc, org, onClose }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  const printModel: IssuedDocumentPrintModel = {
    type: doc.docType,
    number: doc.number,
    date: doc.dateIso,
    clientName: doc.clientName,
    status: doc.status,
    amount: doc.amount,
    vat: doc.vat,
    total: doc.total,
    items: doc.items,
  };

  const handlePrint = () => {
    const printArea = contentRef.current;
    if (!printArea) return;
    const html = printArea.innerHTML;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8" />
        <title>מסמך #${doc.number} — ${doc.clientName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Assistant', sans-serif; margin: 0; padding: 0; background: #fff; }
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          /* Tailwind reset for print */
          .card-avenue { border-radius:1rem; }
          .font-black { font-weight:900; }
          .italic { font-style:italic; }
          .tracking-tighter { letter-spacing:-0.05em; }
          .tracking-widest { letter-spacing:0.1em; }
          .uppercase { text-transform:uppercase; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-gray-900/50 p-4 pt-8"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      {/* Floating toolbar */}
      <div className="pointer-events-none fixed top-4 inset-x-0 z-[201] flex justify-center">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-lg shadow-gray-200/60">
          <span className="px-2 text-sm font-black text-gray-600">
            תצוגה מקדימה — מסמך #{doc.number}
          </span>
          <div className="h-5 w-px bg-gray-100" />
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700 transition"
          >
            <Printer size={15} /> הדפסה
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            <X size={15} /> סגור
          </button>
        </div>
      </div>

      {/* Document preview */}
      <div className="mt-14 w-full max-w-4xl pb-12" ref={contentRef}>
        <DocumentPrintTemplate doc={printModel} org={org} />
      </div>
    </div>
  );
}
