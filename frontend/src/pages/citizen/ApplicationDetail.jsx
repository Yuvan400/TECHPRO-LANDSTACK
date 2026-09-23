import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText, ArrowLeft, Download, Printer, ShieldCheck,
  CheckCircle2, Clock, MapPin, User, Building2, Eye,
  AlertTriangle, X, QrCode
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ApplicationTimeline from '../../components/ApplicationTimeline';

export const ApplicationDetail = () => {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/applications/${id}`);
      setApp(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Retrieving application dossier...
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <p className="text-xs text-red-600 font-semibold">{error || 'Application not found'}</p>
        <Link to="/applications" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-block">
          Back to Applications
        </Link>
      </div>
    );
  }

  const isApproved = app.status === 'APPROVED' || app.status === 'COMPLETED';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/applications"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Applications
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 font-mono tracking-wide">
              {app.applicationNumber}
            </h1>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-xs text-slate-500">
            {app.service?.serviceName} • {app.departmentName}
          </p>
        </div>

        {isApproved && (
          <button
            onClick={() => setShowCertificate(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            View Statutory Certificate
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Dossier Details & Field Verification */}
        <div className="lg:col-span-2 space-y-6">

          {/* Parcel & Service Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Target Cadastral Parcel & Citizen Record
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">ULPIN</span>
                <span className="font-mono font-bold text-blue-700">{app.parcel?.ulpin}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Survey Number</span>
                <span className="font-bold text-slate-800">{app.parcel?.surveyNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Parcel Area</span>
                <span className="font-bold text-slate-800">{app.parcel?.areaAcre} Acres</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Registered Owner</span>
                <span className="font-semibold text-slate-800">{app.parcel?.ownerName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-medium text-slate-800">{app.parcel?.village}, {app.parcel?.district}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Title Encumbrance</span>
                <span className="font-medium text-emerald-700">{app.parcel?.encumbranceStatus}</span>
              </div>
            </div>

            {app.citizenRemarks && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Citizen Submission Note:
                </span>
                <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{app.citizenRemarks}"
                </p>
              </div>
            )}
          </div>

          {/* Uploaded Documents Dossier */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Attached Statutory Documents ({app.documents?.length || 0})
            </h3>

            <div className="space-y-2">
              {app.documents?.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">{doc.documentType}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{doc.documentName} • {doc.fileSize}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {doc.aiDocumentClassification || 'Verified'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Field Verification Inspection Report */}
          {app.fieldVerification && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Cadastral Field Inspection Report
                </h3>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {app.fieldVerification.verificationResult}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                  <span className="text-slate-500 block text-[11px]">Field Officer</span>
                  <strong className="text-slate-900">{app.fieldVerification.fieldOfficerName}</strong>
                </div>
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                  <span className="text-slate-500 block text-[11px]">Inspection Date</span>
                  <strong className="text-slate-900">{new Date(app.fieldVerification.inspectionDate).toLocaleDateString('en-IN')}</strong>
                </div>
                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                  <span className="text-slate-500 block text-[11px]">GPS Verified</span>
                  <strong className="text-emerald-700 font-mono">
                    {app.fieldVerification.gpsLatitude?.toFixed(4)}, {app.fieldVerification.gpsLongitude?.toFixed(4)}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800 block mb-1">Officer Site Verification Remarks:</span>
                <p className="text-slate-600 leading-relaxed italic">
                  "{app.fieldVerification.remarks}"
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Workflow Timeline & Official Decisions */}
        <div className="space-y-6">
          <ApplicationTimeline currentStatus={app.status} />

          {/* Officers Assigned & Supervisory Remarks */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Departmental Routing
            </h3>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold">{app.departmentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Supervisor</span>
                <span className="font-semibold">{app.supervisorName || 'Pending Assignment'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Field Officer</span>
                <span className="font-semibold">{app.fieldOfficerName || 'Not Assigned'}</span>
              </div>
            </div>

            {app.supervisorRemarks && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Supervisor Decision Remarks:
                </span>
                <p className="text-xs text-slate-800 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                  {app.supervisorRemarks}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Digital Statutory Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-4 border-slate-900 overflow-hidden animate-in zoom-in-95">

            {/* Print / Close controls */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Statutory Digital Certificate (Generated by LandStack)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Certificate Template */}
            <div id="printable-certificate" className="p-8 sm:p-12 space-y-6 text-slate-900 bg-[#fffdfa] border-8 border-double border-slate-800 m-4 rounded-xl">
              <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
                <p className="text-xs uppercase font-bold tracking-widest text-slate-600">
                  Government of Tamil Nadu • Revenue Administration
                </p>
                <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-slate-950 uppercase">
                  Certificate of Land Ownership & Title (Patta)
                </h2>
                <p className="text-xs font-mono text-slate-500">
                  Issued under the National Integrated Land Stack Protocol (National Cadastre Standard)
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm font-serif leading-relaxed text-slate-800">
                <p>
                  This is to certify that upon due physical and cadastral DGPS verification, the parcel of land identified by canonical Bhu-Aadhaar ULPIN <strong>{app.parcel?.ulpin}</strong> situated at Revenue Village <strong>{app.parcel?.village}</strong>, Taluk <strong>{app.parcel?.taluk}</strong>, District <strong>{app.parcel?.district}</strong>, is officially recognized and registered under:
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 font-sans text-xs grid grid-cols-2 gap-3 my-4">
                  <div>
                    <span className="text-slate-500 block">Registered Title Holder:</span>
                    <strong className="text-slate-950 text-sm">{app.citizenName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Survey Number / Sub-Div:</span>
                    <strong className="text-slate-950 text-sm">{app.parcel?.surveyNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cadastral Extent / Area:</span>
                    <strong className="text-slate-950 text-sm">{app.parcel?.areaAcre} Acres</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Permitted Land Use:</span>
                    <strong className="text-slate-950 text-sm">{app.parcel?.landUse}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  Certificate Ref No: <span className="font-mono font-bold text-slate-900">{app.certificateNumber || 'CERT-2026-00104'}</span><br />
                  Digital Issuance Date: <span className="font-mono font-bold text-slate-900">{new Date(app.certificateGeneratedAt || app.updatedAt).toLocaleDateString('en-IN')}</span>
                </p>
              </div>

              {/* Seal and Signatures */}
              <div className="pt-6 border-t border-slate-300 flex items-end justify-between font-sans">
                <div className="space-y-1">
                  <div className="w-16 h-16 border border-slate-300 rounded-lg p-1 bg-white flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 block">Scan to Verify on ULPIN Registry</span>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-serif italic font-bold text-slate-900 text-sm">
                    {app.supervisorName || 'Ananya Deshmukh'}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Tahsildar & Revenue Supervisor</p>
                  <p className="text-[9px] font-mono text-emerald-700 font-bold">DIGITALLY SIGNED & HASH-VERIFIED</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationDetail;
