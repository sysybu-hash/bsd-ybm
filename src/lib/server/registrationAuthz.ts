import type { Firestore } from 'firebase-admin/firestore';
import { isMasterAdminEmail } from '@/lib/platformOwners';

async function isPlatformGlobalUser(
  db: Firestore,
  uid: string,
  requesterEmail?: string | null
): Promise<boolean> {
  const userSnap = await db.collection('users').doc(uid).get();
  const sr = userSnap.data()?.systemRole as string | undefined;
  if (sr === 'developer' || sr === 'global_manager' || sr === 'master_admin') {
    return true;
  }
  if (isMasterAdminEmail(requesterEmail)) {
    return true;
  }
  return false;
}

export async function assertCanApproveRegistrations(
  db: Firestore,
  adminUid: string,
  companyId: string,
  requesterEmail?: string | null
): Promise<void> {
  if (await isPlatformGlobalUser(db, adminUid, requesterEmail)) {
    return;
  }

  const memberSnap = await db
    .collection('companies')
    .doc(companyId)
    .collection('members')
    .doc(adminUid)
    .get();

  if (!memberSnap.exists || memberSnap.data()?.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
}

export async function getApproverSystemRole(
  db: Firestore,
  adminUid: string
): Promise<string | null> {
  const userSnap = await db.collection('users').doc(adminUid).get();
  return (userSnap.data()?.systemRole as string | undefined) ?? null;
}

/** Global staff or company member with a non-client role (read Meckano reports, etc.). */
export async function assertCompanyStaffNotClient(
  db: Firestore,
  uid: string,
  companyId: string,
  requesterEmail?: string | null
): Promise<void> {
  if (await isPlatformGlobalUser(db, uid, requesterEmail)) {
    return;
  }

  const memberSnap = await db
    .collection('companies')
    .doc(companyId)
    .collection('members')
    .doc(uid)
    .get();

  if (!memberSnap.exists) {
    throw new Error('FORBIDDEN');
  }

  const role = memberSnap.data()?.role as string | undefined;
  if (role === 'client') {
    throw new Error('FORBIDDEN');
  }
}

/** Master admin only (SYSYBU allow-list or `users.systemRole === master_admin`). */
/** Client member with project on allow-list (contract signing, portal). */
export async function assertClientMayAccessProject(
  db: Firestore,
  uid: string,
  companyId: string,
  projectId: string,
  requesterEmail?: string | null
): Promise<void> {
  if (await isPlatformGlobalUser(db, uid, requesterEmail)) {
    return;
  }
  const memberSnap = await db.collection('companies').doc(companyId).collection('members').doc(uid).get();
  if (!memberSnap.exists) {
    throw new Error('FORBIDDEN');
  }
  const role = memberSnap.data()?.role as string | undefined;
  if (role !== 'client') {
    throw new Error('FORBIDDEN');
  }
  const allowed = (memberSnap.data()?.allowedProjectIds as string[] | undefined) ?? [];
  if (!allowed.includes(projectId)) {
    throw new Error('FORBIDDEN');
  }
}

export async function assertMasterAdmin(
  db: Firestore,
  uid: string,
  requesterEmail?: string | null
): Promise<void> {
  if (isMasterAdminEmail(requesterEmail)) {
    return;
  }
  const userSnap = await db.collection('users').doc(uid).get();
  const sr = userSnap.data()?.systemRole as string | undefined;
  if (sr === 'master_admin') {
    return;
  }
  throw new Error('FORBIDDEN');
}
