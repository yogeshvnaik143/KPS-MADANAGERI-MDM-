import * as XLSX from 'xlsx';
import {
  ALL_CLASSES,
  ClassDailyRecord,
  ClassId,
  DailyMDMRecord,
  MasterAdmission,
  SECTIONS,
} from '../types/mdm';
import {
  calculateOverallSummary,
  calculateSectionSummaries,
} from './mdmLogic';

/**
 * Builds a multi-sheet Excel Workbook acting as the complete MDM database
 */
export function buildMDMWorkbook(
  master: MasterAdmission,
  records: DailyMDMRecord[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

  // 1. Primary Sheet: Official KPS Madanageri Register Format (Matches School PDF 1:1)
  const officialRegisterRows: any[] = [];
  for (const rec of sortedRecords) {
    const overall = calculateOverallSummary(rec, master);
    const sections = calculateSectionSummaries(rec, master);

    for (const sec of SECTIONS) {
      const sSum = sections[sec.key];
      const activeClasses = sec.classes.filter(
        (c) => (master.admissions[c]?.total ?? 0) > 0
      );

      for (const cid of activeClasses) {
        const adm = master.admissions[cid] || { boys: 0, girls: 0, total: 0 };
        const cls = rec.classes[cid] || {
          boys: 0,
          girls: 0,
          total: 0,
          egg: 0,
          banana: 0,
        };
        const attTotal = (cls.boys || 0) + (cls.girls || 0);
        const nutTotal = (cls.egg || 0) + (cls.banana || 0);

        officialRegisterRows.push({
          'ದಿನಾಂಕ (Date)': rec.date,
          'SCHEME': rec.scheme,
          'ತರಗತಿ (Class)': cid,
          'ದಾಖಲಾತಿ ಗಂಡು': adm.boys,
          'ದಾಖಲಾತಿ ಹೆಣ್ಣು': adm.girls,
          'ದಾಖಲಾತಿ ಒಟ್ಟು': adm.total,
          'ಹಾಜರಾತಿ ಗಂಡು': cls.boys,
          'ಹಾಜರಾತಿ ಹೆಣ್ಣು': cls.girls,
          'ಹಾಜರಾತಿ ಒಟ್ಟು': attTotal,
          'ಮೊಟ್ಟೆ (Egg)': cls.egg,
          'ಬಾಳೆ ಹಣ್ಣು (Banana)': cls.banana,
          'ತಾಳೆ ಸ್ಥಿತಿ': attTotal === nutTotal ? 'MATCHED' : 'CHECK',
        });
      }

      // Section Subtotal row
      officialRegisterRows.push({
        'ದಿನಾಂಕ (Date)': rec.date,
        'SCHEME': rec.scheme,
        'ತರಗತಿ (Class)': sec.registerLabel,
        'ದಾಖಲಾತಿ ಗಂಡು': sSum.enrolledBoys,
        'ದಾಖಲಾತಿ ಹೆಣ್ಣು': sSum.enrolledGirls,
        'ದಾಖಲಾತಿ ಒಟ್ಟು': sSum.enrolledTotal,
        'ಹಾಜರಾತಿ ಗಂಡು': sSum.attendedBoys,
        'ಹಾಜರಾತಿ ಹೆಣ್ಣು': sSum.attendedGirls,
        'ಹಾಜರಾತಿ ಒಟ್ಟು': sSum.attendedTotal,
        'ಮೊಟ್ಟೆ (Egg)': sSum.eggCount,
        'ಬಾಳೆ ಹಣ್ಣು (Banana)': sSum.bananaCount,
        'ತಾಳೆ ಸ್ಥಿತಿ': sSum.isBalanced ? 'MATCHED' : 'CHECK',
      });
    }

    // Day Grand Total Row
    officialRegisterRows.push({
      'ದಿನಾಂಕ (Date)': rec.date,
      'SCHEME': rec.scheme,
      'ತರಗತಿ (Class)': 'total',
      'ದಾಖಲಾತಿ ಗಂಡು': overall.enrolledBoys,
      'ದಾಖಲಾತಿ ಹೆಣ್ಣು': overall.enrolledGirls,
      'ದಾಖಲಾತಿ ಒಟ್ಟು': overall.enrolledTotal,
      'ಹಾಜರಾತಿ ಗಂಡು': overall.attendedBoys,
      'ಹಾಜರಾತಿ ಹೆಣ್ಣು': overall.attendedGirls,
      'ಹಾಜರಾತಿ ಒಟ್ಟು': overall.attendedTotal,
      'ಮೊಟ್ಟೆ (Egg)': overall.eggTotal,
      'ಬಾಳೆ ಹಣ್ಣು (Banana)': overall.bananaTotal,
      'ತಾಳೆ ಸ್ಥಿತಿ': overall.isBalanced ? 'MATCHED' : 'CHECK',
    });

    // Blank separator row between days
    officialRegisterRows.push({});
  }

  const officialSheet = XLSX.utils.json_to_sheet(officialRegisterRows);
  XLSX.utils.book_append_sheet(wb, officialSheet, 'ವಹಿ_Official_Register');
  const masterRows: any[] = [
    {
      'School Name': master.schoolName,
      'DISE Code': master.diseCode,
      'Academic Year': master.academicYear,
      'Last Updated': master.lastUpdated,
    },
    {}, // empty row
    {
      'Class / Standard': 'Class',
      'Boys Admission': 'Boys Enrolled',
      'Girls Admission': 'Girls Enrolled',
      'Total Admission': 'Total Enrolled',
      'Section Category': 'Section',
    },
  ];

  for (const cid of ALL_CLASSES) {
    const adm = master.admissions[cid];
    let secName = '1st Section: LKG & UKG';
    if (['1', '2', '3', '4', '5'].includes(cid)) secName = '2nd Section: 1 to 5';
    else if (['6', '7', '8'].includes(cid)) secName = '3rd Section: 6 to 8';
    else if (['9', '10'].includes(cid)) secName = '4th Section: 9 to 10';

    masterRows.push({
      'Class / Standard': `Class ${cid}`,
      'Boys Admission': adm ? adm.boys : 0,
      'Girls Admission': adm ? adm.girls : 0,
      'Total Admission': adm ? adm.total : 0,
      'Section Category': secName,
    });
  }

  const masterSheet = XLSX.utils.json_to_sheet(masterRows);
  XLSX.utils.book_append_sheet(wb, masterSheet, 'Master_Admission');

  // 2. Sheet: Daily Class-Wise Register
  const registerRows: any[] = [];
  const chronologicalRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  for (const rec of chronologicalRecords) {
    for (const cid of ALL_CLASSES) {
      const cls = rec.classes[cid];
      if (!cls) continue;
      const totalAttended = (cls.boys || 0) + (cls.girls || 0);
      const isBalanced = totalAttended === (cls.egg || 0) + (cls.banana || 0);

      registerRows.push({
        Date: rec.date,
        Scheme: rec.scheme,
        'Scheme Heir / Sponsor': rec.schemeHeir || rec.scheme,
        Class: `Class ${cid}`,
        'Boys Attended': cls.boys,
        'Girls Attended': cls.girls,
        'Total Attended': totalAttended,
        'Egg Count': cls.egg,
        'Banana Count': cls.banana,
        'Nutrition Total': (cls.egg || 0) + (cls.banana || 0),
        'Is Balanced': isBalanced ? 'YES' : 'NO',
        'Menu Details': rec.menuDetails || '',
      });
    }
  }

  const registerSheet = XLSX.utils.json_to_sheet(registerRows);
  XLSX.utils.book_append_sheet(wb, registerSheet, 'Daily_Class_Register');

  // 3. Sheet: Daily Day Summary (Section totals + Grand totals)
  const dailySummaryRows: any[] = [];
  for (const rec of sortedRecords) {
    const overall = calculateOverallSummary(rec, master);
    const sections = calculateSectionSummaries(rec, master);

    dailySummaryRows.push({
      Date: rec.date,
      Scheme: rec.scheme,
      'Scheme Heir / Sponsor': rec.schemeHeir || rec.scheme,
      // Overall
      'Enrolled Total': overall.enrolledTotal,
      'Total Attendance': overall.attendedTotal,
      'Boys Attendance': overall.attendedBoys,
      'Girls Attendance': overall.attendedGirls,
      'Total Eggs': overall.eggTotal,
      'Total Bananas': overall.bananaTotal,
      'Nutrition Balanced': overall.isBalanced ? 'YES' : 'NO',
      'Attendance %': `${overall.attendancePercentage}%`,
      // Sections
      'Sec 1 (LKG-UKG) Attended': sections.LKG_UKG.attendedTotal,
      'Sec 1 Eggs': sections.LKG_UKG.eggCount,
      'Sec 1 Bananas': sections.LKG_UKG.bananaCount,
      'Sec 2 (1-5) Attended': sections.PRIMARY_1_5.attendedTotal,
      'Sec 2 Eggs': sections.PRIMARY_1_5.eggCount,
      'Sec 2 Bananas': sections.PRIMARY_1_5.bananaCount,
      'Sec 3 (6-8) Attended': sections.HIGHER_6_8.attendedTotal,
      'Sec 3 Eggs': sections.HIGHER_6_8.eggCount,
      'Sec 3 Bananas': sections.HIGHER_6_8.bananaCount,
      'Sec 4 (9-10) Attended': sections.HIGH_9_10.attendedTotal,
      'Sec 4 Eggs': sections.HIGH_9_10.eggCount,
      'Sec 4 Bananas': sections.HIGH_9_10.bananaCount,
      Notes: rec.notes || '',
    });
  }

  const summarySheet = XLSX.utils.json_to_sheet(dailySummaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Daily_Day_Summary');

  // 4. Sheet: Scheme Breakdown (SNF vs APF vs Others)
  const schemeSummary: Record<string, { days: number; attendees: number; eggs: number; bananas: number }> = {};
  for (const rec of sortedRecords) {
    const s = rec.scheme || 'OTHER';
    if (!schemeSummary[s]) schemeSummary[s] = { days: 0, attendees: 0, eggs: 0, bananas: 0 };
    const ov = calculateOverallSummary(rec, master);
    schemeSummary[s].days += 1;
    schemeSummary[s].attendees += ov.attendedTotal;
    schemeSummary[s].eggs += ov.eggTotal;
    schemeSummary[s].bananas += ov.bananaTotal;
  }

  const schemeRows = Object.entries(schemeSummary).map(([schemeKey, data]) => ({
    Scheme: schemeKey,
    'Total Days Served': data.days,
    'Total Student Meals': data.attendees,
    'Total Eggs Distributed': data.eggs,
    'Total Bananas Distributed': data.bananas,
    'Average Eggs Per Serving Day':
      data.days > 0 ? Math.round(data.eggs / data.days) : 0,
    'Average Bananas Per Serving Day':
      data.days > 0 ? Math.round(data.bananas / data.days) : 0,
  }));

  const schemeSheet = XLSX.utils.json_to_sheet(schemeRows);
  XLSX.utils.book_append_sheet(wb, schemeSheet, 'Scheme_Analysis');

  return wb;
}

/**
 * Downloads the workbook directly to the user's computer as an .xlsx file
 */
export function exportMDMToExcelFile(
  master: MasterAdmission,
  records: DailyMDMRecord[],
  fileNamePrefix: string = 'KPS_Madanageri_MDM_Database'
): void {
  const wb = buildMDMWorkbook(master, records);
  const nowStr = new Date().toISOString().slice(0, 10);
  const filename = `${fileNamePrefix}_${nowStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Parses an uploaded Excel file to restore or sync database
 */
export async function parseMDMExcelFile(file: File): Promise<{
  master?: MasterAdmission;
  records?: DailyMDMRecord[];
  error?: string;
}> {
  try {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });

    // Look for Daily_Class_Register or similar sheet
    const registerSheet = wb.Sheets['Daily_Class_Register'] || wb.Sheets[wb.SheetNames[0]];
    if (!registerSheet) {
      return { error: 'No recognizable register sheet found in this Excel workbook.' };
    }

    const jsonData: any[] = XLSX.utils.sheet_to_json(registerSheet);
    if (!jsonData || jsonData.length === 0) {
      return { error: 'The Excel sheet is empty.' };
    }

    // Group rows by Date
    const recordsMap: Record<string, DailyMDMRecord> = {};

    for (const row of jsonData) {
      const dateStr = row['Date'] || row['date'];
      if (!dateStr) continue;

      let rawClass = String(row['Class'] || row['class'] || '');
      const match = rawClass.match(/(LKG|UKG|10|[1-9])/i);
      const matched = match ? (match[1].toUpperCase() as ClassId) : null;
      if (!matched || !ALL_CLASSES.includes(matched)) continue;
      const classId: ClassId = matched;

      if (!recordsMap[dateStr]) {
        recordsMap[dateStr] = {
          id: dateStr,
          date: dateStr,
          scheme: (row['Scheme'] || 'SNF') as any,
          schemeHeir: row['Scheme Heir / Sponsor'] || row['Scheme'] || 'SNF',
          menuDetails: row['Menu Details'] || 'Mid Day Meal with Egg / Banana',
          classes: {} as Record<ClassId, ClassDailyRecord>,
          notes: row['Notes'] || '',
          updatedAt: new Date().toISOString(),
        };
      }

      const boys = Number(row['Boys Attended'] || row['boys'] || 0);
      const girls = Number(row['Girls Attended'] || row['girls'] || 0);
      const egg = Number(row['Egg Count'] || row['egg'] || 0);
      const banana = Number(row['Banana Count'] || row['banana'] || 0);

      recordsMap[dateStr].classes[classId] = {
        classId,
        boys,
        girls,
        total: boys + girls,
        egg,
        banana,
      };
    }

    const parsedRecords = Object.values(recordsMap);

    return {
      records: parsedRecords,
    };
  } catch (err: any) {
    return { error: err.message || 'Failed to read Excel file' };
  }
}
