import React, { useState } from 'react';
import { X, Save, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import { ALL_CLASSES, ClassId, MasterAdmission, SECTIONS } from '../types/mdm';

interface MasterAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  master: MasterAdmission;
  onSave: (updated: MasterAdmission) => void;
}

export const MasterAdmissionModal: React.FC<MasterAdmissionModalProps> = ({
  isOpen,
  onClose,
  master,
  onSave,
}) => {
  const [admissions, setAdmissions] = useState(master.admissions);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

  const handleChange = (classId: ClassId, field: 'boys' | 'girls', value: number) => {
    const val = Math.max(0, isNaN(value) ? 0 : value);
    setAdmissions((prev) => {
      const current = prev[classId] || { classId, boys: 0, girls: 0, total: 0 };
      const updatedBoys = field === 'boys' ? val : current.boys;
      const updatedGirls = field === 'girls' ? val : current.girls;
      return {
        ...prev,
        [classId]: {
          classId,
          boys: updatedBoys,
          girls: updatedGirls,
          total: updatedBoys + updatedGirls,
        },
      };
    });
    setSavedSuccess(false);
  };

  const handleSave = () => {
    const updated: MasterAdmission = {
      ...master,
      lastUpdated: new Date().toISOString().slice(0, 10),
      admissions,
    };
    onSave(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  // Grand totals
  let grandBoys = 0;
  let grandGirls = 0;
  for (const cid of ALL_CLASSES) {
    const row = admissions[cid] || { boys: 0, girls: 0, total: 0 };
    grandBoys += row.boys || 0;
    grandGirls += row.girls || 0;
  }
  const grandTotal = grandBoys + grandGirls;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                School Master Admission (Enrolment Register)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Karnataka Public School, Madanageri • Fixed baseline student admission (rarely edited)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              This is the official baseline enrollment. Total attendance percentage and nutrition quota checks are measured against these numbers.
            </span>
          </div>
          <span className="font-semibold text-amber-800 shrink-0">
            Last Updated: {master.lastUpdated}
          </span>
        </div>

        {/* Form Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-6">
          {SECTIONS.map((section, sIdx) => {
            let sectionBoys = 0;
            let sectionGirls = 0;

            for (const cid of section.classes) {
              const row = admissions[cid] || { boys: 0, girls: 0, total: 0 };
              sectionBoys += row.boys || 0;
              sectionGirls += row.girls || 0;
            }
            const sectionTotal = sectionBoys + sectionGirls;

            return (
              <div
                key={section.key}
                className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
              >
                {/* Section Header */}
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {section.label}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({section.subLabel})
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    Section Enrolment: <span className="text-amber-700">{sectionTotal}</span> (Boys: {sectionBoys}, Girls: {sectionGirls})
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold">
                        <th className="py-2.5 px-4 w-32">Class</th>
                        <th className="py-2.5 px-4">Boys Enrolled</th>
                        <th className="py-2.5 px-4">Girls Enrolled</th>
                        <th className="py-2.5 px-4 text-right">Class Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {section.classes.map((classId) => {
                        const row = admissions[classId] || {
                          classId,
                          boys: 0,
                          girls: 0,
                          total: 0,
                        };
                        return (
                          <tr key={classId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2 px-4 font-semibold text-slate-800">
                              Class {classId}
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                min={0}
                                value={row.boys === 0 ? '' : row.boys}
                                placeholder="0"
                                onChange={(e) =>
                                  handleChange(classId, 'boys', parseInt(e.target.value, 10))
                                }
                                className="w-24 sm:w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                min={0}
                                value={row.girls === 0 ? '' : row.girls}
                                placeholder="0"
                                onChange={(e) =>
                                  handleChange(classId, 'girls', parseInt(e.target.value, 10))
                                }
                                className="w-24 sm:w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                              />
                            </td>
                            <td className="py-2 px-4 text-right font-bold text-slate-900">
                              <span className="inline-block bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                                {row.total}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Grand Total & Save */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-bold text-slate-700">Total School Enrolment:</span>
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md font-medium">
                Boys: <strong>{grandBoys}</strong>
              </span>
              <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-md font-medium">
                Girls: <strong>{grandGirls}</strong>
              </span>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-md font-bold text-sm">
                Total: {grandTotal}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {savedSuccess && (
              <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Master Admission</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
