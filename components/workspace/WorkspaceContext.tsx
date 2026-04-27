"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type WorkspaceContextValue = {
  activeClientId: string | null;
  activeClientName: string | null;
  activeDocumentId: string | null;
  setActiveClient: (id: string, name: string) => void;
  setActiveDocument: (id: string) => void;
  clearActiveClient: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  activeClientId: null,
  activeClientName: null,
  activeDocumentId: null,
  setActiveClient: () => {},
  setActiveDocument: () => {},
  clearActiveClient: () => {},
});

export function WorkspaceContextProvider({ children }: { children: ReactNode }) {
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeClientName, setActiveClientNameState] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentIdState] = useState<string | null>(null);

  const setActiveClient = useCallback((id: string, name: string) => {
    setActiveClientId(id);
    setActiveClientNameState(name);
  }, []);

  const setActiveDocument = useCallback((id: string) => {
    setActiveDocumentIdState(id);
  }, []);

  const clearActiveClient = useCallback(() => {
    setActiveClientId(null);
    setActiveClientNameState(null);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        activeClientId,
        activeClientName,
        activeDocumentId,
        setActiveClient,
        setActiveDocument,
        clearActiveClient,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  return useContext(WorkspaceContext);
}
