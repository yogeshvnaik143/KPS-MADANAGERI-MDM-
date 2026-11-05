import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
  CloudOff,
  Layers,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { DailyMDMRecord, MasterAdmission } from '../types/mdm';
import {
  exportMDMToExcelFile,
  parseMDMExcelFile,
} from '../utils/excelService';
import firebaseConfig from '../../firebase-applet-config.json';

interface ExcelDatabaseManagerProps {
  isOpen: boolean;
  onClose: () => void;
  master: MasterAdmission;
  records: DailyMDMRecord[];
  cloudSyncStatus?: 'connected' | 'syncing' | 'offline' | 'error';
  onForceSyncCloud?: () => Promise<boolean>;
  onUpdateRecords: (records: DailyMDMRecord[]) => void;
  onResetData: () => void;
}

export const ExcelDatabaseManager: React.FC<ExcelDatabaseManagerProps> = ({
  isOpen,
  onClose,
  master,
  records,
  cloudSyncStatus = 'connected',
  onForceSyncCloud,
  onUpdateRecords,
  onResetData,
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'excel'>('cloud');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

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

  const handleDownload = () => {
    exportMDMToExcelFile(master, records, 'KPS_Madanageri_MDM_Database');
  };

  const handleManualCloudSync = async () => {
    if (!onForceSyncCloud) return;
    setIsProcessing(true);
    const ok = await onForceSyncCloud();
    setIsProcessing(false);
    if (ok) {
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);
    setImportError(null);

    const result = await parseMDMExcelFile(file);
    setIsProcessing(false);

    if (result.error) {
      setImportError(result.error);
    } else if (result.records && result.records.length > 0) {
      onUpdateRecords(result.records);
      setImportStatus(
        `Successfully imported and synced ${result.records.length} daily MDM records!`
      );
    } else {
      setImportError('No matching MDM daily attendance records found in this file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/30 rounded-xl text-amber-400 border border-amber-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                ಡೇಟಾಬೇಸ್ ನಿರ್ವಹಣೆ (Database Manager)
              </h2>
              <p className="text-xs text-slate-300">
                Google Cloud Firestore Online Database & Local Microsoft Excel (.xlsx)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'cloud'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>Online Cloud Database (Firebase)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              100% Free
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'excel'
                ? 'border-amber-600 text-amber-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>Excel Spreadsheet (.xlsx)</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'cloud' ? (
            <div className="space-y-6">
              {/* Cloud Connection Status Card */}
              <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <span className="text-xs uppercase font-bold text-emerald-900 tracking-wider">
                        Google Cloud Firestore Online
                      </span>
                      <div className="text-sm font-black text-emerald-950 mt-0.5">
                        ಸಕ್ರಿಯವಾಗಿದೆ (Online & Live Synced)
                      </div>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-white text-emerald-800 border border-emerald-300">
                    Spark Free Tier
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-xs text-emerald-950">
                  <div>
                    <span className="text-emerald-700">Project ID:</span>{' '}
                    <strong className="font-mono text-[11px]">{firebaseConfig.projectId}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700">Synced Records:</span>{' '}
                    <strong>{records.length} Days</strong>
                  </div>
                </div>
              </div>

              {/* Force Sync Action */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    ಕ್ಲೌಡ್ ಸಿಂಕ್ (Force Cloud Synchronization)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Upload all school records to Google Cloud Firestore immediately.
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleManualCloudSync}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              {syncSuccessToast && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All records successfully synchronized to Google Cloud Firestore!</span>
                </div>
              )}

              {/* Step-by-Step Guide for Free Cloud Database */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>ಹಂತ ಹಂತದ ಮಾರ್ಗದರ್ಶಿ (Step-by-Step Cloud Guide)</span>
                </h3>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-900">100% ಉಚಿತ (No Credit Card / Forever Free)</strong>
                      <p className="text-slate-600 mt-0.5">
                        Firebase Firestore Spark Plan provides 50,000 reads and 20,000 writes every day for free. KPS Madanageri uses less than 100 writes/day, so this remains 100% free with zero monthly charges.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-900">ಆಫ್‌ಲೈನ್ ಸ್ವಯಂಚಾಲಿತ ಸಿಂಕ್ (Offline-First Auto Sync)</strong>
                      <p className="text-slate-600 mt-0.5">
                        When internet is down at school, attendance is saved locally on your computer with 0 delay. As soon as WiFi or mobile hotspot connects, it automatically syncs to the cloud.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-900">ಮೊಬೈಲ್ ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ಎರಡರಲ್ಲೂ ಲಭ್ಯ (Multi-Device Live Access)</strong>
                      <p className="text-slate-600 mt-0.5">
                        Open the App URL on any teacher's mobile phone or the Head Master's laptop. Any meal or attendance entered on phone instantly appears on the school computer.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div>
                      <strong className="text-slate-900">ಎಕ್ಸೆಲ್ ಬ್ಯಾಕಪ್ ಉಳಿಯುತ್ತದೆ (Excel Backup Always Active)</strong>
                      <p className="text-slate-600 mt-0.5">
                        You can still download complete multi-sheet Microsoft Excel (`.xlsx`) workbooks anytime to submit to the BEO / Akshara Dasoha Taluk office.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Excel Download Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>Download Excel Database (.xlsx)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Exports complete 5-sheet workbook including `ವಹಿ_Official_Register`, `Daily_Class_Register`, `Daily_Day_Summary`, and `Master_Admission`.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .xlsx</span>
                </button>
              </div>

              {/* Excel Upload Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-700" />
                  <span>Import / Restore from Excel</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a previously exported `.xlsx` file to update records.
                </p>

                <div className="mt-3">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-4 hover:border-amber-400 hover:bg-amber-50/20 cursor-pointer transition-all">
                    <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      {isProcessing ? 'Processing Excel file...' : 'Choose or Drag .xlsx file'}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      disabled={isProcessing}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{importStatus}</span>
                  </div>
                )}

                {importError && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>

              {/* Reset Database */}
              <div className="border border-red-200 rounded-xl p-4 bg-red-50/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-900">
                    ಮರುಹೊಂದಿಸಿ (Reset to Official KPS Madanageri Seed Data)
                  </h4>
                  <p className="text-[11px] text-red-700/80 mt-0.5">
                    Restores the 253 enrolled students and authentic register history.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset database to authentic KPS Madanageri register records?')) {
                      onResetData();
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 rounded-lg border border-red-300 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
