/**
 * BSD-YBM ERP v6 — unified data client surface (server + browser).
 * Primary store: Firebase (Auth, Firestore, Storage). SQL: Prisma optional.
 */
import { isFirebaseConfigured } from '@/lib/firebase';
import { isDatabaseConfigured } from '@/lib/databaseConfig';
import { isFirebaseAdminConfigured } from '@/lib/firebaseAdmin';

export { getFirebaseApp, getFirebaseAuth, getFirebaseStorage, isFirebaseConfigured } from '@/lib/firebase';
export { getDb, companyPayrollEntriesRef, companyProjectsRef, companyPresenceRef } from '@/lib/firestore';
export { prisma } from '@/lib/prisma';
export { isDatabaseConfigured } from '@/lib/databaseConfig';
export { isFirebaseAdminConfigured, getAdminFirestore, getAdminAuth } from '@/lib/firebaseAdmin';

export function isClientDbReady(): boolean {
  return isFirebaseConfigured();
}

export function isServerDbReady(): boolean {
  return isFirebaseAdminConfigured() || isDatabaseConfigured();
}

export function describeBackendReadiness(): {
  firebaseClient: boolean;
  firebaseAdmin: boolean;
  postgres: boolean;
} {
  return {
    firebaseClient: isFirebaseConfigured(),
    firebaseAdmin: isFirebaseAdminConfigured(),
    postgres: isDatabaseConfigured(),
  };
}
