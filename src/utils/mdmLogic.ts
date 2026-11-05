import {
  ALL_CLASSES,
  ClassId,
  DailyMDMRecord,
  MasterAdmission,
  OverallSummary,
  SECTIONS,
  SectionKey,
  SectionSummary,
} from '../types/mdm';

/**
 * Calculates section summaries for a given daily record compared to master admission
 */
export function calculateSectionSummaries(
  record: DailyMDMRecord,
  master: MasterAdmission
): Record<SectionKey, SectionSummary> {
  const result = {} as Record<SectionKey, SectionSummary>;

  for (const section of SECTIONS) {
    let enrolledBoys = 0;
    let enrolledGirls = 0;
    let attendedBoys = 0;
    let attendedGirls = 0;
    let eggCount = 0;
    let bananaCount = 0;

    for (const classId of section.classes) {
      const adm = master.admissions[classId] || { boys: 0, girls: 0, total: 0 };
      const daily = record.classes[classId] || {
        boys: 0,
        girls: 0,
        total: 0,
        egg: 0,
        banana: 0,
      };

      enrolledBoys += adm.boys || 0;
      enrolledGirls += adm.girls || 0;
      attendedBoys += daily.boys || 0;
      attendedGirls += daily.girls || 0;
      eggCount += daily.egg || 0;
      bananaCount += daily.banana || 0;
    }

    const enrolledTotal = enrolledBoys + enrolledGirls;
    const attendedTotal = attendedBoys + attendedGirls;
    const nutritionTotal = eggCount + bananaCount;
    const isBalanced = attendedTotal === nutritionTotal;
    const attendancePercentage =
      enrolledTotal > 0 ? Math.round((attendedTotal / enrolledTotal) * 1000) / 10 : 0;

    result[section.key] = {
      sectionKey: section.key,
      label: section.label,
      subLabel: section.subLabel,
      enrolledBoys,
      enrolledGirls,
      enrolledTotal,
      attendedBoys,
      attendedGirls,
      attendedTotal,
      eggCount,
      bananaCount,
      nutritionTotal,
      isBalanced,
      attendancePercentage,
    };
  }

  return result;
}

/**
 * Calculates overall grand totals for the school for a single day
 */
export function calculateOverallSummary(
  record: DailyMDMRecord,
  master: MasterAdmission
): OverallSummary {
  let enrolledBoys = 0;
  let enrolledGirls = 0;
  let attendedBoys = 0;
  let attendedGirls = 0;
  let eggTotal = 0;
  let bananaTotal = 0;

  for (const classId of ALL_CLASSES) {
    const adm = master.admissions[classId] || { boys: 0, girls: 0, total: 0 };
    const daily = record.classes[classId] || {
      boys: 0,
      girls: 0,
      total: 0,
      egg: 0,
      banana: 0,
    };

    enrolledBoys += adm.boys || 0;
    enrolledGirls += adm.girls || 0;
    attendedBoys += daily.boys || 0;
    attendedGirls += daily.girls || 0;
    eggTotal += daily.egg || 0;
    bananaTotal += daily.banana || 0;
  }

  const enrolledTotal = enrolledBoys + enrolledGirls;
  const attendedTotal = attendedBoys + attendedGirls;
  const nutritionTotal = eggTotal + bananaTotal;
  const discrepancy = attendedTotal - nutritionTotal;
  const isBalanced = discrepancy === 0;
  const attendancePercentage =
    enrolledTotal > 0 ? Math.round((attendedTotal / enrolledTotal) * 1000) / 10 : 0;

  return {
    enrolledBoys,
    enrolledGirls,
    enrolledTotal,
    attendedBoys,
    attendedGirls,
    attendedTotal,
    eggTotal,
    bananaTotal,
    nutritionTotal,
    isBalanced,
    discrepancy,
    attendancePercentage,
  };
}

/**
 * Auto-balances egg and banana counts for each class or overall:
 * If total students attended = N, sets banana = N - egg (or vice versa)
 */
export function autoBalanceNutrition(
  record: DailyMDMRecord,
  strategy: 'fill-banana' | 'fill-egg' = 'fill-banana'
): DailyMDMRecord {
  const updatedClasses = { ...record.classes };

  for (const classId of ALL_CLASSES) {
    const current = updatedClasses[classId] || {
      classId,
      boys: 0,
      girls: 0,
      total: 0,
      egg: 0,
      banana: 0,
    };

    const totalAttendance = (current.boys || 0) + (current.girls || 0);

    if (strategy === 'fill-banana') {
      const egg = Math.min(current.egg || 0, totalAttendance);
      const banana = Math.max(0, totalAttendance - egg);
      updatedClasses[classId] = {
        ...current,
        total: totalAttendance,
        egg,
        banana,
      };
    } else {
      const banana = Math.min(current.banana || 0, totalAttendance);
      const egg = Math.max(0, totalAttendance - banana);
      updatedClasses[classId] = {
        ...current,
        total: totalAttendance,
        egg,
        banana,
      };
    }
  }

  return {
    ...record,
    classes: updatedClasses,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Filter records by date range (e.g. for weekly or monthly reports)
 */
export function filterRecordsByRange(
  records: DailyMDMRecord[],
  startDate: string,
  endDate: string
): DailyMDMRecord[] {
  return records
    .filter((r) => r.date >= startDate && r.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Filter records by month (YYYY-MM)
 */
export function filterRecordsByMonth(
  records: DailyMDMRecord[],
  yearMonth: string // "YYYY-MM"
): DailyMDMRecord[] {
  return records
    .filter((r) => r.date.startsWith(yearMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregate summary across multiple daily records (for monthly/scheme-wise reporting)
 */
export interface MultiDaySummary {
  workingDays: number;
  totalAttendance: number;
  avgDailyAttendance: number;
  totalBoysAttendance: number;
  totalGirlsAttendance: number;
  totalEggs: number;
  totalBananas: number;
  totalNutrition: number;
  schemeBreakdown: Record<string, { days: number; eggs: number; bananas: number; attendees: number }>;
  classBreakdown: Record<
    ClassId,
    { totalAttendees: number; totalEggs: number; totalBananas: number }
  >;
  sectionBreakdown: Record<
    SectionKey,
    { totalAttendees: number; totalEggs: number; totalBananas: number }
  >;
}

export function aggregateMultiDayRecords(records: DailyMDMRecord[]): MultiDaySummary {
  const workingDays = records.length;
  let totalAttendance = 0;
  let totalBoysAttendance = 0;
  let totalGirlsAttendance = 0;
  let totalEggs = 0;
  let totalBananas = 0;

  const schemeBreakdown: Record<
    string,
    { days: number; eggs: number; bananas: number; attendees: number }
  > = {};

  const classBreakdown = {} as Record<
    ClassId,
    { totalAttendees: number; totalEggs: number; totalBananas: number }
  >;

  for (const cid of ALL_CLASSES) {
    classBreakdown[cid] = { totalAttendees: 0, totalEggs: 0, totalBananas: 0 };
  }

  const sectionBreakdown: Record<
    SectionKey,
    { totalAttendees: number; totalEggs: number; totalBananas: number }
  > = {
    LKG_UKG: { totalAttendees: 0, totalEggs: 0, totalBananas: 0 },
    PRIMARY_1_5: { totalAttendees: 0, totalEggs: 0, totalBananas: 0 },
    HIGHER_6_8: { totalAttendees: 0, totalEggs: 0, totalBananas: 0 },
    HIGH_9_10: { totalAttendees: 0, totalEggs: 0, totalBananas: 0 },
  };

  for (const rec of records) {
    // Scheme aggregation
    if (!schemeBreakdown[rec.scheme]) {
      schemeBreakdown[rec.scheme] = { days: 0, eggs: 0, bananas: 0, attendees: 0 };
    }
    schemeBreakdown[rec.scheme].days += 1;

    let dayAttendance = 0;
    let dayEggs = 0;
    let dayBananas = 0;

    for (const cid of ALL_CLASSES) {
      const cls = rec.classes[cid];
      if (!cls) continue;

      const att = (cls.boys || 0) + (cls.girls || 0);
      const egg = cls.egg || 0;
      const banana = cls.banana || 0;

      totalBoysAttendance += cls.boys || 0;
      totalGirlsAttendance += cls.girls || 0;
      totalAttendance += att;
      totalEggs += egg;
      totalBananas += banana;

      dayAttendance += att;
      dayEggs += egg;
      dayBananas += banana;

      classBreakdown[cid].totalAttendees += att;
      classBreakdown[cid].totalEggs += egg;
      classBreakdown[cid].totalBananas += banana;

      // Section mapping
      if (cid === 'LKG' || cid === 'UKG') {
        sectionBreakdown.LKG_UKG.totalAttendees += att;
        sectionBreakdown.LKG_UKG.totalEggs += egg;
        sectionBreakdown.LKG_UKG.totalBananas += banana;
      } else if (['1', '2', '3', '4', '5'].includes(cid)) {
        sectionBreakdown.PRIMARY_1_5.totalAttendees += att;
        sectionBreakdown.PRIMARY_1_5.totalEggs += egg;
        sectionBreakdown.PRIMARY_1_5.totalBananas += banana;
      } else if (['6', '7', '8'].includes(cid)) {
        sectionBreakdown.HIGHER_6_8.totalAttendees += att;
        sectionBreakdown.HIGHER_6_8.totalEggs += egg;
        sectionBreakdown.HIGHER_6_8.totalBananas += banana;
      } else if (['9', '10'].includes(cid)) {
        sectionBreakdown.HIGH_9_10.totalAttendees += att;
        sectionBreakdown.HIGH_9_10.totalEggs += egg;
        sectionBreakdown.HIGH_9_10.totalBananas += banana;
      }
    }

    schemeBreakdown[rec.scheme].attendees += dayAttendance;
    schemeBreakdown[rec.scheme].eggs += dayEggs;
    schemeBreakdown[rec.scheme].bananas += dayBananas;
  }

  const avgDailyAttendance =
    workingDays > 0 ? Math.round((totalAttendance / workingDays) * 10) / 10 : 0;

  return {
    workingDays,
    totalAttendance,
    avgDailyAttendance,
    totalBoysAttendance,
    totalGirlsAttendance,
    totalEggs,
    totalBananas,
    totalNutrition: totalEggs + totalBananas,
    schemeBreakdown,
    classBreakdown,
    sectionBreakdown,
  };
}
