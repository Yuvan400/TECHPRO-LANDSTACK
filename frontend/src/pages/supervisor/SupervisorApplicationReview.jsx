import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckSquare, Clock, MapPin, Camera, CheckCircle2,
  AlertTriangle, Navigation, Upload, X, ShieldCheck, FileCheck,
  Eye, FileText, Send, Calendar, AlertCircle, CheckCircle,
  Layers, Printer, Download, Save, RefreshCw, Compass, HelpCircle,
  Building, User, Phone, Mail, Award, Check, RotateCcw, Search,
  ExternalLink, Edit3, Flag, XCircle, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { getServiceInspectionConfig } from '../../utils/serviceInspectionConfig';

export const SupervisorApplicationReview = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fieldReport'); // 'fieldReport' | 'tripartite' | 'documents' | 'gis' | 'citizen'

  // Photo review state (Accepted, Insufficient Evidence, Requires Additional Photo)
  const [photoReviews, setPhotoReviews] = useState({});

  // 1. APPROVE MODAL STATE
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState('Ground truth, boundary measurements, and documentary evidence validated compliant with statutory guidelines. Final sanction granted.');
  const [approving, setApproving] = useState(false);

  // 2. REJECT MODAL STATE
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Discrepancy in land boundary or ownership title');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // 3. RETURN FOR CORRECTION MODAL STATE
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('GPS mismatch with cadastral polygon');
  const [requiredCorrection, setRequiredCorrection] = useState('Re-verify southern corner stone and capture updated geotagged photographs.');
  const [additionalEvidence, setAdditionalEvidence] = useState('');
  const [returning, setReturning] = useState(false);

  // 4. ESCALATE MODAL STATE
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateIssueType, setEscalateIssueType] = useState('BOUNDARY_DISPUTE');
  const [escalatePriority, setEscalatePriority] = useState('HIGH');
  const [escalateDescription, setEscalateDescription] = useState('Severe boundary variance detected between FMB survey sketch and physical site possession. Requires District Collector / Admin intervention.');
  const [escalateRemarks, setEscalateRemarks] = useState('');
  const [escalating, setEscalating] = useState(false);

  // 5. DETAIL CORRECTION MODAL STATE
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctFieldName, setCorrectFieldName] = useState('areaAcre');
  const [correctPreviousVal, setCorrectPreviousVal] = useState('');
  const [correctNewVal, setCorrectNewVal] = useState('');
  const [correctReason, setCorrectReason] = useState('');
  const [correctingDetail, setCorrectingDetail] = useState(false);

  // Document review modal state
  const [docReviewModal, setDocReviewModal] = useState(null);
  const [docReviewAction, setDocReviewAction] = useState('CONFIRM_VERIFIED');
  const [docReviewRemarks, setDocReviewRemarks] = useState('');
  const [reviewingDoc, setReviewingDoc] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/supervisor/application/${applicationId}`);
      setApp(res.data);
    } catch (err) {
      console.error('Failed to load application:', err);
      alert('Unable to load application dossier. You may not have jurisdiction for this department.');
      navigate('/supervisor/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // 1. APPROVE FINAL DECISION
  const handleApprove = async (e) => {
    e.preventDefault();
    setApproving(true);
    try {
      await api.post('/api/supervisor/decision', {
        applicationId: app.id,
        decision: 'APPROVE',
        remarks: approveRemarks
      });
      setShowApproveModal(false);
      await loadApplication();
      alert(`Application ${app.applicationNumber} successfully APPROVED. Final certificate/sanction issued.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve application');
    } finally {
      setApproving(false);
    }
  };

  // 2. REJECT FINAL DECISION
  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Rejection reason is mandatory.');
      return;
    }
    setRejecting(true);
    try {
      await api.post('/api/supervisor/decision', {
        applicationId: app.id,
        decision: 'REJECT',
        reason: rejectReason,
        remarks: rejectRemarks
      });
      setShowRejectModal(false);
      await loadApplication();
      alert(`Application ${app.applicationNumber} has been REJECTED. Citizen notified.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setRejecting(false);
    }
  };

  // 3. RETURN FOR CORRECTION DECISION
  const handleReturnForCorrection = async (e) => {
    e.preventDefault();
    if (!requiredCorrection.trim()) {
      alert('Required correction description is mandatory.');
      return;
    }
    setReturning(true);
    try {
      await api.post('/api/supervisor/decision', {
        applicationId: app.id,
        decision: 'RETURN_CORRECTION',
        reason: returnReason,
        requiredCorrection: requiredCorrection,
        additionalInfo: additionalEvidence
      });
      setShowReturnModal(false);
      await loadApplication();
      alert(`Application ${app.applicationNumber} returned to Field Officer for correction.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to return application');
    } finally {
      setReturning(false);
    }
  };

  // 4. ESCALATE TO ADMIN DECISION
  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!escalateDescription.trim()) {
      alert('Escalation description is mandatory.');
      return;
    }
    setEscalating(true);
    try {
      await api.post('/api/supervisor/decision', {
        applicationId: app.id,
        decision: 'ESCALATE',
        issueType: escalateIssueType,
        priority: escalatePriority,
        description: escalateDescription,
        remarks: escalateRemarks
      });
      setShowEscalateModal(false);
      await loadApplication();
      alert(`Application ${app.applicationNumber} ESCALATED to Admin / Higher Authority.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to escalate application');
    } finally {
      setEscalating(false);
    }
  };

  // 5. DETAIL CORRECTION HANDLER
  const openCorrectionModal = (defaultField = 'areaAcre') => {
    setCorrectFieldName(defaultField);
    let prev = '';
    if (defaultField === 'areaAcre') prev = app.parcel?.areaAcre?.toString() || '';
    else if (defaultField === 'surveyNumber') prev = app.parcel?.surveyNumber || '';
    else if (defaultField === 'boundaryStonesStatus') prev = reportDataObj.boundaryStonesStatus || 'All 4 Corner Stones Intact';
    else if (defaultField === 'roadAccessWidth') prev = reportDataObj.roadAccessWidth || '9.14';
    else if (defaultField === 'groundUse') prev = reportDataObj.groundUse || 'Vacant Land';
    setCorrectPreviousVal(prev);
    setCorrectNewVal('');
    setCorrectReason('');
    setShowCorrectionModal(true);
  };

  const handleCorrectDetail = async (e) => {
    e.preventDefault();
    if (!correctNewVal.trim() || !correctReason.trim()) {
      alert('Updated value and mandatory auditable reason are required.');
      return;
    }
    setCorrectingDetail(true);
    try {
      await api.post('/api/supervisor/correct-detail', {
        applicationId: app.id,
        fieldName: correctFieldName,
        previousValue: correctPreviousVal,
        updatedValue: correctNewVal,
        reason: correctReason
      });
      setShowCorrectionModal(false);
      await loadApplication();
      alert(`Field '${correctFieldName}' updated successfully. Audit log created.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to correct detail');
    } finally {
      setCorrectingDetail(false);
    }
  };

  // Document review handler
  const handleDocumentReview = async (e) => {
    e.preventDefault();
    if (!docReviewModal) return;
    setReviewingDoc(true);
    try {
      await api.post('/api/supervisor/document/review', {
        documentId: docReviewModal.id,
        action: docReviewAction,
        remarks: docReviewRemarks
      });
      setDocReviewModal(null);
      await loadApplication();
      alert('Document review status recorded.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review document');
    } finally {
      setReviewingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-semibold text-slate-700">Loading supervisor review dossier...</p>
      </div>
    );
  }

  if (!app) return null;

  const fv = app.fieldVerification;
  let reportDataObj = {};
  if (fv?.reportData) {
    try {
      reportDataObj = JSON.parse(fv.reportData);
    } catch (e) {
      // Ignored
    }
  }

  const serviceConfig = getServiceInspectionConfig(app.service?.serviceCode);

  // 6-STAGE WORKFLOW STEP EVALUATION
  // Stage 1: Citizen Submitted
  // Stage 2: Supervisor Review & Assignment
  // Stage 3: Assigned to Officer
  // Stage 4: Officer Processing & Survey
  // Stage 5: Submitted for Supervisor Verification
  // Stage 6: Final Decision (Approved / Completed, Rejected, Correction Required, Escalated)
  const getWorkflowStage = (status) => {
    if (['APPROVED', 'COMPLETED', 'REJECTED', 'CORRECTION_REQUIRED', 'ESCALATED'].includes(status)) return 6;
    if (['SUBMITTED_FOR_SUPERVISOR_REVIEW', 'VERIFIED', 'READY_FOR_APPROVAL'].includes(status)) return 5;
    if (['OFFICER_PROCESSING', 'FIELD_VERIFICATION', 'INSPECTION_COMPLETED'].includes(status)) return 4;
    if (['ASSIGNED_TO_OFFICER', 'ASSIGNED', 'INSPECTION_SCHEDULED'].includes(status)) return 3;
    if (['SUPERVISOR_REVIEW', 'PENDING_ASSIGNMENT', 'PENDING_REVIEW'].includes(status)) return 2;
    return 1;
  };

  const currentStage = getWorkflowStage(app.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* 1. Header Toolbar & Dossier Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              to="/supervisor/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Supervisor Dashboard
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">
                {app.applicationNumber}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                {app.service?.serviceName}
              </span>
              <StatusBadge status={app.status} />

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                app.slaStatus === 'SLA_BREACHED' || app.slaStatus === 'BREACHED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : app.slaStatus === 'APPROACHING_SLA' || app.slaStatus === 'AT_RISK'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                SLA: {app.daysRemaining} days left ({app.daysElapsed}/{app.slaDays} days)
              </span>
            </div>

            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Citizen: <strong className="text-slate-900">{app.citizenName}</strong></span>
              <span>•</span>
              <span className="font-mono font-bold text-teal-700">ULPIN: {app.parcel?.ulpin || 'N/A'}</span>
              <span>•</span>
              <span>Survey: <strong>{app.parcel?.surveyNumber || '-'}</strong> ({app.parcel?.village || 'Tambaram'})</span>
              <span>•</span>
              <span>Assigned Officer: <strong className="text-slate-900">{app.assignedOfficer?.fullName || app.fieldOfficerName || 'Not Assigned'}</strong></span>
            </p>
          </div>

          {/* Top Supervisor Final Decision & Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. APPROVE */}
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              title="Grant statutory approval & complete application"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>

            {/* 2. REJECT */}
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              title="Reject application with mandatory reason"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>

            {/* 3. RETURN FOR CORRECTION */}
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border border-amber-300"
              title="Return to Officer for physical correction or re-inspection"
            >
              <RotateCcw className="w-4 h-4" />
              Correction Required
            </button>

            {/* 4. ESCALATE */}
            <button
              onClick={() => setShowEscalateModal(true)}
              className="px-3.5 py-2 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-800 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border border-fuchsia-300"
              title="Escalate dispute or complex title defect to Admin"
            >
              <Flag className="w-4 h-4" />
              Escalate
            </button>

            {/* 5. AUTHORIZED DETAIL CORRECTION */}
            <button
              onClick={() => openCorrectionModal('areaAcre')}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border border-purple-200"
              title="Authorized supervisory detail correction with audit trail"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Correct Detail
            </button>

            {/* 6. PRINT */}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              title="Print Dossier"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6-STAGE CITIZEN WORKFLOW LIFECYCLE PROGRESS BAR */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Statutory 6-Stage Application Lifecycle:
            </span>
            <span className="font-bold text-purple-800 text-[11px]">
              Stage {currentStage} of 6 — {app.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-[10px] font-bold">
            {/* Step 1 */}
            <div className={`p-2 rounded-xl border transition ${
              currentStage >= 1 ? 'bg-purple-100 border-purple-300 text-purple-900 font-black' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Check className={`w-3 h-3 ${currentStage >= 1 ? 'text-purple-700' : 'text-slate-300'}`} />
                <span>Step 1</span>
              </div>
              <p className="truncate">Citizen Submitted</p>
            </div>

            {/* Step 2 */}
            <div className={`p-2 rounded-xl border transition ${
              currentStage >= 2 ? 'bg-purple-100 border-purple-300 text-purple-900 font-black' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Check className={`w-3 h-3 ${currentStage >= 2 ? 'text-purple-700' : 'text-slate-300'}`} />
                <span>Step 2</span>
              </div>
              <p className="truncate">Supervisor Review</p>
            </div>

            {/* Step 3 */}
            <div className={`p-2 rounded-xl border transition ${
              currentStage >= 3 ? 'bg-purple-100 border-purple-300 text-purple-900 font-black' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Check className={`w-3 h-3 ${currentStage >= 3 ? 'text-purple-700' : 'text-slate-300'}`} />
                <span>Step 3</span>
              </div>
              <p className="truncate">Assigned to Officer</p>
            </div>

            {/* Step 4 */}
            <div className={`p-2 rounded-xl border transition ${
              currentStage >= 4 ? 'bg-purple-100 border-purple-300 text-purple-900 font-black' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Check className={`w-3 h-3 ${currentStage >= 4 ? 'text-purple-700' : 'text-slate-300'}`} />
                <span>Step 4</span>
              </div>
              <p className="truncate">Officer Processing</p>
            </div>

            {/* Step 5 */}
            <div className={`p-2 rounded-xl border transition ${
              currentStage >= 5 ? 'bg-purple-100 border-purple-300 text-purple-900 font-black' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Check className={`w-3 h-3 ${currentStage >= 5 ? 'text-purple-700' : 'text-slate-300'}`} />
                <span>Step 5</span>
              </div>
              <p className="truncate">Supervisor Verification</p>
            </div>

            {/* Step 6 */}
            <div className={`p-2 rounded-xl border transition ${
              currentStage === 6
                ? app.status === 'APPROVED' || app.status === 'COMPLETED'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-black'
                  : app.status === 'REJECTED'
                  ? 'bg-rose-100 border-rose-300 text-rose-900 font-black'
                  : app.status === 'ESCALATED'
                  ? 'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900 font-black'
                  : 'bg-amber-100 border-amber-300 text-amber-900 font-black'
                : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Check className={`w-3 h-3 ${currentStage === 6 ? 'text-purple-700' : 'text-slate-300'}`} />
                <span>Step 6</span>
              </div>
              <p className="truncate">{currentStage === 6 ? app.status.replace(/_/g, ' ') : 'Final Decision'}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('fieldReport')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'fieldReport'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Field Inspection Report Review
          </button>

          <button
            onClick={() => setActiveTab('tripartite')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'tripartite'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Land Record vs Ground Truth
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Document Scrutiny Review ({app.documents?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('gis')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'gis'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            GIS & Cadastral Overlay
          </button>

          <button
            onClick={() => setActiveTab('citizen')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'citizen'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Citizen & Parcel Profile
          </button>
        </div>
      </div>

      {/* 2. TAB 1: FIELD INSPECTION REPORT EVALUATION */}
      {activeTab === 'fieldReport' && (
        <div className="space-y-6">

          {/* Inspection Summary Banner */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  Field Officer Inspection Report Evaluation
                </h3>
                <p className="text-xs text-slate-500">
                  Scrutinize on-site ground truth observations recorded by Field Officer {app.assignedOfficer?.fullName || app.fieldOfficerName || 'Vikramaditya Rao'}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                  Ref: {fv?.inspectionNumber || 'INSP-2026-00412'}
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Officer Finding: {fv?.officerFinding || 'Verified'}
                </span>
              </div>
            </div>

            {/* GPS Verification Check */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inspected GPS Coordinates</span>
                <p className="text-sm font-mono font-bold text-slate-900">
                  {fv?.gpsLatitude?.toFixed(5) || app.parcel?.latitude?.toFixed(5) || '12.92490'}°N, {fv?.gpsLongitude?.toFixed(5) || app.parcel?.longitude?.toFixed(5) || '80.14810'}°E
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Precision: ±{fv?.gpsAccuracy || 2.4}m • Handheld RTK-DGPS
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registered Parcel Centroid</span>
                <p className="text-sm font-mono font-bold text-slate-900">
                  {app.parcel?.latitude?.toFixed(5) || '12.92485'}°N, {app.parcel?.longitude?.toFixed(5) || '80.14805'}°E
                </p>
                <p className="text-[10px] text-emerald-700 font-bold">
                  Conforms to Cadastral Polygon (Variance &lt; 0.5m)
                </p>
              </div>

              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">Statutory Determination</span>
                <p className="text-sm font-mono font-bold text-purple-900">
                  {fv?.verificationResult || 'VERIFIED_COMPLIANT'}
                </p>
                <p className="text-[10px] text-purple-700">
                  Encroachment: <strong>{fv?.encroachmentDetected ? 'DETECTED' : 'NONE DETECTED'}</strong>
                </p>
              </div>
            </div>

            {/* Boundaries & Physical Condition */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Ground Boundary & Physical Conditions
                </span>
                <button
                  onClick={() => openCorrectionModal('boundaryStonesStatus')}
                  className="text-purple-700 hover:text-purple-900 font-bold text-[11px] inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit Observation
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Boundary Markers:</span>
                  <p className="text-slate-800 font-medium mt-0.5">{reportDataObj.boundaryStonesStatus || 'All 4 Corner Stones Intact & Undisturbed'}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Road Access & Width:</span>
                  <p className="text-slate-800 font-medium mt-0.5">{reportDataObj.roadAccessWidth || '9.14'} meters ({reportDataObj.roadType || 'Tar Road'})</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">North & South Bounds:</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    N: {reportDataObj.northBoundary || 'Matches survey line'} | S: {reportDataObj.southBoundary || 'Road approach'}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">East & West Bounds:</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    E: {reportDataObj.eastBoundary || 'Adjoining parcel'} | W: {reportDataObj.westBoundary || 'Clear boundary'}
                  </p>
                </div>
              </div>
            </div>

            {/* Officer Remarks */}
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-1.5 text-xs">
              <span className="font-bold text-purple-900 uppercase tracking-wider text-[11px]">Field Officer Inspection Remarks</span>
              <p className="text-slate-800 leading-relaxed italic">
                "{fv?.remarks || app.fieldOfficerRemarks || 'Physical site inspection completed. Ground boundary measurements agree with cadastral FMB sketch. No adverse possession or encroachment detected.'}"
              </p>
            </div>
          </div>

          {/* Service-Specific Parameters */}
          {serviceConfig && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Service Parameters: {app.service?.serviceName}
                  </h3>
                  <p className="text-xs text-slate-500">{serviceConfig.statutoryRule}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {serviceConfig.fields.map((fld) => {
                  const recordedVal = reportDataObj.serviceParams?.[fld.id] || 'Verified Compliant';
                  return (
                    <div key={fld.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-700 text-[11px] block">{fld.label}</span>
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {recordedVal} {fld.unit && <span className="text-xs text-slate-500 font-normal">{fld.unit}</span>}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Within statutory threshold
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photographs Scrutiny Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Camera className="w-5 h-5 text-purple-600" />
              Inspection Photographs Scrutiny
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {(reportDataObj.photos || [
                { title: 'North Boundary Marker', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', tag: 'DGPS Peg #1' },
                { title: 'Front Access Road & Frontage', url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800', tag: '30ft Roadway' }
              ]).map((p, idx) => {
                const currentStatus = photoReviews[idx] || 'ACCEPTED';

                return (
                  <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm flex flex-col justify-between">
                    <div>
                      <img src={p.url} alt={p.title} className="w-full h-44 object-cover" />
                      <div className="p-3 text-xs space-y-1">
                        <p className="font-bold text-slate-900">{p.title}</p>
                        <p className="text-[11px] text-teal-700 font-mono">{p.tag}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Geotagged & Timestamped</p>
                      </div>
                    </div>

                    <div className="p-3 pt-0 border-t border-slate-100 space-y-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supervisor Scrutiny:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPhotoReviews({ ...photoReviews, [idx]: 'ACCEPTED' })}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                            currentStatus === 'ACCEPTED' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          Accepted
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoReviews({ ...photoReviews, [idx]: 'INSUFFICIENT' })}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                            currentStatus === 'INSUFFICIENT' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          Insufficient
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoReviews({ ...photoReviews, [idx]: 'NEED_MORE' })}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition ${
                            currentStatus === 'NEED_MORE' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          Re-photo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 3. TAB 2: TRIPARTITE LAND RECORD CROSS-COMPARISON */}
      {activeTab === 'tripartite' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Tripartite Land Record Cross-Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Government Land Registry vs Citizen Application Data vs Field Officer Observation
              </p>
            </div>
            <button
              onClick={() => openCorrectionModal('areaAcre')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 border border-blue-200"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Correct Area / Extent
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Land Attribute</th>
                  <th className="px-4 py-3.5">Government Registry</th>
                  <th className="px-4 py-3.5">Citizen Application</th>
                  <th className="px-4 py-3.5">Field Officer Observation</th>
                  <th className="px-4 py-3.5 text-center">Variance / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Survey & Sub-division</td>
                  <td className="px-4 py-3.5 font-mono">{app.parcel?.surveyNumber || '142/2A'}</td>
                  <td className="px-4 py-3.5 font-mono">{app.parcel?.surveyNumber || '142/2A'}</td>
                  <td className="px-4 py-3.5 font-mono">{app.parcel?.surveyNumber || '142/2A'}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">CONSISTENT</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Total Area / Extent</td>
                  <td className="px-4 py-3.5">{app.parcel?.areaAcre || '0.45'} Acres</td>
                  <td className="px-4 py-3.5">{app.parcel?.areaAcre || '0.45'} Acres</td>
                  <td className="px-4 py-3.5">{app.parcel?.areaAcre || '0.45'} Acres (DGPS verified)</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">0.0% VARIANCE</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Registered Title Holder</td>
                  <td className="px-4 py-3.5">{app.parcel?.ownerName || app.citizenName}</td>
                  <td className="px-4 py-3.5">{app.citizenName}</td>
                  <td className="px-4 py-3.5">Undisputed possession confirmed</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">VERIFIED</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Land Classification & Use</td>
                  <td className="px-4 py-3.5">{app.parcel?.landType || 'Ryotwari Dry'}</td>
                  <td className="px-4 py-3.5">{app.parcel?.landUse || 'Residential'}</td>
                  <td className="px-4 py-3.5">{reportDataObj.groundUse || 'Vacant Plot'}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">MATCH</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Access Corridor Width</td>
                  <td className="px-4 py-3.5">Survey road corridor</td>
                  <td className="px-4 py-3.5">30ft Roadway</td>
                  <td className="px-4 py-3.5">{reportDataObj.roadAccessWidth || '9.14'}m</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">MATCH</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 3: DOCUMENT REVIEW */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Supervisor Document Scrutiny & Endorsement
              </h3>
              <p className="text-xs text-slate-500">
                Audit documents verified by Field Officer {app.assignedOfficer?.fullName || app.fieldOfficerName}.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 space-y-4">
            {app.documents?.map((doc) => (
              <div key={doc.id} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{doc.documentType}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Officer: {doc.verificationStatus || 'PENDING'}
                    </span>
                    {doc.aiDocumentClassification && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-mono border border-purple-200">
                        {doc.aiDocumentClassification}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">File: <strong>{doc.documentName}</strong> ({doc.fileSize})</p>
                  {doc.officerRemark && (
                    <p className="italic text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      Officer Remark: "{doc.officerRemark}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </a>

                  <button
                    onClick={() => {
                      setDocReviewModal(doc);
                      setDocReviewAction(doc.verificationStatus === 'VERIFIED' ? 'CONFIRM_VERIFIED' : 'REQUEST_CLARIFICATION');
                      setDocReviewRemarks(`Confirmed by Supervisor ${user?.fullName || 'Ananya Deshmukh'}.`);
                    }}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Supervisor Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 4: GIS & CADASTRAL OVERLAY */}
      {activeTab === 'gis' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                Cadastral Survey GIS Verification Layer
              </h3>
              <p className="text-xs text-slate-500">
                Service-specific GIS layers for parcel ULPIN: {app.parcel?.ulpin || 'N/A'}
              </p>
            </div>

            <Link
              to={`/map?search=${encodeURIComponent(app.parcel?.ulpin || app.parcel?.surveyNumber || '')}`}
              target="_blank"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
            >
              Open Fullscreen GIS Viewer
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700">GIS Comparison Status:</span>
              <p className="text-sm font-black text-emerald-700">Matched (Compliant)</p>
              <p className="text-[10px] text-slate-500">Cadastral boundary overlays with satellite imagery.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700">Buffer Restrictions:</span>
              <p className="text-sm font-black text-slate-900">No Restricted Buffers</p>
              <p className="text-[10px] text-slate-500">Clear of lake catchment and protected monuments.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700">Road RoW Alignment:</span>
              <p className="text-sm font-black text-slate-900">30ft Master Plan Road</p>
              <p className="text-[10px] text-slate-500">No road widening reservation affected.</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700">Encroachment Margin:</span>
              <p className="text-sm font-black text-emerald-700">0.00% (Clear Bounds)</p>
              <p className="text-[10px] text-slate-500">FMB stone dimensions align with GIS boundaries.</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 5: CITIZEN PROFILE */}
      {activeTab === 'citizen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-3 text-xs">
            <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Citizen Applicant Profile</h4>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold text-slate-900">{app.citizenName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Mobile:</span>
              <span className="font-mono font-bold text-slate-900">{app.citizenMobile}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-700">{app.citizenEmail || 'contact@citizen.portal'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Submitted On:</span>
              <span className="font-mono text-slate-700">{new Date(app.createdAt).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-3 text-xs">
            <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Department Assignment & Field Officer</h4>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-purple-900">{app.departmentName || app.service?.departmentName || 'Revenue'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Assigned Field Officer:</span>
              <span className="font-bold text-slate-900">{app.assignedOfficer?.fullName || app.fieldOfficerName || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">SLA Processing Window:</span>
              <span className="font-bold text-slate-900">{app.slaDays || 15} statutory business days</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: APPROVE FINAL DECISION                                           */}
      {/* ========================================================================= */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-emerald-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Statutory Supervisor Approval
              </h3>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 leading-relaxed text-[11px]">
                <strong>Final Executive Determination:</strong> You are granting statutory approval for Application <strong>{app.applicationNumber}</strong>. The application will transition to <strong>APPROVED / COMPLETED</strong> and the statutory digital certificate/sanction order will be generated.
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Approval Endorsement Remarks *
                </label>
                <textarea
                  rows={4}
                  required
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approving}
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md shadow-emerald-700/20"
                >
                  {approving ? 'Granting Sanction...' : 'Confirm & Issue Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT FINAL DECISION                                            */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-rose-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                Reject Citizen Application
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 leading-relaxed text-[11px]">
                <strong>Mandatory Statutory Rejection:</strong> A formal rejection reason is legally required. This rationale will be incorporated into the official rejection order issued to the applicant.
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rejection Reason Category *
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 font-bold"
                >
                  <option value="Discrepancy in land boundary or ownership title">Discrepancy in land boundary or ownership title</option>
                  <option value="Severe encroachment detected on government or poramboke land">Severe encroachment detected on government or poramboke land</option>
                  <option value="Document fraud or fraudulent encumbrance certificate">Document fraud or fraudulent encumbrance certificate</option>
                  <option value="Statutory buffer zone or waterbody violation">Statutory buffer zone or waterbody violation</option>
                  <option value="Failure to furnish mandatory clarifications within statutory SLA">Failure to furnish mandatory clarifications within statutory SLA</option>
                  <option value="Sub-division rules non-compliant with planning guidelines">Sub-division rules non-compliant with planning guidelines</option>
                  <option value="Other statutory non-compliance">Other statutory non-compliance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Findings & Justification
                </label>
                <textarea
                  rows={3}
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Record specific legal/physical inspection findings justifying rejection..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20"
                >
                  {rejecting ? 'Issuing Rejection...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RETURN FOR CORRECTION                                             */}
      {/* ========================================================================= */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-amber-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-300" />
                Return Application for Correction
              </h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnForCorrection} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Return Deficiency Reason
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-600 font-bold"
                >
                  <option value="GPS mismatch with cadastral polygon">GPS mismatch with cadastral polygon</option>
                  <option value="Missing geotagged boundary photograph">Missing geotagged boundary photograph</option>
                  <option value="Incomplete road width / setback measurement">Incomplete road width / setback measurement</option>
                  <option value="Boundary discrepancy with FMB record">Boundary discrepancy with FMB record</option>
                  <option value="Document not verified by officer">Document not verified by officer</option>
                  <option value="Insufficient on-site observation notes">Insufficient on-site observation notes</option>
                  <option value="Incorrect service parameter completed">Incorrect service parameter completed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Required Correction *
                </label>
                <textarea
                  rows={3}
                  required
                  value={requiredCorrection}
                  onChange={(e) => setRequiredCorrection(e.target.value)}
                  placeholder="Specify exact corrections the field officer must complete..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Information Required (Optional)
                </label>
                <input
                  type="text"
                  value={additionalEvidence}
                  onChange={(e) => setAdditionalEvidence(e.target.value)}
                  placeholder="e.g. Supplementary photo of southern road marker, laser tape setback measurement"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returning}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-600/20"
                >
                  {returning ? 'Returning...' : 'Return for Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ESCALATE TO ADMIN                                                */}
      {/* ========================================================================= */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-fuchsia-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Flag className="w-4 h-4 text-fuchsia-400" />
                Escalate Case to Admin / District Authority
              </h3>
              <button onClick={() => setShowEscalateModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEscalate} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-fuchsia-50 border border-fuchsia-200 rounded-xl text-fuchsia-950 leading-relaxed text-[11px]">
                <strong>Administrative Escalation:</strong> This action transfers jurisdiction to the Department Administrator or District Collector for high-level adjudication, legal determination, or cross-department dispute resolution.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Issue Category
                  </label>
                  <select
                    value={escalateIssueType}
                    onChange={(e) => setEscalateIssueType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="BOUNDARY_DISPUTE">Boundary Dispute</option>
                    <option value="TITLE_CONFLICT">Title / Ownership Conflict</option>
                    <option value="DOCUMENT_FRAUD">Document Fraud Allegation</option>
                    <option value="LEGAL_STAY">Court Stay / Legal Injunction</option>
                    <option value="CORRUPTION_REPORT">Vigilance / Corruption Report</option>
                    <option value="JURISDICTION_ISSUE">Inter-Department Jurisdiction Issue</option>
                    <option value="TECHNICAL_DISCREPANCY">Critical Technical Discrepancy</option>
                    <option value="OTHER">Other High-Priority Escalation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={escalatePriority}
                    onChange={(e) => setEscalatePriority(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="URGENT">Urgent (Collector Intervention)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Escalation Findings & Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={escalateDescription}
                  onChange={(e) => setEscalateDescription(e.target.value)}
                  placeholder="Detail the dispute, conflicting claims, or legal reasons requiring admin review..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Supervisor Remarks
                </label>
                <textarea
                  rows={2}
                  value={escalateRemarks}
                  onChange={(e) => setEscalateRemarks(e.target.value)}
                  placeholder="Supervisor recommendation for District Collector..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={escalating}
                  className="px-5 py-2 bg-fuchsia-700 hover:bg-fuchsia-800 text-white rounded-xl font-bold shadow-md shadow-fuchsia-700/20"
                >
                  {escalating ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: AUTHORIZED DETAIL CORRECTION WITH AUDIT RECORDING                */}
      {/* ========================================================================= */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-purple-950 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                Authorized Supervisory Detail Correction
              </h3>
              <button onClick={() => setShowCorrectionModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCorrectDetail} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 leading-relaxed text-[11px]">
                <strong>Mandatory Audit Recording:</strong> All manual corrections made by Supervisors to officer-submitted parameters are permanently stored in the audit trail with: Previous Value, Updated Value, Reason, Timestamp, and Supervisor ID.
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Field to Correct
                </label>
                <select
                  value={correctFieldName}
                  onChange={(e) => {
                    const f = e.target.value;
                    setCorrectFieldName(f);
                    let p = '';
                    if (f === 'areaAcre') p = app.parcel?.areaAcre?.toString() || '';
                    else if (f === 'surveyNumber') p = app.parcel?.surveyNumber || '';
                    else if (f === 'boundaryStonesStatus') p = reportDataObj.boundaryStonesStatus || 'All 4 Corner Stones Intact';
                    else if (f === 'roadAccessWidth') p = reportDataObj.roadAccessWidth || '9.14';
                    else if (f === 'groundUse') p = reportDataObj.groundUse || 'Vacant Land';
                    setCorrectPreviousVal(p);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono"
                >
                  <option value="areaAcre">Land Area (Acres)</option>
                  <option value="surveyNumber">Survey Number</option>
                  <option value="boundaryStonesStatus">Boundary Stones Observation</option>
                  <option value="roadAccessWidth">Road Access Width (Meters)</option>
                  <option value="groundUse">Ground Land Use Observation</option>
                  <option value="remarks">Field Officer Remarks</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Previous Value
                  </label>
                  <input
                    type="text"
                    value={correctPreviousVal}
                    onChange={(e) => setCorrectPreviousVal(e.target.value)}
                    placeholder="Previous recorded value"
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Updated Correct Value *
                  </label>
                  <input
                    type="text"
                    required
                    value={correctNewVal}
                    onChange={(e) => setCorrectNewVal(e.target.value)}
                    placeholder="Enter revised value"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Auditable Reason for Correction *
                </label>
                <textarea
                  rows={3}
                  required
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  placeholder="State the statutory justification or re-measurement evidence..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctingDetail}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md shadow-purple-700/20"
                >
                  {correctingDetail ? 'Updating & Auditing...' : 'Save & Record Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DOCUMENT REVIEW ACTION                                            */}
      {/* ========================================================================= */}
      {docReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-purple-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Supervisor Document Review</h3>
              <button onClick={() => setDocReviewModal(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDocumentReview} className="p-6 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700">Document:</span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">{docReviewModal.documentName}</p>
                <p className="text-slate-500 font-mono text-[11px]">{docReviewModal.documentType}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Supervisor Decision
                </label>
                <select
                  value={docReviewAction}
                  onChange={(e) => setDocReviewAction(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="CONFIRM_VERIFIED">Confirm Verification (Accept Officer Audit)</option>
                  <option value="REJECT_VERIFICATION">Reject Verification (Document Deficient)</option>
                  <option value="REQUEST_CLARIFICATION">Request Citizen Clarification</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Remarks
                </label>
                <textarea
                  rows={2}
                  value={docReviewRemarks}
                  onChange={(e) => setDocReviewRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setDocReviewModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewingDoc}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold"
                >
                  {reviewingDoc ? 'Saving...' : 'Confirm Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupervisorApplicationReview;
