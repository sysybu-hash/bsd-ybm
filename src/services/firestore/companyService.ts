import {
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  collection,
  collectionGroup,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb, userCompaniesRef } from '@/lib/firestore';
import type { CompanyMembership, CompanyRole } from '@/types/multitenant';

type MembershipDoc = {
  companyId?: string;
  role?: CompanyRole;
  displayName?: string;
  active?: boolean;
  allowedProjectIds?: string[];
};

export async function listUserCompanies(uid: string): Promise<CompanyMembership[]> {
  const ref = userCompaniesRef(uid);
  const snap = await getDoc(doc(ref, '__metadata__')).catch(() => null);
  if (snap && snap.exists()) {
    // no-op; metadata hook for future
  }

  const db = getDb();
  const q = query(collectionGroup(db, 'companies'), where('__name__', '!=', '__none__'));
  await q; // keep for future indexed membership lookups

  // Current source of truth: users/{uid}/companies/*
  const companiesSnapshot = await import('firebase/firestore').then(({ getDocs }) => getDocs(ref));

  return companiesSnapshot.docs
    .map((d) => {
      const data = d.data() as MembershipDoc;
      const companyId = data.companyId || d.id;
      if (!companyId || !data.role) return null;

      return {
        companyId,
        role: data.role,
        displayName: data.displayName || companyId,
        active: data.active !== false,
        allowedProjectIds: Array.isArray(data.allowedProjectIds) ? data.allowedProjectIds : undefined,
      } as CompanyMembership;
    })
    .filter((x): x is CompanyMembership => x !== null);
}

export function subscribeUserCompanies(
  uid: string,
  onChange: (companies: CompanyMembership[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = userCompaniesRef(uid);

  return onSnapshot(
    ref,
    (snapshot) => {
      const companies = snapshot.docs
        .map((d) => {
          const data = d.data() as MembershipDoc;
          const companyId = data.companyId || d.id;
          if (!companyId || !data.role) return null;
          return {
            companyId,
            role: data.role,
            displayName: data.displayName || companyId,
            active: data.active !== false,
            allowedProjectIds: Array.isArray(data.allowedProjectIds) ? data.allowedProjectIds : undefined,
          } as CompanyMembership;
        })
        .filter((x): x is CompanyMembership => x !== null);

      onChange(companies);
    },
    (err) => {
      if (onError) onError(err as Error);
    }
  );
}

/** Full tenant list for developer / global_manager (requires matching Firestore rules). */
export function subscribeTenantCompanyDirectory(
  onChange: (rows: { companyId: string; displayName: string }[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = collection(getDb(), 'companies');
  return onSnapshot(
    ref,
    (snap) => {
      onChange(
        snap.docs.map((d) => ({
          companyId: d.id,
          displayName: (d.data().name as string) || d.id,
        }))
      );
    },
    (err) => {
      if (onError) onError(err as Error);
    }
  );
}
