import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, SCHOOL_DOC_ID } from '../lib/firebase';
import { DailyMDMRecord, MasterAdmission } from '../types/mdm';

export type SyncState = 'connected' | 'syncing' | 'offline' | 'error';

// Reference to master admission doc
const masterDocRef = doc(db, 'schools', SCHOOL_DOC_ID, 'config', 'master_admission');

// Reference to daily records collection
const dailyRecordsColRef = collection(db, 'schools', SCHOOL_DOC_ID, 'daily_records');

/**
 * Subscribes to real-time changes to Master Admission
 */
export function subscribeToMasterAdmission(
  onUpdate: (master: MasterAdmission) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    masterDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as MasterAdmission;
        onUpdate(data);
      }
    },
    (err) => {
      console.warn('Firestore master subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to real-time changes to all daily records
 */
export function subscribeToDailyRecords(
  onUpdate: (records: DailyMDMRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    dailyRecordsColRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const remoteRecords: DailyMDMRecord[] = [];
        snapshot.forEach((d) => {
          remoteRecords.push(d.data() as DailyMDMRecord);
        });
        onUpdate(remoteRecords);
      }
    },
    (err) => {
      console.warn('Firestore records subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Saves or updates a daily record in Cloud Firestore
 */
export async function saveDailyRecordToCloud(record: DailyMDMRecord): Promise<boolean> {
  try {
    const recordDocRef = doc(db, 'schools', SCHOOL_DOC_ID, 'daily_records', record.date);
    await setDoc(recordDocRef, {
      ...record,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to save record to Firestore cloud:', err);
    return false;
  }
}

/**
 * Saves master admission baseline to Cloud Firestore
 */
export async function saveMasterAdmissionToCloud(master: MasterAdmission): Promise<boolean> {
  try {
    await setDoc(masterDocRef, {
      ...master,
      lastUpdated: new Date().toISOString().slice(0, 10),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to save master admission to Firestore cloud:', err);
    return false;
  }
}

/**
 * Seeds initial local records to Cloud Firestore if cloud collection is currently empty
 */
export async function syncLocalToCloudIfEmpty(
  master: MasterAdmission,
  localRecords: DailyMDMRecord[]
): Promise<{ seeded: boolean; count: number }> {
  try {
    const snapshot = await getDocs(dailyRecordsColRef);
    if (snapshot.empty && localRecords.length > 0) {
      // Seed master doc
      await saveMasterAdmissionToCloud(master);

      // Batch upload initial daily records
      const batch = writeBatch(db);
      for (const rec of localRecords) {
        const rRef = doc(db, 'schools', SCHOOL_DOC_ID, 'daily_records', rec.date);
        batch.set(rRef, rec);
      }
      await batch.commit();
      return { seeded: true, count: localRecords.length };
    }
    return { seeded: false, count: snapshot.size };
  } catch (err) {
    console.warn('Could not sync initial data to cloud:', err);
    return { seeded: false, count: 0 };
  }
}

/**
 * Uploads all local records to Cloud Firestore (manual force sync)
 */
export async function forceSyncAllToCloud(
  master: MasterAdmission,
  records: DailyMDMRecord[]
): Promise<boolean> {
  try {
    await saveMasterAdmissionToCloud(master);
    const batch = writeBatch(db);
    for (const rec of records) {
      const rRef = doc(db, 'schools', SCHOOL_DOC_ID, 'daily_records', rec.date);
      batch.set(rRef, rec, { merge: true });
    }
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Force sync to cloud failed:', err);
    return false;
  }
}
