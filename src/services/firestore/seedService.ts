import { writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firestore';

export const PRIMARY_COMPANY_ID = 'bsd-ybm-primary-tenant';
export const PRIMARY_COMPANY_NAME = "ג'רוזלם בילדרס פרויקטים בע\"מ";
export const PRIMARY_ADMIN_NAME = 'Haim Adler';

export async function seedPrimaryCompany(params: {
  uid: string;
  email?: string | null;
}) {
  const { uid, email } = params;
  if (!uid) throw new Error('uid is required for seeding');

  const db = getDb();
  const batch = writeBatch(db);

  const companyRef = doc(db, 'companies', PRIMARY_COMPANY_ID);
  const memberRef = doc(db, 'companies', PRIMARY_COMPANY_ID, 'members', uid);
  const userRef = doc(db, 'users', uid);
  const userCompanyRef = doc(db, 'users', uid, 'companies', PRIMARY_COMPANY_ID);

  batch.set(
    companyRef,
    {
      name: PRIMARY_COMPANY_NAME,
      legalNameEn: 'BSD-YBM Demo Tenant Ltd',
      brandColor: '#004694',
      primaryActionColor: '#FF8C00',
      createdByUid: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    memberRef,
    {
      uid,
      role: 'admin',
      displayName: PRIMARY_ADMIN_NAME,
      email: email ?? null,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    userRef,
    {
      uid,
      displayName: PRIMARY_ADMIN_NAME,
      email: email ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    userCompanyRef,
    {
      companyId: PRIMARY_COMPANY_ID,
      displayName: PRIMARY_COMPANY_NAME,
      role: 'admin',
      active: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}
