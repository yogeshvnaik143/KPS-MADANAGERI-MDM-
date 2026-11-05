import React from 'react';
import {
  FileSpreadsheet,
  Printer,
  Users,
  Calendar,
  Utensils,
  Award,
  RefreshCw,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { MasterAdmission } from '../types/mdm';

interface HeaderProps {
  activeTab: 'daily' | 'reports';
  setActiveTab: (tab: 'daily' | 'reports') => void;
  master: MasterAdmission;
  cloudSyncStatus?: 'connected' | 'syncing' | 'offline' | 'error';
  onOpenAdmissionModal: () => void;
  onOpenExcelModal: () => void;
  onOpenPrintModal: () => void;
  onQuickExportExcel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  master,
  cloudSyncStatus = 'connected',
  onOpenAdmissionModal,
  onOpenExcelModal,
  onOpenPrintModal,
  onQuickExportExcel,
}) => {
  // Compute grand total admission
  const totalEnrolled = Object.values(master.admissions).reduce(
    (sum, c) => sum + (c.total || 0),
    0
  );

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Govt Bar */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-amber-50 px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          <span className="font-semibold tracking-wide">
            GOVERNMENT OF KARNATAKA • DEPARTMENT OF SCHOOL EDUCATION & LITERACY
          </span>
        </div>
        <div className="flex items-center gap-4 text-amber-200 text-[11px]">
          <span>DISE Code: <strong className="text-white">{master.diseCode}</strong></span>
          <span>•</span>
          <span>Academic Year: <strong className="text-white">{master.academicYear}</strong></span>
          <span>•</span>
          <span className="bg-amber-950/60 text-amber-200 px-2 py-0.5 rounded border border-amber-600/40">
            PM POSHAN / Akshara Dasoha
          </span>
        </div>
      </div>

      {/* Main Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-md shadow-amber-600/20 shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  ಕರ್ನಾಟಕ ಪಬ್ಲಿಕ್ ಸ್ಕೂಲ್ ಮಾದನಗೇರಿ
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                  KPS Madanageri
                </span>
                {/* Cloud Sync Status Pill */}
                {cloudSyncStatus === 'connected' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-400">
                    <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Cloud Online (Firestore)</span>
                  </span>
                )}
                {cloudSyncStatus === 'syncing' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-400 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                    <span>Cloud Syncing...</span>
                  </span>
                )}
                {cloudSyncStatus === 'offline' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                    <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>Offline (Saved to Device)</span>
                  </span>
                )}
                {cloudSyncStatus === 'error' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    <CloudOff className="w-3.5 h-3.5 text-rose-600" />
                    <span>Local Mode</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                <span className="font-bold text-amber-800">ದೈನಂದಿನ ಹಾಜರಾತಿ ಮತ್ತು ಬಿಸಿಯೂಟ ಹಾಗೂ ಮೊಟ್ಟೆ ಮತ್ತು ಬಾಳೆಹಣ್ಣು ವಹಿ</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-800 font-semibold">SNF & APF Scheme</span>
                <span className="text-slate-300">•</span>
                <span>ದಾಖಲಾತಿ: <strong className="text-slate-900">{totalEnrolled} ಮಕ್ಕಳು</strong></span>
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Admission Master Button */}
            <button
              onClick={onOpenAdmissionModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
              title="View or edit permanent admission numbers"
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span>Admission Master</span>
              <span className="ml-1 bg-white text-slate-800 px-1.5 py-0.2 rounded text-[11px] font-semibold border border-slate-200">
                {totalEnrolled}
              </span>
            </button>

            {/* Excel Database Button */}
            <button
              onClick={onOpenExcelModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
              title="Microsoft Excel Database Sync & Management"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel Database</span>
            </button>

            {/* Quick Export Excel */}
            <button
              onClick={onQuickExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs"
              title="Download instant Excel file (.xlsx)"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export .xlsx</span>
            </button>

            {/* Print A4 Report */}
            <button
              onClick={onOpenPrintModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 transition-colors shadow-sm"
              title="Print official report formatted for A4 paper"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'daily'
                ? 'bg-amber-700 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Register & Meal Entry</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-700 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Reports & Scheme Analysis (Daily, Weekly, Monthly)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
