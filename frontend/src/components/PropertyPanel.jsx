import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, MapPin, Layers, User, ShieldAlert, ShieldCheck,
  FileText, ArrowRight, Activity, Sparkles, CheckCircle2,
  Building2, Calendar, Scale, AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import DepartmentParcelCardView from './DepartmentParcelCardView';

export const PropertyPanel = ({ parcel, onClose }) => {
  const navigate = useNavigate();
  const [aiRisk, setAiRisk] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showFullDeptModal, setShowFullDeptModal] = useState(false);

  useEffect(() => {
    if (parcel?.ulpin) {
      setLoadingAi(true);
      api.get(`/api/ai/parcel-risk/${parcel.ulpin}`)
        .then(res => setAiRisk(res.data))
        .catch(() => setAiRisk(null))
        .finally(() => setLoadingAi(false));
    }
  }, [parcel?.ulpin]);

  if (!parcel) return null;

  const getRiskColor = (score) => {
    if (score < 30) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score < 65) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-600 text-white">
              ULPIN
            </span>
            <span className="text-xs text-slate-400">Cadastral Record</span>
          </div>
          <h2 className="text-base font-bold font-mono tracking-wide mt-1 text-blue-300">
            {parcel.ulpin}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Survey Number</p>
            <p className="text-base font-bold text-slate-900 mt-0.5 font-mono">
              {parcel.surveyNumber}{parcel.subDivision && !parcel.surveyNumber?.includes(parcel.subDivision) ? `/${parcel.subDivision}` : ''}
            </p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Area</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">{parcel.areaAcre} <span className="text-xs font-normal text-slate-500">Acres</span></p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Land Use</p>
            <p className="text-xs font-semibold text-blue-700 mt-1 truncate">{parcel.landUse}</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 font-medium">Status</p>
            <p className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {parcel.verificationStatus}
            </p>
          </div>
        </div>

        {/* AI Parcel Risk & Legal Evaluation */}
        <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-blue-50/60 border border-indigo-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Risk & Compliance Score
            </div>
            {aiRisk && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getRiskColor(aiRisk.overallRiskScore)}`}>
                {aiRisk.riskCategory} Risk ({aiRisk.overallRiskScore}/100)
              </span>
            )}
          </div>

          {loadingAi ? (
            <div className="flex items-center gap-2 text-xs text-indigo-700 py-2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              Synthesizing revenue court, encumbrance, and cadastral records...
            </div>
          ) : aiRisk ? (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <span className="text-slate-500">Title Confidence:</span>
                  <span className="font-bold text-slate-800 ml-1">{aiRisk.titleClearanceConfidence}%</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-indigo-100">
                  <span className="text-slate-500">Zoning Match:</span>
                  <span className="font-bold text-slate-800 ml-1">{aiRisk.zoningComplianceScore}%</span>
                </div>
              </div>

              {aiRisk.flaggedAnomalies?.length > 0 && (
                <div className="mt-2 text-xs text-slate-700 bg-white/90 p-2.5 rounded-lg border border-indigo-100">
                  <p className="font-semibold text-slate-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    AI Intelligence Observations:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600 text-[11px]">
                    {aiRisk.flaggedAnomalies.map((ano, idx) => (
                      <li key={idx}>{ano}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiRisk.disclaimer && (
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  Verified against integrated land registration and revenue court records.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">AI analysis unavailable</p>
          )}
        </div>

        {/* Ownership & Revenue Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            Ownership & Legal Status
          </h3>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Registered Owner</span>
              <span className="font-semibold text-slate-900 text-right">{parcel.ownerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Aadhaar (Masked)</span>
              <span className="font-mono text-slate-700">{parcel.ownerAadhaarMasked || 'Not Linked'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Ownership Nature</span>
              <span className="font-medium text-slate-800">{parcel.ownershipStatus}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Title Encumbrance</span>
              <span className={`font-semibold ${parcel.encumbranceStatus === 'Clear Title' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {parcel.encumbranceStatus}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Municipal Tax Status</span>
              <span className={`font-semibold ${parcel.propertyTaxStatus === 'Paid' ? 'text-emerald-700' : 'text-red-700'}`}>
                {parcel.propertyTaxStatus} ({parcel.lastTaxPaidYear})
              </span>
            </div>
          </div>
        </div>

        {/* Spatial / Location Hierarchy */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600" />
            Administrative & GIS Location
          </h3>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">State</span>
              <span className="font-medium text-slate-800">Tamil Nadu / National Cadastre</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">District</span>
              <span className="font-medium text-slate-800">{parcel.district}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Taluk / Tehsil</span>
              <span className="font-medium text-slate-800">{parcel.taluk}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Revenue Village</span>
              <span className="font-medium text-slate-800">{parcel.village}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">GPS Coordinates</span>
              <span className="font-mono text-slate-700">{parcel.latitude?.toFixed(5)}, {parcel.longitude?.toFixed(5)}</span>
            </div>
          </div>
        </div>

        {/* Market Valuation */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-800 font-medium">Guideline Market Valuation</p>
            <p className="text-lg font-bold text-blue-950 mt-0.5">
              ₹ {parcel.marketValuationInr ? (parcel.marketValuationInr / 100000).toFixed(2) + ' Lakhs' : 'N/A'}
            </p>
          </div>
          <Scale className="w-8 h-8 text-blue-400 opacity-60" />
        </div>

      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
        <button
          type="button"
          onClick={() => setShowFullDeptModal(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md transition active:scale-[0.98]"
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>View Records</span>
        </button>

        <button
          onClick={() => navigate(`/services/apply?ulpin=${parcel.ulpin}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-700/20 transition active:scale-[0.98]"
        >
          <FileText className="w-4 h-4" />
          <span>Apply for Government Service</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
      </div>

      {/* 10-Department Records Modal */}
      {showFullDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex justify-center items-start animate-in fade-in">
          <div className="bg-slate-50 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-6">
            <DepartmentParcelCardView
              parcel={parcel}
              onClose={() => setShowFullDeptModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyPanel;
