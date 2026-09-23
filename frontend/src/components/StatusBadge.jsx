import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const StatusBadge = ({ status }) => {
  const { t } = useLanguage();
  if (!status) return null;

  const styles = {
    SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
    UNDER_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
    PENDING_DOCUMENTS: 'bg-orange-100 text-orange-800 border-orange-200',
    DOCUMENT_VERIFICATION: 'bg-sky-100 text-sky-800 border-sky-300',
    FIELD_VERIFICATION: 'bg-purple-100 text-purple-800 border-purple-200',
    INSPECTION_COMPLETED: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    REPORT_SUBMITTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    FORWARDED_TO_AUTHORITY: 'bg-teal-100 text-teal-800 border-teal-300',
    CLARIFICATION_REQUIRED: 'bg-rose-100 text-rose-800 border-rose-300',
    VERIFIED: 'bg-teal-100 text-teal-800 border-teal-200',
    SUPERVISOR_REVIEW: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
  };

  const badgeStyle = styles[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  const labelKey = `status_${status.toLowerCase()}`;
  const translated = t(labelKey);
  const label = translated && translated !== labelKey ? translated : status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {label}
    </span>
  );
};

export default StatusBadge;
