/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DailyEntryView } from './components/DailyEntryView';
import { ReportsView } from './components/ReportsView';
import { MasterAdmissionModal } from './components/MasterAdmissionModal';
import { ExcelDatabaseManager } from './components/ExcelDatabaseManager';
import { PrintA4Report } from './components/PrintA4Report';
import { DailyMDMRecord, MasterAdmission } from './types/mdm';
import {
  createBlankDailyRecord,
  loadDailyRecords,
  loadMasterAdmission,
  resetToSeedData,
  saveDailyRecords,
  saveMasterAdmission,
} from './utils/storage';
import { exportMDMToExcelFile } from './utils/excelService';
import {
  forceSyncAllToCloud,
  saveDailyRecordToCloud,
  saveMasterAdmissionToCloud,
  subscribeToDailyRecords,
  subscribeToMasterAdmission,
  syncLocalToCloudIfEmpty,
  SyncState,
} from './utils/firebaseSync';

export default function App() {
  // Persistent state
  const [masterAdmission, setMasterAdmission] = useState<MasterAdmission>(() =>
    loadMasterAdmission()
  );
  const [dailyRecords, setDailyRecords] = useState<DailyMDMRecord[]>(() =>
    loadDailyRecords()
  );

  // Cloud sync status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<SyncState>('syncing');

  // Active view tab: 'daily' | 'reports'
  const [activeTab, setActiveTab] = useState<'daily' | 'reports'>('daily');

  // Currently active date for daily entry
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Modals state
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetId, setPrintTargetId] = useState<string>(currentDate);
  const [printReportType, setPrintReportType] = useState<
    'daily' | 'monthly' | 'scheme'
  >('daily');

  // Firebase Real-time Auto-Sync on Mount
  useEffect(() => {
    // 1. Check if cloud has records or seed initial data
    syncLocalToCloudIfEmpty(masterAdmission, dailyRecords)
      .then(() => setCloudSyncStatus('connected'))
      .catch((err) => {
        console.warn('Initial cloud sync check:', err);
        setCloudSyncStatus('offline');
      });

    // 2. Real-time subscription to Master Admission
    const unsubMaster = subscribeToMasterAdmission(
      (remoteMaster) => {
        if (remoteMaster && remoteMaster.admissions) {
          setMasterAdmission(remoteMaster);
          saveMasterAdmission(remoteMaster);
          setCloudSyncStatus('connected');
        }
      },
      () => setCloudSyncStatus('offline')
    );

    // 3. Real-time subscription to Daily Records
    const unsubRecords = subscribeToDailyRecords(
      (remoteRecords) => {
        if (remoteRecords && remoteRecords.length > 0) {
          setDailyRecords((prev) => {
            const map = new Map<string, DailyMDMRecord>();
            // Add local first
            prev.forEach((r) => map.set(r.date, r));
            // Overwrite with remote
            remoteRecords.forEach((r) => map.set(r.date, r));
            const merged = Array.from(map.values()).sort((a, b) =>
              b.date.localeCompare(a.date)
            );
            saveDailyRecords(merged);
            return merged;
          });
          setCloudSyncStatus('connected');
        }
      },
      () => setCloudSyncStatus('offline')
    );

    // Listen to browser online/offline events
    const handleOnline = () => setCloudSyncStatus('connected');
    const handleOffline = () => setCloudSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubMaster();
      unsubRecords();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Current record for the selected date
  const currentRecord = useMemo(() => {
    const found = dailyRecords.find((r) => r.date === currentDate);
    if (found) return found;
    // Create new blank record for this date
    return createBlankDailyRecord(currentDate, 'SNF', masterAdmission);
  }, [dailyRecords, currentDate, masterAdmission]);

  // Save record handler (offline-first + cloud sync)
  const handleSaveDailyRecord = async (recordToSave: DailyMDMRecord) => {
    // 1. Immediate local save (0ms latency, works offline)
    setDailyRecords((prev) => {
      const idx = prev.findIndex((r) => r.date === recordToSave.date);
      let updated: DailyMDMRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = recordToSave;
      } else {
        updated = [recordToSave, ...prev];
      }
      saveDailyRecords(updated);
      return updated;
    });

    // 2. Auto-sync to Firebase Cloud
    setCloudSyncStatus('syncing');
    const ok = await saveDailyRecordToCloud(recordToSave);
    setCloudSyncStatus(ok ? 'connected' : 'offline');
  };

  // Save Master Admission (offline-first + cloud sync)
  const handleSaveMasterAdmission = async (newMaster: MasterAdmission) => {
    setMasterAdmission(newMaster);
    saveMasterAdmission(newMaster);

    setCloudSyncStatus('syncing');
    const ok = await saveMasterAdmissionToCloud(newMaster);
    setCloudSyncStatus(ok ? 'connected' : 'offline');
  };

  // Force sync all records to cloud
  const handleForceSyncAll = async () => {
    setCloudSyncStatus('syncing');
    const ok = await forceSyncAllToCloud(masterAdmission, dailyRecords);
    setCloudSyncStatus(ok ? 'connected' : 'offline');
    return ok;
  };

  // Quick export to Excel file
  const handleQuickExportExcel = () => {
    exportMDMToExcelFile(masterAdmission, dailyRecords);
  };

  // Open print modal helper
  const handleOpenPrintModal = (
    targetId: string = currentDate,
    type: 'daily' | 'monthly' | 'scheme' = 'daily'
  ) => {
    setPrintTargetId(targetId);
    setPrintReportType(type);
    setIsPrintModalOpen(true);
  };

  // Reset database handler
  const handleResetData = () => {
    const { master, records } = resetToSeedData();
    setMasterAdmission(master);
    setDailyRecords(records);
    forceSyncAllToCloud(master, records);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* School Brand Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        master={masterAdmission}
        cloudSyncStatus={cloudSyncStatus}
        onOpenAdmissionModal={() => setIsAdmissionModalOpen(true)}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onOpenPrintModal={() => handleOpenPrintModal(currentDate, 'daily')}
        onQuickExportExcel={handleQuickExportExcel}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6">
        {activeTab === 'daily' ? (
          <DailyEntryView
            currentRecord={currentRecord}
            master={masterAdmission}
            allRecords={dailyRecords}
            onSaveRecord={handleSaveDailyRecord}
            onSelectDate={(newDate) => setCurrentDate(newDate)}
            onOpenPrintModal={(dateStr) => handleOpenPrintModal(dateStr, 'daily')}
            onExportExcel={handleQuickExportExcel}
          />
        ) : (
          <ReportsView
            records={dailyRecords}
            master={masterAdmission}
            onOpenPrintModal={handleOpenPrintModal}
            onExportExcel={handleQuickExportExcel}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 Karnataka Public School, Madanageri • Mid Day Meal Management System
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Firebase Cloud Firestore Online • Offline-First Local Cache</span>
          </span>
        </div>
      </footer>

      {/* Modals */}
      <MasterAdmissionModal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        master={masterAdmission}
        onSave={handleSaveMasterAdmission}
      />

      <ExcelDatabaseManager
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        master={masterAdmission}
        records={dailyRecords}
        cloudSyncStatus={cloudSyncStatus}
        onForceSyncCloud={handleForceSyncAll}
        onUpdateRecords={(newRecords) => {
          setDailyRecords(newRecords);
          saveDailyRecords(newRecords);
          forceSyncAllToCloud(masterAdmission, newRecords);
        }}
        onResetData={handleResetData}
      />

      <PrintA4Report
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        targetId={printTargetId}
        reportType={printReportType}
        records={dailyRecords}
        master={masterAdmission}
      />
    </div>
  );
}
