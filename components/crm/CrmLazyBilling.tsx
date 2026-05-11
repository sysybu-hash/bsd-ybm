"use client";

import dynamic from "next/dynamic";

function BillingSkeleton() {
  return <div className="h-20 animate-pulse rounded-xl bg-slate-100" />;
}

export const LazyProjectDocumentBox = dynamic(() => import("@/components/billing/ProjectDocumentBox"), {
  ssr: false,
  loading: () => <BillingSkeleton />,
});

export const LazyEditIssuedDocumentModal = dynamic(() => import("@/components/billing/EditIssuedDocumentModal"), {
  ssr: false,
});

export const LazyDocumentPreviewModal = dynamic(() => import("@/components/billing/DocumentPreviewModal"), {
  ssr: false,
});
