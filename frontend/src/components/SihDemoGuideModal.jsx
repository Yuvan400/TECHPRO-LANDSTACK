import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, CheckCircle2, ArrowRight, UserCheck, ShieldCheck,
  MapPin, FileText, ClipboardCheck, Sparkles, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SihDemoGuideModal = ({ isOpen, onClose }) => {
  const { loginCitizen, loginStaff, user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const steps = [
    {
      step: '1-3',
      role: 'CITIZEN',
      title: 'Search ULPIN & Cadastral Inspection',
      desc: 'Log in as Citizen, search ULPIN 33TNCHN0000123456, view GIS polygon boundary, title status, and AI risk score.',
      actionLabel: '1-Click Citizen Login & View Map',
      onClick: async () => {
        await loginCitizen('citizen@landstack.demo', 'Demo@123');
        onClose();
        navigate('/map?search=33TNCHN0000123456');
      }
    },
    {
      step: '4-5',
      role: 'CITIZEN',
      title: 'Apply for Land Ownership Certificate',
      desc: 'Submit statutory application for Land Ownership Certificate (Patta) with document verification simulation.',
      actionLabel: 'Go to Apply Service Form',
      onClick: () => {
        onClose();
        navigate('/services/apply?ulpin=33TNCHN0000123456&serviceId=1');
      }
    },
    {
      step: '6-9',
      role: 'SUPERVISOR',
      title: 'Supervisor Scrutiny & Field Assignment',
      desc: 'Supervisor logs into Staff Portal, reviews incoming application, verifies documents, and assigns Cadastral Field Officer.',
      actionLabel: '1-Click Supervisor Login & Queue',
      onClick: async () => {
        await loginStaff('supervisor@landstack.demo', 'Demo@123');
        onClose();
        navigate('/supervisor');
      }
    },
    {
      step: '10-12',
      role: 'FIELD_OFFICER',
      title: 'Cadastral Physical Site Verification',
      desc: 'Field Officer opens assigned case, inspects GPS coordinates, uploads site verification photograph, and marks boundaries verified.',
      actionLabel: '1-Click Field Officer Login',
      onClick: async () => {
        await loginStaff('officer@landstack.demo', 'Demo@123');
        onClose();
        navigate('/field');
      }
    },
    {
      step: '13-14',
      role: 'SUPERVISOR',
      title: 'Supervisory Final Approval',
      desc: 'Supervisor inspects completed field report and grants statutory approval, automatically issuing the certified digital deed.',
      actionLabel: 'Return to Supervisor Approval',
      onClick: async () => {
        await loginStaff('supervisor@landstack.demo', 'Demo@123');
        onClose();
        navigate('/supervisor');
      }
    },
    {
      step: '15-16',
      role: 'CITIZEN',
      title: 'Citizen Notification & Certificate Download',
      desc: 'Citizen receives real-time approval notification and downloads the digitally generated statutory certificate.',
      actionLabel: 'Check Citizen Certificate',
      onClick: async () => {
        await loginCitizen('citizen@landstack.demo', 'Demo@123');
        onClose();
        navigate('/applications');
      }
    },
    {
      step: '17',
      role: 'ADMIN',
      title: 'Executive Analytics & Tamper-Evident Audit Trail',
      desc: 'Admin inspects live department throughput metrics and reviews the end-to-end cryptographic audit logs.',
      actionLabel: '1-Click Admin Login & Audit Trail',
      onClick: async () => {
        await loginStaff('admin@landstack.demo', 'Demo@123');
        onClose();
        navigate('/admin/audit-logs');
      }
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                SIH 2026 Walkthrough
              </span>
              <span className="text-xs text-blue-200 font-mono">17-Step Demo Flow</span>
            </div>
            <h3 className="text-lg font-bold mt-1 text-white">
              Smart Land Governance Live Demonstration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Follow this sequential demonstration during your SIH presentation. You can click the <strong>1-Click Switch</strong> buttons beside each phase to automatically log in as the correct actor and jump straight to the relevant screen:
          </p>

          <div className="space-y-3">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                        Step {s.step}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
                        {s.role}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {s.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>

                  <button
                    onClick={s.onClick}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 shadow-sm transition active:scale-95"
                  >
                    <span>{s.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Active User: <strong>{user ? `${user.fullName} (${user.role})` : 'Not Logged In'}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};

export default SihDemoGuideModal;
