import OwnerEmailGate from '@/components/owner/OwnerEmailGate';

/** Phase 36 — owner-only tools (AI Coder, etc.). Same email gate as Owner Vault. */
export default function OwnerOnlyLayout({ children }: { children: React.ReactNode }) {
  return <OwnerEmailGate>{children}</OwnerEmailGate>;
}
