import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Printer,
  FileSpreadsheet,
  Layers,
  ChevronDown,
  BarChart3,
  Egg,
  TrendingUp,
  Award,
  CheckCircle2,
  Users,
  ShieldCheck,
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
  aggregateMultiDayRecords,
  calculateOverallSummary,
  calculateSectionSummaries,
  filterRecordsByMonth,
  filterRecordsByRange,
} from '../utils/mdmLogic';

interface ReportsViewProps {
  records: DailyMDMRecord[];
  master: MasterAdmission;
  onOpenPrintModal: (dateOrMonth: string, type?: 'daily' | 'monthly' | 'scheme') => void;
  onExportExcel: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  master,
  onOpenPrintModal,
  onExportExcel,
}) => {
  const [reportType, setReportType] = useState<
    'daily' | 'weekly' | 'monthly' | 'scheme'
  >('daily');

  // Dates selection
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );

  const latestDate = sortedRecords[0]?.date || new Date().toISOString().slice(0, 10);
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(latestDate);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    latestDate.slice(0, 7) // "YYYY-MM"
  );
  const [selectedSchemeFilter, setSelectedSchemeFilter] = useState<string>('ALL');

  // Available months list
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [records]);

  // 1. Daily Report Data
  const dailyRecord = useMemo(() => {
    return (
      records.find((r) => r.date === selectedDailyDate) ||
      sortedRecords[0]
    );
  }, [records, selectedDailyDate, sortedRecords]);

  const dailyOverall = useMemo(() => {
    if (!dailyRecord) return null;
    return calculateOverallSummary(dailyRecord, master);
  }, [dailyRecord, master]);

  const dailySections = useMemo(() => {
    if (!dailyRecord) return null;
    return calculateSectionSummaries(dailyRecord, master);
  }, [dailyRecord, master]);

  // 2. Weekly Report Data (past 6 recorded days from selectedDailyDate)
  const weeklyRecords = useMemo(() => {
    const idx = sortedRecords.findIndex((r) => r.date <= selectedDailyDate);
    if (idx === -1) return sortedRecords.slice(0, 6);
    return sortedRecords.slice(idx, idx + 6).reverse();
  }, [sortedRecords, selectedDailyDate]);

  const weeklySummary = useMemo(() => {
    return aggregateMultiDayRecords(weeklyRecords);
  }, [weeklyRecords]);

  // 3. Monthly Report Data
  const monthlyRecords = useMemo(() => {
    return filterRecordsByMonth(records, selectedMonth);
  }, [records, selectedMonth]);

  const monthlySummary = useMemo(() => {
    return aggregateMultiDayRecords(monthlyRecords);
  }, [monthlyRecords]);

  // 4. Scheme Report Data (Monthly Scheme Breakdown)
  const schemeFilteredRecords = useMemo(() => {
    const byMonth = filterRecordsByMonth(records, selectedMonth);
    if (selectedSchemeFilter === 'ALL') return byMonth;
    return byMonth.filter((r) => r.scheme === selectedSchemeFilter);
  }, [records, selectedMonth, selectedSchemeFilter]);

  const schemeFilteredSummary = useMemo(() => {
    return aggregateMultiDayRecords(schemeFilteredRecords);
  }, [schemeFilteredRecords]);

  return (
    <div className="space-y-6 pb-16">
      {/* Sub Tabs: Daily, Weekly, Monthly, Scheme-wise */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              reportType === 'daily'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setReportType('weekly')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              reportType === 'weekly'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              reportType === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setReportType('scheme')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              reportType === 'scheme'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scheme-Wise (SNF vs APF)
          </button>
        </div>

        {/* Global Export & Print for Current Report */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={() =>
              onOpenPrintModal(
                reportType === 'daily' ? selectedDailyDate : selectedMonth,
                reportType === 'scheme' ? 'scheme' : reportType === 'daily' ? 'daily' : 'monthly'
              )
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Direct Print A4</span>
          </button>
        </div>
      </div>

      {/* ---------------- 1. DAILY REPORT ---------------- */}
      {reportType === 'daily' && dailyRecord && dailyOverall && dailySections && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Daily Date Selector Header */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase text-slate-600">
                Select Report Date:
              </label>
              <select
                value={selectedDailyDate}
                onChange={(e) => setSelectedDailyDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                {sortedRecords.map((r) => (
                  <option key={r.date} value={r.date}>
                    {r.date} ({r.scheme} Scheme)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                Scheme: {dailyRecord.scheme}
              </span>
              <span className="text-slate-500 truncate max-w-xs">
                {dailyRecord.schemeHeir}
              </span>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold">
                Total Attendance
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {dailyOverall.attendedTotal}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / {dailyOverall.enrolledTotal}
                </span>
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">
                {dailyOverall.attendancePercentage}% Present
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold">
                Boys Attended
              </div>
              <div className="text-xl font-bold text-blue-900 mt-1">
                {dailyOverall.attendedBoys}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Out of {dailyOverall.enrolledBoys} enrolled
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold">
                Girls Attended
              </div>
              <div className="text-xl font-bold text-rose-900 mt-1">
                {dailyOverall.attendedGirls}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Out of {dailyOverall.enrolledGirls} enrolled
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30">
              <div className="text-amber-800 text-[10px] uppercase font-bold flex items-center gap-1">
                <Egg className="w-3.5 h-3.5 text-amber-700" />
                <span>Eggs Distributed</span>
              </div>
              <div className="text-xl font-bold text-amber-950 mt-1">
                {dailyOverall.eggTotal}
              </div>
              <div className="text-xs text-amber-700 mt-1">
                {Math.round((dailyOverall.eggTotal / dailyOverall.attendedTotal) * 100)}% of attendees
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
              <div className="text-emerald-800 text-[10px] uppercase font-bold">
                🍌 Bananas Distributed
              </div>
              <div className="text-xl font-bold text-emerald-950 mt-1">
                {dailyOverall.bananaTotal}
              </div>
              <div className="text-xs text-emerald-700 mt-1">
                {Math.round((dailyOverall.bananaTotal / dailyOverall.attendedTotal) * 100)}% of attendees
              </div>
            </div>
          </div>

          {/* Section Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Section-Wise Breakdown ({dailyRecord.date})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Section</th>
                    <th className="py-2.5 px-3">Classes</th>
                    <th className="py-2.5 px-3">Enrolled</th>
                    <th className="py-2.5 px-3">Boys</th>
                    <th className="py-2.5 px-3">Girls</th>
                    <th className="py-2.5 px-3 font-bold text-slate-900">Total Attended</th>
                    <th className="py-2.5 px-3 text-amber-900">🥚 Eggs</th>
                    <th className="py-2.5 px-3 text-emerald-900">🍌 Bananas</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SECTIONS.map((sec) => {
                    const s = dailySections[sec.key];
                    return (
                      <tr key={sec.key} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {sec.label}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {sec.classes.join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {s.enrolledTotal}
                        </td>
                        <td className="py-2.5 px-3 text-blue-900 font-medium">
                          {s.attendedBoys}
                        </td>
                        <td className="py-2.5 px-3 text-rose-900 font-medium">
                          {s.attendedGirls}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {s.attendedTotal}
                        </td>
                        <td className="py-2.5 px-3 text-amber-900 font-semibold">
                          {s.eggCount}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-900 font-semibold">
                          {s.bananaCount}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              s.isBalanced
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.isBalanced ? 'Balanced ✓' : 'Mismatch'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {s.attendancePercentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. WEEKLY REPORT ---------------- */}
      {reportType === 'weekly' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Weekly MDM Nutrition Report (6 School Days)
              </h3>
              <p className="text-xs text-slate-500">
                Summary across past 6 working days leading up to {selectedDailyDate}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200">
                Total Meals: <strong>{weeklySummary.totalAttendance}</strong>
              </span>
              <span className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-300">
                Total Eggs: <strong>{weeklySummary.totalEggs}</strong>
              </span>
              <span className="bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-300">
                Total Bananas: <strong>{weeklySummary.totalBananas}</strong>
              </span>
            </div>
          </div>

          {/* Weekly Day-by-Day Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Scheme</th>
                    <th className="py-3 px-3">Scheme Heir / Sponsor</th>
                    <th className="py-3 px-3">Boys</th>
                    <th className="py-3 px-3">Girls</th>
                    <th className="py-3 px-3 font-bold text-slate-900">Total Attendance</th>
                    <th className="py-3 px-3 text-amber-900">🥚 Eggs</th>
                    <th className="py-3 px-3 text-emerald-900">🍌 Bananas</th>
                    <th className="py-3 px-4 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyRecords.map((r) => {
                    const ov = calculateOverallSummary(r, master);
                    return (
                      <tr key={r.date} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {r.date}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              r.scheme === 'SNF'
                                ? 'bg-amber-100 text-amber-800'
                                : r.scheme === 'APF'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {r.scheme}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs truncate max-w-xs">
                          {r.schemeHeir}
                        </td>
                        <td className="py-2.5 px-3 text-blue-900">{ov.attendedBoys}</td>
                        <td className="py-2.5 px-3 text-rose-900">{ov.attendedGirls}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {ov.attendedTotal}
                        </td>
                        <td className="py-2.5 px-3 text-amber-900 font-bold">
                          {ov.eggTotal}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-900 font-bold">
                          {ov.bananaTotal}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {ov.attendancePercentage}%
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="py-3 px-4">Weekly Total</td>
                    <td colSpan={2} className="py-3 px-3 text-slate-300">
                      {weeklyRecords.length} Working Days
                    </td>
                    <td className="py-3 px-3 text-blue-200">
                      {weeklySummary.totalBoysAttendance}
                    </td>
                    <td className="py-3 px-3 text-rose-200">
                      {weeklySummary.totalGirlsAttendance}
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-extrabold">
                      {weeklySummary.totalAttendance}
                    </td>
                    <td className="py-3 px-3 text-amber-300">
                      {weeklySummary.totalEggs}
                    </td>
                    <td className="py-3 px-3 text-emerald-300">
                      {weeklySummary.totalBananas}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400">
                      Avg: {weeklySummary.avgDailyAttendance}/day
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. MONTHLY REPORT ---------------- */}
      {reportType === 'monthly' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase text-slate-600">
                Select Month:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Government School Akshara Dasoha Official Monthly Register Format
            </div>
          </div>

          {/* Monthly KPI Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold">
                Working Days
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {monthlySummary.workingDays}
              </div>
              <div className="text-xs text-slate-500 mt-1">Days served in {selectedMonth}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold">
                Total Student Meals
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {monthlySummary.totalAttendance}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Avg: <strong>{monthlySummary.avgDailyAttendance}</strong> / day
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-slate-400 text-[10px] uppercase font-bold">
                Gender Breakdown
              </div>
              <div className="text-sm font-bold text-slate-900 mt-2 space-y-1">
                <div className="text-blue-900">Boys: {monthlySummary.totalBoysAttendance}</div>
                <div className="text-rose-900">Girls: {monthlySummary.totalGirlsAttendance}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
              <div className="text-amber-800 text-[10px] uppercase font-bold flex items-center gap-1">
                <Egg className="w-3.5 h-3.5 text-amber-700" />
                <span>Total Eggs Distributed</span>
              </div>
              <div className="text-2xl font-bold text-amber-950 mt-1">
                {monthlySummary.totalEggs}
              </div>
              <div className="text-xs text-amber-800 mt-1">
                Avg: {monthlySummary.workingDays > 0 ? Math.round(monthlySummary.totalEggs / monthlySummary.workingDays) : 0} / day
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
              <div className="text-emerald-800 text-[10px] uppercase font-bold">
                🍌 Total Bananas Distributed
              </div>
              <div className="text-2xl font-bold text-emerald-950 mt-1">
                {monthlySummary.totalBananas}
              </div>
              <div className="text-xs text-emerald-800 mt-1">
                Avg: {monthlySummary.workingDays > 0 ? Math.round(monthlySummary.totalBananas / monthlySummary.workingDays) : 0} / day
              </div>
            </div>
          </div>

          {/* Monthly Section Totals Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Monthly Section-Wise Aggregation ({selectedMonth})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Section Name</th>
                    <th className="py-2.5 px-3">Classes</th>
                    <th className="py-2.5 px-3 font-bold text-slate-900">Total Student Meals</th>
                    <th className="py-2.5 px-3 text-amber-900">Total Eggs</th>
                    <th className="py-2.5 px-3 text-emerald-900">Total Bananas</th>
                    <th className="py-2.5 px-4 text-right">Daily Average Meals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SECTIONS.map((sec) => {
                    const secData = monthlySummary.sectionBreakdown[sec.key];
                    const dailyAvg =
                      monthlySummary.workingDays > 0
                        ? Math.round(secData.totalAttendees / monthlySummary.workingDays)
                        : 0;

                    return (
                      <tr key={sec.key} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {sec.label}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {sec.classes.join(', ')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {secData.totalAttendees}
                        </td>
                        <td className="py-2.5 px-3 text-amber-900 font-semibold">
                          {secData.totalEggs}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-900 font-semibold">
                          {secData.totalBananas}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                          {dailyAvg} students / day
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. SCHEME-WISE REPORT (SNF vs APF) ---------------- */}
      {reportType === 'scheme' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Scheme-Wise Donor Analysis (SNF vs APF Nutrition Tracker)
              </h3>
              <p className="text-xs text-slate-500">
                Tracking who supplied eggs and bananas to students (Sri Sathya Sai Annapoorna vs Azim Premji Foundation vs Government)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase text-slate-600">
                Month:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedSchemeFilter}
                onChange={(e) => setSelectedSchemeFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Schemes</option>
                <option value="SNF">SNF Scheme (Sai Annapoorna)</option>
                <option value="APF">APF Scheme (Azim Premji)</option>
                <option value="GOVT">Govt PM POSHAN</option>
              </select>
            </div>
          </div>

          {/* Scheme Cards Comparative */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SNF Card */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-300 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900 border border-amber-400">
                    SNF SCHEME
                  </div>
                  <h4 className="text-lg font-bold text-amber-950 mt-1">
                    Sri Sathya Sai Annapoorna Foundation
                  </h4>
                  <p className="text-xs text-amber-800">
                    Sponsoring nutritious eggs and bananas for school children
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                  SNF
                </div>
              </div>

              {(() => {
                const snfData = monthlySummary.schemeBreakdown['SNF'] || {
                  days: 0,
                  attendees: 0,
                  eggs: 0,
                  bananas: 0,
                };
                return (
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-amber-200">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                      <div className="text-[10px] text-amber-800 font-bold uppercase">
                        Days Served
                      </div>
                      <div className="text-lg font-extrabold text-amber-950 mt-0.5">
                        {snfData.days}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                      <div className="text-[10px] text-amber-800 font-bold uppercase">
                        Eggs Provided
                      </div>
                      <div className="text-lg font-extrabold text-amber-950 mt-0.5">
                        {snfData.eggs}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200">
                      <div className="text-[10px] text-amber-800 font-bold uppercase">
                        Bananas Provided
                      </div>
                      <div className="text-lg font-extrabold text-emerald-800 mt-0.5">
                        {snfData.bananas}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* APF Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-300 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 border border-emerald-400">
                    APF SCHEME
                  </div>
                  <h4 className="text-lg font-bold text-emerald-950 mt-1">
                    Azim Premji Foundation
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Partnership supplementary nutrition distributing eggs and fresh bananas
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
                  APF
                </div>
              </div>

              {(() => {
                const apfData = monthlySummary.schemeBreakdown['APF'] || {
                  days: 0,
                  attendees: 0,
                  eggs: 0,
                  bananas: 0,
                };
                return (
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-emerald-200">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-emerald-800 font-bold uppercase">
                        Days Served
                      </div>
                      <div className="text-lg font-extrabold text-emerald-950 mt-0.5">
                        {apfData.days}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-emerald-800 font-bold uppercase">
                        Eggs Provided
                      </div>
                      <div className="text-lg font-extrabold text-amber-900 mt-0.5">
                        {apfData.eggs}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-emerald-800 font-bold uppercase">
                        Bananas Provided
                      </div>
                      <div className="text-lg font-extrabold text-emerald-950 mt-0.5">
                        {apfData.bananas}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Scheme Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Scheme-Wise Distribution Register ({selectedMonth})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Scheme</th>
                    <th className="py-3 px-3">Donor / Organization</th>
                    <th className="py-3 px-3 font-bold text-slate-900">Total Attendance</th>
                    <th className="py-3 px-3 text-amber-900">Eggs</th>
                    <th className="py-3 px-3 text-emerald-900">Bananas</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schemeFilteredRecords.map((r) => {
                    const ov = calculateOverallSummary(r, master);
                    return (
                      <tr key={r.date} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{r.date}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              r.scheme === 'SNF'
                                ? 'bg-amber-100 text-amber-800'
                                : r.scheme === 'APF'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {r.scheme}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs">{r.schemeHeir}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {ov.attendedTotal}
                        </td>
                        <td className="py-2.5 px-3 text-amber-900 font-bold">{ov.eggTotal}</td>
                        <td className="py-2.5 px-3 text-emerald-900 font-bold">
                          {ov.bananaTotal}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            HM & SDMC ✓
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
