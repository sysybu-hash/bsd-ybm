"use client";

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { ScanHubPreviewPayload } from "@/components/multi-engine-scanner/types";

export type AiHubTab = "scan" | "notebook" | "generate";

export type ScanHubPreviewSnapshot = ScanHubPreviewPayload;

export type LibraryPeekScanned = {
  kind: "scanned";
  id: string;
  fileName: string;
  vendor: string;
  summary: string;
  total: number;
  lineItemCount: number;
  extractedType: string;
  status: string;
  createdAt: string;
};

export type LibraryPeekIssued = {
  kind: "issued";
  id: string;
  clientName: string;
  type: string;
  number: number;
  total: number;
  status: string;
  date: string;
};

export type LibraryPeekSelection = LibraryPeekScanned | LibraryPeekIssued | null;

export type AiHubPreviewPanelTab = "scan" | "notebook" | "library";

type AiHubPreviewContextValue = {
  hubTab: AiHubTab;
  setHubTab: Dispatch<SetStateAction<AiHubTab>>;
  scanPreview: ScanHubPreviewSnapshot;
  setScanPreview: Dispatch<SetStateAction<ScanHubPreviewSnapshot>>;
  notebookLastReply: string | null;
  setNotebookLastReply: Dispatch<SetStateAction<string | null>>;
  notebookSourceNames: string[];
  setNotebookSourceNames: Dispatch<SetStateAction<string[]>>;
  libraryPeek: LibraryPeekSelection;
  setLibraryPeek: Dispatch<SetStateAction<LibraryPeekSelection>>;
  previewPanelTab: AiHubPreviewPanelTab;
  setPreviewPanelTab: Dispatch<SetStateAction<AiHubPreviewPanelTab>>;
};

const defaultScanPreview: ScanHubPreviewSnapshot = {
  fileName: null,
  previewUrl: null,
  previewKind: "none",
  extraction: null,
  streamStage: null,
  scanError: null,
  scanning: false,
};

const AiHubPreviewContext = createContext<AiHubPreviewContextValue | null>(null);

export function AiHubPreviewProvider({ children }: { children: ReactNode }) {
  const [hubTab, setHubTab] = useState<AiHubTab>("scan");
  const [scanPreview, setScanPreview] = useState<ScanHubPreviewSnapshot>(defaultScanPreview);
  const [notebookLastReply, setNotebookLastReply] = useState<string | null>(null);
  const [notebookSourceNames, setNotebookSourceNames] = useState<string[]>([]);
  const [libraryPeek, setLibraryPeek] = useState<LibraryPeekSelection>(null);
  const [previewPanelTab, setPreviewPanelTab] = useState<AiHubPreviewPanelTab>("scan");

  const value = useMemo(
    () => ({
      hubTab,
      setHubTab,
      scanPreview,
      setScanPreview,
      notebookLastReply,
      setNotebookLastReply,
      notebookSourceNames,
      setNotebookSourceNames,
      libraryPeek,
      setLibraryPeek,
      previewPanelTab,
      setPreviewPanelTab,
    }),
    [
      hubTab,
      scanPreview,
      notebookLastReply,
      notebookSourceNames,
      libraryPeek,
      previewPanelTab,
    ],
  );

  return <AiHubPreviewContext.Provider value={value}>{children}</AiHubPreviewContext.Provider>;
}

export function useAiHubPreview() {
  const ctx = useContext(AiHubPreviewContext);
  if (!ctx) {
    throw new Error("useAiHubPreview חייב לעטוף ב-AiHubPreviewProvider");
  }
  return ctx;
}

export function useAiHubPreviewOptional() {
  return useContext(AiHubPreviewContext);
}
