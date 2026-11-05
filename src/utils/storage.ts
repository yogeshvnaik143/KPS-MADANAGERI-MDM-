import {
  ALL_CLASSES,
  DailyMDMRecord,
  MasterAdmission,
  SchemeType,
} from '../types/mdm';

const MASTER_KEY = 'kps_mdm_master_admission_v2';
const DAILY_RECORDS_KEY = 'kps_mdm_daily_records_v2';
const AUTO_EXPORT_KEY = 'kps_mdm_auto_export_setting_v2';

export const DEFAULT_MASTER_ADMISSION: MasterAdmission = {
  schoolName: 'Karnataka Public School, Madanageri',
  diseCode: '29010401802',
  academicYear: '2026-27',
  lastUpdated: '2026-11-01',
  admissions: {
    LKG: { classId: 'LKG', boys: 17, girls: 18, total: 35 },
    UKG: { classId: 'UKG', boys: 0, girls: 0, total: 0 },
    '1': { classId: '1', boys: 3, girls: 4, total: 7 },
    '2': { classId: '2', boys: 9, girls: 6, total: 15 },
    '3': { classId: '3', boys: 7, girls: 5, total: 12 },
    '4': { classId: '4', boys: 9, girls: 9, total: 18 },
    '5': { classId: '5', boys: 11, girls: 11, total: 22 },
    '6': { classId: '6', boys: 18, girls: 16, total: 34 },
    '7': { classId: '7', boys: 28, girls: 22, total: 50 },
    '8': { classId: '8', boys: 13, girls: 15, total: 28 },
    '9': { classId: '9', boys: 17, girls: 15, total: 32 },
    '10': { classId: '10', boys: 0, girls: 0, total: 0 },
  },
};

/**
 * Generates an authentic seed record for a specific date
 */
export function generateSeedDailyRecord(
  dateStr: string,
  scheme: SchemeType = 'SNF',
  attendanceRatio = 0.92,
  eggRatio = 0.72
): DailyMDMRecord {
  const schemeName =
    scheme === 'SNF'
      ? 'Sri Sathya Sai Annapoorna Foundation (SNF)'
      : scheme === 'APF'
      ? 'Azim Premji Foundation (APF)'
      : 'State Govt PM POSHAN';

  const classes: any = {};

  for (const cid of ALL_CLASSES) {
    const adm = DEFAULT_MASTER_ADMISSION.admissions[cid];
    const boysAttended = Math.round(adm.boys * attendanceRatio);
    const girlsAttended = Math.round(adm.girls * attendanceRatio);
    const totalAttended = boysAttended + girlsAttended;

    // Split between Egg and Banana
    const eggCount = Math.round(totalAttended * eggRatio);
    const bananaCount = totalAttended - eggCount; // Strictly balanced!

    classes[cid] = {
      classId: cid,
      boys: boysAttended,
      girls: girlsAttended,
      total: totalAttended,
      egg: eggCount,
      banana: bananaCount,
    };
  }

  return {
    id: dateStr,
    date: dateStr,
    scheme,
    schemeHeir: schemeName,
    menuDetails: 'Hot cooked meal, Sambar, Green Gram Curry, Boiled Egg / Fresh Banana',
    classes,
    notes: `Routine distribution under ${scheme} nutrition schedule. All hygiene checks passed.`,
    verifiedBy: 'HM & MDM Incharge',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates past 10 working days of seed data
 */
export function generateDefaultRecords(): DailyMDMRecord[] {
  const records: DailyMDMRecord[] = [];
  const baseDates = [
    { date: '2026-11-05', scheme: 'SNF' as SchemeType, att: 0.94, egg: 0.74 },
    { date: '2026-11-04', scheme: 'APF' as SchemeType, att: 0.91, egg: 0.70 },
    { date: '2026-11-03', scheme: 'SNF' as SchemeType, att: 0.93, egg: 0.72 },
    { date: '2026-11-02', scheme: 'APF' as SchemeType, att: 0.90, egg: 0.75 },
    { date: '2026-10-31', scheme: 'SNF' as SchemeType, att: 0.89, egg: 0.71 },
    { date: '2026-10-30', scheme: 'APF' as SchemeType, att: 0.95, egg: 0.76 },
    { date: '2026-10-29', scheme: 'SNF' as SchemeType, att: 0.92, egg: 0.73 },
    { date: '2026-10-28', scheme: 'APF' as SchemeType, att: 0.93, egg: 0.69 },
    { date: '2026-10-27', scheme: 'SNF' as SchemeType, att: 0.91, egg: 0.72 },
    { date: '2026-10-26', scheme: 'GOVT' as SchemeType, att: 0.94, egg: 0.74 },
  ];

  for (const item of baseDates) {
    records.push(
      generateSeedDailyRecord(item.date, item.scheme, item.att, item.egg)
    );
  }

  return records;
}

export function loadMasterAdmission(): MasterAdmission {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate structure has admissions
      if (parsed && parsed.admissions) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading master admission:', err);
  }

  // Fallback to default and persist
  saveMasterAdmission(DEFAULT_MASTER_ADMISSION);
  return DEFAULT_MASTER_ADMISSION;
}

export function saveMasterAdmission(master: MasterAdmission): void {
  try {
    localStorage.setItem(MASTER_KEY, JSON.stringify(master));
  } catch (err) {
    console.error('Error saving master admission:', err);
  }
}

export function loadDailyRecords(): DailyMDMRecord[] {
  try {
    const raw = localStorage.getItem(DAILY_RECORDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading daily records:', err);
  }

  // Seed default records and save
  const seeded = generateDefaultRecords();
  saveDailyRecords(seeded);
  return seeded;
}

export function saveDailyRecords(records: DailyMDMRecord[]): void {
  try {
    localStorage.setItem(DAILY_RECORDS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Error saving daily records:', err);
  }
}

export function createBlankDailyRecord(
  dateStr: string,
  scheme: SchemeType = 'SNF',
  master: MasterAdmission
): DailyMDMRecord {
  const schemeName =
    scheme === 'SNF'
      ? 'Sri Sathya Sai Annapoorna Foundation (SNF)'
      : scheme === 'APF'
      ? 'Azim Premji Foundation (APF)'
      : 'State Govt PM POSHAN';

  const classes: any = {};
  for (const cid of ALL_CLASSES) {
    const adm = master.admissions[cid] || { boys: 0, girls: 0, total: 0 };
    // Pre-fill with reasonable attendance numbers based on admission
    const boysAttended = Math.round(adm.boys * 0.9);
    const girlsAttended = Math.round(adm.girls * 0.9);
    const totalAttended = boysAttended + girlsAttended;
    const eggCount = Math.round(totalAttended * 0.7);
    const bananaCount = totalAttended - eggCount;

    classes[cid] = {
      classId: cid,
      boys: boysAttended,
      girls: girlsAttended,
      total: totalAttended,
      egg: eggCount,
      banana: bananaCount,
    };
  }

  return {
    id: dateStr,
    date: dateStr,
    scheme,
    schemeHeir: schemeName,
    menuDetails: 'Rice, Sambar, Boiled Egg / Robusta Banana',
    classes,
    notes: 'Daily nutritional meal served following government safety norms.',
    updatedAt: new Date().toISOString(),
  };
}

export function resetToSeedData(): { master: MasterAdmission; records: DailyMDMRecord[] } {
  saveMasterAdmission(DEFAULT_MASTER_ADMISSION);
  const seeded = generateDefaultRecords();
  saveDailyRecords(seeded);
  return { master: DEFAULT_MASTER_ADMISSION, records: seeded };
}
