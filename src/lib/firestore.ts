import {
  collection,
  doc,
  getFirestore,
  type CollectionReference,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import { getFirebaseApp, isFirebaseConfigured } from '@/lib/firebase';

let db: Firestore | null = null;

export function getDb(): Firestore {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Missing NEXT_PUBLIC_FIREBASE_* env vars.');
  }
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export function requireCompanyId(companyId?: string | null): string {
  if (!companyId || companyId.trim().length === 0) {
    throw new Error('companyId is required for all tenant-scoped Firestore operations.');
  }
  return companyId;
}

export function companyDocRef(companyId: string): DocumentReference {
  const cid = requireCompanyId(companyId);
  return doc(getDb(), 'companies', cid);
}

export function companyCollectionRef(path: string, companyId: string): CollectionReference {
  const cid = requireCompanyId(companyId);
  return collection(getDb(), 'companies', cid, path);
}

export function companyProjectsRef(companyId: string): CollectionReference {
  return companyCollectionRef('projects', companyId);
}

/** Client ↔ dashboard: messages & tasks on a project */
export function projectCommunicationsRef(companyId: string, projectId: string): CollectionReference {
  const cid = requireCompanyId(companyId);
  if (!projectId || !String(projectId).trim()) {
    throw new Error('projectId is required');
  }
  const pid = String(projectId).trim();
  return collection(getDb(), 'companies', cid, 'projects', pid, 'communications');
}

export function projectMilestonesRef(companyId: string, projectId: string): CollectionReference {
  const cid = requireCompanyId(companyId);
  if (!projectId || !String(projectId).trim()) {
    throw new Error('projectId is required');
  }
  const pid = String(projectId).trim();
  return collection(getDb(), 'companies', cid, 'projects', pid, 'milestones');
}

export function companyTeamRef(companyId: string): CollectionReference {
  return companyCollectionRef('team', companyId);
}

export function companyFinancesRef(companyId: string): CollectionReference {
  return companyCollectionRef('finances', companyId);
}

export function companyAttendanceRef(companyId: string): CollectionReference {
  return companyCollectionRef('attendance', companyId);
}

export function companyScansRef(companyId: string): CollectionReference {
  return companyCollectionRef('scans', companyId);
}

export function companyQuotesRef(companyId: string): CollectionReference {
  return companyCollectionRef('quotes', companyId);
}

export function companyClientsRef(companyId: string): CollectionReference {
  return companyCollectionRef('clients', companyId);
}

export function companyMembersRef(companyId: string): CollectionReference {
  return companyCollectionRef('members', companyId);
}

/** Pending join / registration queue (doc id = applicantUid) */
export function companyRegistrationQueueRef(companyId: string): CollectionReference {
  return companyCollectionRef('registrationQueue', companyId);
}

/** Active session heartbeats for “Who is online” */
export function companyPresenceRef(companyId: string): CollectionReference {
  return companyCollectionRef('presence', companyId);
}

/** Client / runtime error breadcrumbs for the orange status LED */
export function companyRuntimeErrorsRef(companyId: string): CollectionReference {
  return companyCollectionRef('runtimeErrors', companyId);
}

export function userCompaniesRef(uid: string): CollectionReference {
  if (!uid) throw new Error('uid is required');
  return collection(getDb(), 'users', uid, 'companies');
}
