import OwnerEmailGate from '@/components/owner/OwnerEmailGate';

/** Top-level owner tools — same hard email gate as dashboard owner-only (`sysybu@gmail.com`). */
export default function OwnerZoneLayout({ children }: { children: React.ReactNode }) {
  return <OwnerEmailGate>{children}</OwnerEmailGate>;
}
