import OwnerEmailGate from '@/components/owner/OwnerEmailGate';

/**
 * Owner Vault — Phase 33 / 36. Enforced email gate (see `OwnerEmailGate`).
 */
export default function OwnerZoneLayout({ children }: { children: React.ReactNode }) {
  return <OwnerEmailGate>{children}</OwnerEmailGate>;
}
