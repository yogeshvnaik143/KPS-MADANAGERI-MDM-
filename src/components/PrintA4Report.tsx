import React, { useState } from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import {
  ALL_CLASSES,
  DailyMDMRecord,
  MasterAdmission,
  SECTIONS,
} from '../types/mdm';
import {
  calculateOverallSummary,
  calculateSectionSummaries,
  filterRecordsByMonth,
  aggregateMultiDayRecords,
} from '../utils/mdmLogic';

interface PrintA4ReportProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string; // Date (e.g. "2026-11-05") or Month (e.g. "2026-11")
  reportType?: 'daily' | 'monthly' | 'scheme';
  records: DailyMDMRecord[];
  master: MasterAdmission;
}

export const PrintA4Report: React.FC<PrintA4ReportProps> = ({
  isOpen,
  onClose,
  targetId,
  reportType = 'daily',
  records,
  master,
}) => {
  const [printMode, setPrintMode] = useState<'filled' | 'blank'>('filled');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isDaily = reportType === 'daily';
  const dailyRecord = records.find((r) => r.date === targetId) || records[0];

  const overall = dailyRecord ? calculateOverallSummary(dailyRecord, master) : null;
  const sections = dailyRecord ? calculateSectionSummaries(dailyRecord, master) : null;

  // Monthly data if monthly/scheme report
  const monthRecords = filterRecordsByMonth(records, targetId.slice(0, 7));
  const monthSummary = aggregateMultiDayRecords(monthRecords);

  // Format date display (DD-MM-YYYY)
  const formatDateDisplay = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Dialog */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[96vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none">
        {/* Top Control Bar - Hidden when printing */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-bold text-sm sm:text-base">
                A4 ಗಾತ್ರದ ಅಧಿಕೃತ ವಹಿ ಮುದ್ರಣ (Official Register Print)
              </span>
              <div className="text-xs text-slate-300">
                ಕರ್ನಾಟಕ ಪಬ್ಲಿಕ್ ಸ್ಕೂಲ್ ಮಾದನಗೇರಿ • DISE: 29010401802
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Filled vs Blank Template */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('filled')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  printMode === 'filled'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ಭರ್ತಿ ಮಾಡಿದ ವಹಿ (Filled)
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('blank')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  printMode === 'blank'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ಖಾಲಿ ವಹಿ (Blank Template)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= EXACT A4 PHYSICAL PRINTABLE REGISTER ================= */}
        <div
          id="printable-a4-document"
          className="p-8 sm:p-10 bg-white text-slate-900 font-sans max-w-[210mm] mx-auto print:p-2 print:max-w-none text-xs"
        >
          {/* Header matching Karnataka Public School Madanageri Register */}
          <div className="text-center mb-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight font-sans">
              ಕರ್ನಾಟಕ ಪಬ್ಲಿಕ್ ಸ್ಕೂಲ್ ಮಾದನಗೇರಿ
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
              ದೈನಂದಿನ ಹಾಜರಾತಿ ಮತ್ತು ಬಿಸಿಯೂಟ ಹಾಗೂ ಮೊಟ್ಟೆ ಮತ್ತು ಬಾಳೆಹಣ್ಣು ವಹಿ
            </h2>
            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
              Karnataka Public School, Madanageri • DISE: 29010401802 • ಶೈಕ್ಷಣಿಕ ವರ್ಷ: 2026-27
            </div>
          </div>

          {/* Meta Bar: SCHEME and ದಿನಾಂಕ */}
          <div className="border border-slate-900 flex items-stretch text-xs font-bold mb-2">
            <div className="p-2 bg-slate-100 border-r border-slate-900 w-24 uppercase">
              SCHEME
            </div>
            <div className="p-2 border-r border-slate-900 flex-1 font-black text-sm">
              {dailyRecord?.scheme === 'SNF'
                ? 'SNF (Sri Sathya Sai Annapoorna Foundation)'
                : dailyRecord?.scheme === 'APF'
                ? 'APF (Azim Premji Foundation)'
                : 'SNF or APF'}
            </div>
            <div className="p-2 bg-slate-100 border-r border-slate-900 w-24 text-center">
              ದಿನಾಂಕ
            </div>
            <div className="p-2 w-36 font-black text-sm text-center">
              {isDaily ? formatDateDisplay(dailyRecord?.date || targetId) : targetId}
            </div>
          </div>

          {/* The Exact Register Table matching User PDF 1:1 */}
          <table className="w-full border-collapse border-2 border-slate-900 text-center text-xs">
            <thead>
              {/* Header Row 1 */}
              <tr className="bg-slate-100 font-black border-b border-slate-900">
                <th
                  rowSpan={2}
                  className="border border-slate-900 py-2 px-2 text-left w-24 bg-slate-200"
                >
                  ತರಗತಿ
                </th>
                <th
                  colSpan={3}
                  className="border border-slate-900 py-1.5 px-2 bg-slate-150"
                >
                  ದಾಖಲಾತಿ
                </th>
                <th
                  colSpan={3}
                  className="border border-slate-900 py-1.5 px-2 bg-slate-100"
                >
                  ಹಾಜರಾತಿ
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-900 py-2 px-2 w-20"
                >
                  ಮೊಟ್ಟೆ
                </th>
                <th
                  rowSpan={2}
                  className="border border-slate-900 py-2 px-2 w-20"
                >
                  ಬಾಳೆ ಹಣ್ಣು
                </th>
              </tr>

              {/* Header Row 2 */}
              <tr className="bg-slate-50 font-bold border-b-2 border-slate-900">
                {/* Admission */}
                <th className="border border-slate-900 py-1 px-1 w-14">ಗಂಡು</th>
                <th className="border border-slate-900 py-1 px-1 w-14">ಹೆಣ್ಣು</th>
                <th className="border border-slate-900 py-1 px-1 w-14 bg-slate-200">ಒಟ್ಟು</th>

                {/* Attendance */}
                <th className="border border-slate-900 py-1 px-1 w-16">ಗಂಡು</th>
                <th className="border border-slate-900 py-1 px-1 w-16">ಹೆಣ್ಣು</th>
                <th className="border border-slate-900 py-1 px-1 w-16 bg-slate-200">ಒಟ್ಟು</th>
              </tr>
            </thead>

            <tbody>
              {SECTIONS.map((section) => {
                const sSummary = sections ? sections[section.key] : null;

                // For KPS Madanageri, show classes with enrollment (LKG, 1-9)
                const activeClasses = section.classes.filter(
                  (cid) => (master.admissions[cid]?.total ?? 0) > 0
                );

                return (
                  <React.Fragment key={section.key}>
                    {/* Individual Class Rows */}
                    {activeClasses.map((cid) => {
                      const adm = master.admissions[cid] || { boys: 0, girls: 0, total: 0 };
                      const cls = dailyRecord?.classes[cid] || {
                        boys: 0,
                        girls: 0,
                        total: 0,
                        egg: 0,
                        banana: 0,
                      };
                      const attTotal = (cls.boys || 0) + (cls.girls || 0);

                      return (
                        <tr
                          key={cid}
                          className="border-b border-slate-900 text-slate-900"
                        >
                          {/* Class Name */}
                          <td className="border border-slate-900 py-1 px-2 text-left font-bold">
                            {cid}
                          </td>

                          {/* Admission: Boys, Girls, Total (Fixed from School Document) */}
                          <td className="border border-slate-900 py-1 px-1 font-semibold">
                            {adm.boys}
                          </td>
                          <td className="border border-slate-900 py-1 px-1 font-semibold">
                            {adm.girls}
                          </td>
                          <td className="border border-slate-900 py-1 px-1 font-black bg-slate-100">
                            {adm.total}
                          </td>

                          {/* Attendance: Boys, Girls, Total */}
                          <td className="border border-slate-900 py-1 px-1 font-medium">
                            {printMode === 'filled' ? cls.boys : ''}
                          </td>
                          <td className="border border-slate-900 py-1 px-1 font-medium">
                            {printMode === 'filled' ? cls.girls : ''}
                          </td>
                          <td className="border border-slate-900 py-1 px-1 font-black bg-slate-100">
                            {printMode === 'filled' ? attTotal : ''}
                          </td>

                          {/* Egg & Banana */}
                          <td className="border border-slate-900 py-1 px-1 font-medium">
                            {printMode === 'filled' ? cls.egg : ''}
                          </td>
                          <td className="border border-slate-900 py-1 px-1 font-medium">
                            {printMode === 'filled' ? cls.banana : ''}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Section Subtotal Row matching the exact PDF labels: pre-school, 1 to 5, 6 to 8, 9th */}
                    <tr className="border-y-2 border-slate-900 bg-slate-100 font-black">
                      <td className="border border-slate-900 py-1 px-2 text-left font-black">
                        {section.registerLabel}
                      </td>

                      {/* Admission Subtotals */}
                      <td className="border border-slate-900 py-1 px-1">
                        {sSummary ? sSummary.enrolledBoys : 0}
                      </td>
                      <td className="border border-slate-900 py-1 px-1">
                        {sSummary ? sSummary.enrolledGirls : 0}
                      </td>
                      <td className="border border-slate-900 py-1 px-1 font-black bg-slate-200">
                        {sSummary ? sSummary.enrolledTotal : 0}
                      </td>

                      {/* Attendance Subtotals */}
                      <td className="border border-slate-900 py-1 px-1">
                        {printMode === 'filled' && sSummary ? sSummary.attendedBoys : ''}
                      </td>
                      <td className="border border-slate-900 py-1 px-1">
                        {printMode === 'filled' && sSummary ? sSummary.attendedGirls : ''}
                      </td>
                      <td className="border border-slate-900 py-1 px-1 font-black bg-slate-200">
                        {printMode === 'filled' && sSummary ? sSummary.attendedTotal : ''}
                      </td>

                      {/* Egg & Banana Subtotals */}
                      <td className="border border-slate-900 py-1 px-1">
                        {printMode === 'filled' && sSummary ? sSummary.eggCount : ''}
                      </td>
                      <td className="border border-slate-900 py-1 px-1">
                        {printMode === 'filled' && sSummary ? sSummary.bananaCount : ''}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* Bottom Grand Total Row: total (132, 121, 253) */}
              <tr className="border-t-2 border-slate-900 bg-slate-200 font-black text-sm">
                <td className="border border-slate-900 py-2 px-2 text-left uppercase">
                  total
                </td>

                {/* Admission Grand Total: 132, 121, 253 */}
                <td className="border border-slate-900 py-2 px-1">
                  {overall ? overall.enrolledBoys : 132}
                </td>
                <td className="border border-slate-900 py-2 px-1">
                  {overall ? overall.enrolledGirls : 121}
                </td>
                <td className="border border-slate-900 py-2 px-1 font-black bg-slate-300">
                  {overall ? overall.enrolledTotal : 253}
                </td>

                {/* Attendance Grand Total */}
                <td className="border border-slate-900 py-2 px-1">
                  {printMode === 'filled' && overall ? overall.attendedBoys : ''}
                </td>
                <td className="border border-slate-900 py-2 px-1">
                  {printMode === 'filled' && overall ? overall.attendedGirls : ''}
                </td>
                <td className="border border-slate-900 py-2 px-1 font-black bg-slate-300">
                  {printMode === 'filled' && overall ? overall.attendedTotal : ''}
                </td>

                {/* Egg & Banana Grand Total */}
                <td className="border border-slate-900 py-2 px-1">
                  {printMode === 'filled' && overall ? overall.eggTotal : ''}
                </td>
                <td className="border border-slate-900 py-2 px-1">
                  {printMode === 'filled' && overall ? overall.bananaTotal : ''}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Verification & Reconciliation note */}
          {printMode === 'filled' && overall && (
            <div className="mt-3 text-[11px] text-slate-700 font-semibold flex items-center justify-between border-b border-slate-300 pb-2">
              <span>
                ದೈನಂದಿನ ಆಹಾರ ಮೆನು: <strong>{dailyRecord?.menuDetails || 'ಬಿಸಿಯೂಟ, ಸಾಂಬಾರ್, ಮೊಟ್ಟೆ / ಬಾಳೆಹಣ್ಣು'}</strong>
              </span>
              <span>
                ತಾಳೆ ಸ್ಥಿತಿ: <strong>{overall.isBalanced ? 'ಸರಿಯಾಗಿದೆ (Matched ✓)' : 'ವ್ಯತ್ಯಾಸ'}</strong> (ಹಾಜರಾತಿ {overall.attendedTotal} = ಮೊಟ್ಟೆ {overall.eggTotal} + ಬಾಳೆಹಣ್ಣು {overall.bananaTotal})
              </span>
            </div>
          )}

          {/* Official 4 Signatures Block for Karnataka School Inspection */}
          <div className="mt-8 pt-4 border-t-2 border-slate-800 grid grid-cols-4 gap-4 text-center text-xs font-bold text-slate-900">
            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">
                ಅಡುಗೆ ಸಿಬ್ಬಂದಿ ಸಹಿ
              </div>
              <div className="text-[10px] text-slate-500 font-normal">
                (Cook / Kitchen Staff)
              </div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">
                ಬಿಸಿಯೂಟ ಪ್ರಭಾರಿ ಶಿಕ್ಷಕರು
              </div>
              <div className="text-[10px] text-slate-500 font-normal">
                (MDM Incharge Teacher)
              </div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">
                SDMC ಅಧ್ಯಕ್ಷರು
              </div>
              <div className="text-[10px] text-slate-500 font-normal">
                (SDMC President)
              </div>
            </div>

            <div>
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1">
                ಮುಖ್ಯ ಶಿಕ್ಷಕರು (ಮೊಹರು)
              </div>
              <div className="text-[10px] text-slate-500 font-normal">
                (Head Master & Seal)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
