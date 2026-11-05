import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Save,
  Printer,
  FileSpreadsheet,
  Egg,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ALL_CLASSES,
  ClassId,
  DailyMDMRecord,
  MasterAdmission,
  SCHEMES,
  SECTIONS,
  SchemeType,
} from '../types/mdm';
import {
  autoBalanceNutrition,
  calculateOverallSummary,
  calculateSectionSummaries,
} from '../utils/mdmLogic';

interface DailyEntryViewProps {
  currentRecord: DailyMDMRecord;
  master: MasterAdmission;
  allRecords: DailyMDMRecord[];
  onSaveRecord: (record: DailyMDMRecord) => void;
  onSelectDate: (dateStr: string) => void;
  onOpenPrintModal: (dateStr: string) => void;
  onExportExcel: () => void;
}

export const DailyEntryView: React.FC<DailyEntryViewProps> = ({
  currentRecord,
  master,
  allRecords,
  onSaveRecord,
  onSelectDate,
  onOpenPrintModal,
  onExportExcel,
}) => {
  const [record, setRecord] = useState<DailyMDMRecord>(currentRecord);
  const [saveToast, setSaveToast] = useState(false);
  const [showAllClasses, setShowAllClasses] = useState(false);

  // Sync state when currentRecord changes from outside
  React.useEffect(() => {
    setRecord(currentRecord);
  }, [currentRecord]);

  // Derived calculations
  const overall = useMemo(
    () => calculateOverallSummary(record, master),
    [record, master]
  );
  const sectionSummaries = useMemo(
    () => calculateSectionSummaries(record, master),
    [record, master]
  );

  const handleDateChange = (newDate: string) => {
    onSelectDate(newDate);
  };

  const handleSchemeChange = (scheme: SchemeType) => {
    const selectedSchemeInfo = SCHEMES.find((s) => s.id === scheme);
    const updated: DailyMDMRecord = {
      ...record,
      scheme,
      schemeHeir: selectedSchemeInfo?.fullName || scheme,
      updatedAt: new Date().toISOString(),
    };
    setRecord(updated);
  };

  const handleClassValueChange = (
    classId: ClassId,
    field: 'boys' | 'girls' | 'egg' | 'banana',
    val: number
  ) => {
    const num = Math.max(0, isNaN(val) ? 0 : val);
    const currentCls = record.classes[classId] || {
      classId,
      boys: 0,
      girls: 0,
      total: 0,
      egg: 0,
      banana: 0,
    };

    const updatedCls = {
      ...currentCls,
      [field]: num,
    };

    // Recompute total attendance for this class
    updatedCls.total = updatedCls.boys + updatedCls.girls;

    setRecord((prev) => ({
      ...prev,
      classes: {
        ...prev.classes,
        [classId]: updatedCls,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  // 1-click Auto-balance nutrition (sets bananas = total attendance - eggs)
  const handleAutoBalanceAll = () => {
    const balanced = autoBalanceNutrition(record, 'fill-banana');
    setRecord(balanced);
  };

  const handleAutoBalanceClass = (classId: ClassId) => {
    const cls = record.classes[classId];
    if (!cls) return;
    const total = cls.boys + cls.girls;
    const egg = Math.min(cls.egg, total);
    const banana = Math.max(0, total - egg);

    setRecord((prev) => ({
      ...prev,
      classes: {
        ...prev.classes,
        [classId]: {
          ...cls,
          egg,
          banana,
          total,
        },
      },
    }));
  };

  const handleSave = () => {
    onSaveRecord(record);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  return (
    <div className="space-y-6 pb-16">
      {/* Official Government School Header & Scheme Control */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden">
        {/* Top Official Banner matching School Register */}
        <div className="bg-slate-900 text-white px-6 py-4 text-center border-b border-slate-800">
          <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            ಕರ್ನಾಟಕ ಸರ್ಕಾರ • ಶಾಲಾ ಶಿಕ್ಷಣ ಮತ್ತು ಸಾಕ್ಷರತಾ ಇಲಾಖೆ
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            ಕರ್ನಾಟಕ ಪಬ್ಲಿಕ್ ಸ್ಕೂಲ್ ಮಾದನಗೇರಿ
          </h1>
          <div className="text-sm font-medium text-slate-300 mt-0.5">
            Karnataka Public School, Madanageri • DISE: 29010401802
          </div>
          <div className="inline-block mt-2 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-xs font-bold text-amber-300">
            ದೈನಂದಿನ ಹಾಜರಾತಿ ಮತ್ತು ಬಿಸಿಯೂಟ ಹಾಗೂ ಮೊಟ್ಟೆ ಮತ್ತು ಬಾಳೆಹಣ್ಣು ವಹಿ
          </div>
        </div>

        {/* Scheme, Date & Action Controls */}
        <div className="p-5 bg-slate-50/80 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Scheme Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>SCHEME (ಯೋಜನೆ)</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  SNF or APF
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSchemeChange('SNF')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center ${
                    record.scheme === 'SNF'
                      ? 'bg-amber-700 text-white border-amber-800 shadow-xs ring-2 ring-amber-500/40'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="font-black text-sm">SNF</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    Sai Annapoorna
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSchemeChange('APF')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center ${
                    record.scheme === 'APF'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-500/40'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="font-black text-sm">APF</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    Azim Premji
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSchemeChange('GOVT')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center ${
                    record.scheme === 'GOVT'
                      ? 'bg-blue-700 text-white border-blue-800 shadow-xs ring-2 ring-blue-500/40'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <span className="font-black text-sm">GOVT</span>
                  <span className="text-[10px] opacity-80 font-normal">
                    PM POSHAN
                  </span>
                </button>
              </div>
            </div>

            {/* Date Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>ದಿನಾಂಕ (Date)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={record.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleDateChange(todayStr)}
                  className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-colors shrink-0 ${
                    record.date === todayStr
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                  }`}
                >
                  ಇಂದು (Today)
                </button>
                <button
                  type="button"
                  onClick={() => handleDateChange(yesterdayStr)}
                  className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-colors shrink-0 ${
                    record.date === yesterdayStr
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                  }`}
                >
                  ನಿನ್ನೆ (Yday)
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-4 flex items-center justify-end gap-2.5 pt-4 md:pt-5">
              <button
                type="button"
                onClick={() => onOpenPrintModal(record.date)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-colors"
                title="A4 Size Official Register Print"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                <span>A4 Print (ಮುದ್ರಿಸಿ)</span>
              </button>

              <button
                type="button"
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-colors"
                title="Download Excel Workbook"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Excel Sync</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saveToast ? 'ಉಳಿಸಲಾಗಿದೆ (Saved!)' : 'ಉಳಿಸಿ (Save)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Nutrition Reconciliation Bar */}
        <div
          className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            overall.isBalanced
              ? 'bg-emerald-50 border-t border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-t border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {overall.isBalanced ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <div>
              <span className="font-bold text-sm">
                ಹಾಜರಾತಿ ಮತ್ತು ಮೊಟ್ಟೆ/ಬಾಳೆಹಣ್ಣು ತಾಳೆ:{' '}
                {overall.isBalanced ? (
                  <span className="text-emerald-700">ಸರಿಯಾಗಿದೆ (Balanced ✓)</span>
                ) : (
                  <span className="text-amber-800 font-black">
                    ವ್ಯತ್ಯಾಸವಿದೆ (Difference: {Math.abs(overall.discrepancy)})
                  </span>
                )}
              </span>
              <span className="text-slate-600 ml-2 hidden sm:inline">
                [ಹಾಜರಾತಿ: <strong>{overall.attendedTotal}</strong> = ಮೊಟ್ಟೆ:{' '}
                <strong>{overall.eggTotal}</strong> + ಬಾಳೆಹಣ್ಣು:{' '}
                <strong>{overall.bananaTotal}</strong>]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!overall.isBalanced && (
              <button
                type="button"
                onClick={handleAutoBalanceAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ಬಾಳೆಹಣ್ಣು ಸರಿದೂಗಿಸಿ (Auto-Balance)</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 font-bold">
              <span className="px-2 py-1 bg-white border border-slate-300 rounded-md text-amber-900">
                🥚 ಮೊಟ್ಟೆ: {overall.eggTotal}
              </span>
              <span>+</span>
              <span className="px-2 py-1 bg-white border border-slate-300 rounded-md text-emerald-900">
                🍌 ಬಾಳೆಹಣ್ಣು: {overall.bananaTotal}
              </span>
              <span>=</span>
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-md">
                {overall.nutritionTotal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Table matching KPS Madanageri Register Format */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
        {/* Table Top Controls & Toggle */}
        <div className="bg-slate-100 px-5 py-3 border-b-2 border-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>ದೈನಂದಿನ ವಹಿ ಕೋಷ್ಟಕ (Official MDM Register Table)</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md border border-amber-300">
                ಒಟ್ಟು ದಾಖಲಾತಿ: {overall.enrolledTotal}
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              ತರಗತಿವಾರು ಗಂಡು ಮತ್ತು ಹೆಣ್ಣು ಮಕ್ಕಳ ಹಾಜರಾತಿ ನಮೂದಿಸಿ; ಒಟ್ಟು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲೆಕ್ಕಾಚಾರವಾಗುತ್ತದೆ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none bg-white px-3 py-1.5 rounded-lg border border-slate-300">
              <input
                type="checkbox"
                checked={showAllClasses}
                onChange={(e) => setShowAllClasses(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <span>ಎಲ್ಲ 12 ತರಗತಿಗಳನ್ನು ತೋರಿಸಿ (Show UKG & 10th)</span>
            </label>

            <button
              type="button"
              onClick={handleAutoBalanceAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Auto-Fill Bananas</span>
            </button>
          </div>
        </div>

        {/* The Exact Register Table with Bilingual Kannada/English Labels */}
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs sm:text-sm border-collapse border border-slate-400">
            {/* Double Row Header matching the Physical Register */}
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-400">
                {/* 1. Class / ತರಗತಿ */}
                <th
                  rowSpan={2}
                  className="border border-slate-400 py-3 px-3 text-left w-28 bg-slate-300/80 font-black"
                >
                  <div>ತರಗತಿ</div>
                  <div className="text-[10px] text-slate-600 font-normal uppercase">
                    (Class)
                  </div>
                </th>

                {/* 2. Admission / ದಾಖಲಾತಿ (Fixed) */}
                <th
                  colSpan={3}
                  className="border border-slate-400 py-2 px-2 bg-slate-200/90 text-slate-900 font-bold"
                >
                  <div>ದಾಖಲಾತಿ</div>
                  <div className="text-[10px] text-slate-600 font-normal uppercase">
                    (Admission Baseline)
                  </div>
                </th>

                {/* 3. Attendance / ಹಾಜರಾತಿ (Input) */}
                <th
                  colSpan={3}
                  className="border border-slate-400 py-2 px-2 bg-blue-100/90 text-blue-950 font-bold"
                >
                  <div>ಹಾಜರಾತಿ</div>
                  <div className="text-[10px] text-blue-800 font-normal uppercase">
                    (Daily Attendance)
                  </div>
                </th>

                {/* 4. Egg / ಮೊಟ್ಟೆ */}
                <th
                  rowSpan={2}
                  className="border border-slate-400 py-3 px-2 bg-amber-100/80 text-amber-950 font-bold w-24"
                >
                  <div>ಮೊಟ್ಟೆ</div>
                  <div className="text-[10px] text-amber-800 font-normal uppercase">
                    (Egg)
                  </div>
                </th>

                {/* 5. Banana / ಬಾಳೆ ಹಣ್ಣು */}
                <th
                  rowSpan={2}
                  className="border border-slate-400 py-3 px-2 bg-emerald-100/80 text-emerald-950 font-bold w-24"
                >
                  <div>ಬಾಳೆ ಹಣ್ಣು</div>
                  <div className="text-[10px] text-emerald-800 font-normal uppercase">
                    (Banana)
                  </div>
                </th>

                {/* 6. Balance Status / ತಾಳೆ */}
                <th
                  rowSpan={2}
                  className="border border-slate-400 py-3 px-2 bg-slate-200/80 text-slate-900 font-bold w-24"
                >
                  <div>ತಾಳೆ</div>
                  <div className="text-[10px] text-slate-600 font-normal uppercase">
                    (Status)
                  </div>
                </th>
              </tr>

              {/* Second Level Sub-headers for Boys, Girls, Total */}
              <tr className="bg-slate-100 text-slate-800 font-bold text-xs border-b-2 border-slate-400">
                {/* Admission sub-cols */}
                <th className="border border-slate-400 py-1.5 px-2 text-slate-700 w-16">
                  ಗಂಡು (B)
                </th>
                <th className="border border-slate-400 py-1.5 px-2 text-slate-700 w-16">
                  ಹೆಣ್ಣು (G)
                </th>
                <th className="border border-slate-400 py-1.5 px-2 text-slate-900 font-black bg-slate-200/50 w-16">
                  ಒಟ್ಟು (T)
                </th>

                {/* Attendance sub-cols */}
                <th className="border border-slate-400 py-1.5 px-2 text-blue-900 bg-blue-50/70 w-24">
                  ಗಂಡು (B)
                </th>
                <th className="border border-slate-400 py-1.5 px-2 text-rose-900 bg-rose-50/70 w-24">
                  ಹೆಣ್ಣು (G)
                </th>
                <th className="border border-slate-400 py-1.5 px-2 text-slate-900 font-black bg-blue-100/60 w-20">
                  ಒಟ್ಟು (T)
                </th>
              </tr>
            </thead>

            {/* Table Body with Subtotal Rows inline */}
            <tbody>
              {SECTIONS.map((section) => {
                const sSummary = sectionSummaries[section.key];
                // Filter classes: show only classes with admission > 0 unless showAllClasses is true
                const visibleClasses = section.classes.filter(
                  (cid) => showAllClasses || (master.admissions[cid]?.total ?? 0) > 0
                );

                return (
                  <React.Fragment key={section.key}>
                    {/* Individual Class Rows */}
                    {visibleClasses.map((cid) => {
                      const adm = master.admissions[cid] || { boys: 0, girls: 0, total: 0 };
                      const cls = record.classes[cid] || {
                        classId: cid,
                        boys: 0,
                        girls: 0,
                        total: 0,
                        egg: 0,
                        banana: 0,
                      };

                      const classAttended = cls.boys + cls.girls;
                      const nutritionSum = cls.egg + cls.banana;
                      const isRowBalanced = classAttended === nutritionSum;

                      return (
                        <tr
                          key={cid}
                          className="hover:bg-amber-50/30 transition-colors border-b border-slate-300"
                        >
                          {/* Class Name */}
                          <td className="border border-slate-300 py-2 px-3 text-left font-bold text-slate-900 bg-slate-50/50">
                            {cid === 'LKG' || cid === 'UKG' ? cid : `${cid}`}
                          </td>

                          {/* Admission: Boys, Girls, Total (Fixed from Master) */}
                          <td className="border border-slate-300 py-2 px-2 text-slate-600 font-semibold">
                            {adm.boys}
                          </td>
                          <td className="border border-slate-300 py-2 px-2 text-slate-600 font-semibold">
                            {adm.girls}
                          </td>
                          <td className="border border-slate-300 py-2 px-2 text-slate-900 font-bold bg-slate-100/60">
                            {adm.total}
                          </td>

                          {/* Attendance: Boys (Input) */}
                          <td className="border border-slate-300 py-1 px-1 bg-blue-50/20">
                            <input
                              type="number"
                              min={0}
                              max={adm.boys || 99}
                              value={cls.boys === 0 ? '' : cls.boys}
                              placeholder="0"
                              onChange={(e) =>
                                handleClassValueChange(
                                  cid,
                                  'boys',
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full text-center py-1 px-1 border border-slate-300 rounded font-bold text-blue-900 bg-white focus:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>

                          {/* Attendance: Girls (Input) */}
                          <td className="border border-slate-300 py-1 px-1 bg-rose-50/20">
                            <input
                              type="number"
                              min={0}
                              max={adm.girls || 99}
                              value={cls.girls === 0 ? '' : cls.girls}
                              placeholder="0"
                              onChange={(e) =>
                                handleClassValueChange(
                                  cid,
                                  'girls',
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full text-center py-1 px-1 border border-slate-300 rounded font-bold text-rose-900 bg-white focus:bg-rose-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                          </td>

                          {/* Attendance: Total (Auto Computed!) */}
                          <td className="border border-slate-300 py-2 px-2 font-black text-slate-900 bg-blue-50/50">
                            {classAttended}
                          </td>

                          {/* Egg Count (Input) */}
                          <td className="border border-slate-300 py-1 px-1 bg-amber-50/30">
                            <input
                              type="number"
                              min={0}
                              value={cls.egg === 0 ? '' : cls.egg}
                              placeholder="0"
                              onChange={(e) =>
                                handleClassValueChange(
                                  cid,
                                  'egg',
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full text-center py-1 px-1 border border-amber-300 rounded font-bold text-amber-950 bg-white focus:bg-amber-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                          </td>

                          {/* Banana Count (Input) */}
                          <td className="border border-slate-300 py-1 px-1 bg-emerald-50/30">
                            <input
                              type="number"
                              min={0}
                              value={cls.banana === 0 ? '' : cls.banana}
                              placeholder="0"
                              onChange={(e) =>
                                handleClassValueChange(
                                  cid,
                                  'banana',
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="w-full text-center py-1 px-1 border border-emerald-300 rounded font-bold text-emerald-950 bg-white focus:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>

                          {/* Balance Status */}
                          <td className="border border-slate-300 py-1 px-1">
                            {isRowBalanced ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>OK</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAutoBalanceClass(cid)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 transition-colors"
                                title="Auto-fill Banana to match attendance"
                              >
                                <Sparkles className="w-3 h-3 text-amber-700" />
                                <span>Fix</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Section Subtotal Row matching the exact PDF layout */}
                    <tr className="bg-amber-100/50 text-slate-900 font-bold border-y-2 border-slate-400">
                      {/* Section Register Label (e.g. pre-school, 1 to 5, 6 to 8, 9th) */}
                      <td className="border border-slate-400 py-2 px-3 text-left font-black text-slate-900 bg-amber-200/40">
                        {section.registerLabel}
                      </td>

                      {/* Admission Subtotals */}
                      <td className="border border-slate-400 py-2 px-2 text-slate-800 font-bold">
                        {sSummary.enrolledBoys}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-slate-800 font-bold">
                        {sSummary.enrolledGirls}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-slate-950 font-black bg-amber-200/50">
                        {sSummary.enrolledTotal}
                      </td>

                      {/* Attendance Subtotals */}
                      <td className="border border-slate-400 py-2 px-2 text-blue-950 font-bold bg-blue-100/40">
                        {sSummary.attendedBoys}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-rose-950 font-bold bg-rose-100/40">
                        {sSummary.attendedGirls}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-slate-950 font-black bg-blue-200/40">
                        {sSummary.attendedTotal}
                      </td>

                      {/* Eggs Subtotal */}
                      <td className="border border-slate-400 py-2 px-2 text-amber-950 font-black bg-amber-100/60">
                        {sSummary.eggCount}
                      </td>

                      {/* Banana Subtotal */}
                      <td className="border border-slate-400 py-2 px-2 text-emerald-950 font-black bg-emerald-100/60">
                        {sSummary.bananaCount}
                      </td>

                      {/* Balanced Badge */}
                      <td className="border border-slate-400 py-2 px-1 text-center font-bold text-[11px]">
                        {sSummary.isBalanced ? (
                          <span className="text-emerald-700">✓ Matched</span>
                        ) : (
                          <span className="text-amber-700">
                            Diff: {Math.abs(sSummary.attendedTotal - (sSummary.eggCount + sSummary.bananaCount))}
                          </span>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* Grand Total Row (total) matching PDF bottom row */}
              <tr className="bg-slate-300 text-slate-950 font-black text-sm border-t-4 border-slate-900">
                <td className="border border-slate-400 py-3 px-3 text-left font-black tracking-wide uppercase bg-slate-400/50">
                  total
                </td>

                {/* Admission Grand Totals (132, 121, 253) */}
                <td className="border border-slate-400 py-3 px-2 font-black">
                  {overall.enrolledBoys}
                </td>
                <td className="border border-slate-400 py-3 px-2 font-black">
                  {overall.enrolledGirls}
                </td>
                <td className="border border-slate-400 py-3 px-2 font-black bg-slate-300">
                  {overall.enrolledTotal}
                </td>

                {/* Attendance Grand Totals */}
                <td className="border border-slate-400 py-3 px-2 font-black text-blue-950 bg-blue-100">
                  {overall.attendedBoys}
                </td>
                <td className="border border-slate-400 py-3 px-2 font-black text-rose-950 bg-rose-100">
                  {overall.attendedGirls}
                </td>
                <td className="border border-slate-400 py-3 px-2 font-black text-slate-950 bg-blue-200">
                  {overall.attendedTotal}
                </td>

                {/* Egg & Banana Grand Totals */}
                <td className="border border-slate-400 py-3 px-2 font-black text-amber-950 bg-amber-200">
                  {overall.eggTotal}
                </td>
                <td className="border border-slate-400 py-3 px-2 font-black text-emerald-950 bg-emerald-200">
                  {overall.bananaTotal}
                </td>

                {/* Final Status */}
                <td className="border border-slate-400 py-3 px-1 text-center font-bold text-xs bg-slate-200">
                  {overall.isBalanced ? (
                    <span className="text-emerald-800 font-black">ಸರಿ (OK)</span>
                  ) : (
                    <span className="text-amber-800 font-black">ವ್ಯತ್ಯಾಸ</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            ಶಾಲಾ ಕೋಡ್: <strong>29010401802</strong> • ಒಟ್ಟು ದಾಖಲಾತಿ: ಗಂಡು{' '}
            <strong>{overall.enrolledBoys}</strong> + ಹೆಣ್ಣು{' '}
            <strong>{overall.enrolledGirls}</strong> ={' '}
            <strong>{overall.enrolledTotal}</strong>
          </div>
          <div className="flex items-center gap-3">
            <span>ಹಾಜರಾತಿ ಶೇಕಡಾವಾರು: <strong>{overall.attendancePercentage}%</strong></span>
            <span>•</span>
            <span>ಮೊಟ್ಟೆ ಅನುಪಾತ: <strong>{overall.attendedTotal > 0 ? Math.round((overall.eggTotal / overall.attendedTotal) * 100) : 0}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
