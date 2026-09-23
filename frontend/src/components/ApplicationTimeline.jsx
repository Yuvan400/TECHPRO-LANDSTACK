import React from 'react';
import { CheckCircle2, Clock, AlertCircle, MapPin, FileCheck, ShieldCheck } from 'lucide-react';

export const ApplicationTimeline = ({ currentStatus, timelineData }) => {
  const steps = [
    { key: 'SUBMITTED', label: 'Application Submitted', desc: 'Citizen submitted form & documents' },
    { key: 'UNDER_REVIEW', label: 'Department Review', desc: 'Assigned supervisor initial scrutiny' },
    { key: 'FIELD_VERIFICATION', label: 'Field Verification', desc: 'Physical inspection by Cadastral Officer' },
    { key: 'VERIFIED', label: 'Inspection Completed', desc: 'DGPS survey & boundary report submitted' },
    { key: 'SUPERVISOR_REVIEW', label: 'Final Sanction', desc: 'Supervisory approval determination' },
    { key: 'APPROVED', label: 'Approved & Issued', desc: 'Statutory certificate generated' },
  ];

  const statusOrder = ['SUBMITTED', 'UNDER_REVIEW', 'FIELD_VERIFICATION', 'VERIFIED', 'SUPERVISOR_REVIEW', 'APPROVED', 'COMPLETED'];
  const currentIndex = currentStatus === 'REJECTED' ? -1 : statusOrder.indexOf(currentStatus);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-blue-600" />
        Application Governance Lifecycle
      </h3>

      {currentStatus === 'REJECTED' ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-800 text-sm">Application Rejected</h4>
            <p className="text-xs text-red-700 mt-1">
              This application did not fulfill statutory requirements. Check remarks for details.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {steps.map((step, idx) => {
            const isCompleted = currentIndex >= idx;
            const isCurrent = currentIndex === idx;

            return (
              <div key={step.key} className="relative flex items-start group">
                <div
                  className={`absolute -left-6 top-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-white border-blue-600 text-blue-600 animate-pulse'
                      : 'bg-white border-slate-300 text-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  )}
                </div>

                <div className="ml-2">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted ? 'text-slate-900 font-semibold' : isCurrent ? 'text-blue-700 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicationTimeline;
