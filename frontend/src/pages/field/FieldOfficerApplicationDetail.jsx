import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckSquare, Clock, MapPin, Camera, CheckCircle2,
  AlertTriangle, Navigation, Upload, X, ShieldCheck, FileCheck,
  Eye, FileText, Send, Calendar, AlertCircle, CheckCircle,
  Layers, Printer, Download, Save, RefreshCw, Compass, HelpCircle,
  Building, User, Phone, Mail, Award, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { getServiceInspectionConfig } from '../../utils/serviceInspectionConfig';
import { getDepartmentConfig } from '../../utils/departmentOfficerConfig';
import { enqueueOfflineAction } from '../../services/indexedDbService';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const FieldOfficerApplicationDetail = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  // Department configuration
  const deptConfig = getDepartmentConfig(user?.departmentName || user?.department?.name || app?.department?.name);
  const [activeTab, setActiveTab] = useState(deptConfig.canPerformFieldOps ? 'inspection' : 'documents');

  // Document verification modal / state
  const [docVerifyingId, setDocVerifyingId] = useState(null);
  const [docStatus, setDocStatus] = useState('VERIFIED');
  const [docRemark, setDocRemark] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);

  // Field Inspection Form State
  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState('');
  const [gpsCapturing, setGpsCapturing] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsVerified, setGpsVerified] = useState(true);

  // Physical Land Conditions
  const [boundaryStonesStatus, setBoundaryStonesStatus] = useState('All 4 Corner Stones Intact');
  const [northBoundary, setNorthBoundary] = useState('Matches FMB survey line; abutting Survey 124/2');
  const [southBoundary, setSouthBoundary] = useState('Matches FMB survey line; 30ft metal road access');
  const [eastBoundary, setEastBoundary] = useState('Compound wall erect; abutting Survey 124/3A');
  const [westBoundary, setWestBoundary] = useState('Clear boundary line; abutting Survey 124/4');
  const [boundaryMatchesRecord, setBoundaryMatchesRecord] = useState(true);
  const [encroachmentDetected, setEncroachmentDetected] = useState(false);
  const [encroachmentDetails, setEncroachmentDetails] = useState('');
  const [roadAccessWidth, setRoadAccessWidth] = useState('9.14');
  const [roadType, setRoadType] = useState('Bitumen Tar Road');
  const [terrainCondition, setTerrainCondition] = useState('Level Ground');
  const [groundUse, setGroundUse] = useState('Vacant Plot');

  // Service Specific Parameters
  const [serviceParams, setServiceParams] = useState({});
  const [checklistAnswers, setChecklistAnswers] = useState({});

  // Photos
  const [photos, setPhotos] = useState([
    { title: 'North Boundary Marker', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', tag: 'DGPS Peg #1' },
    { title: 'Front Access Road & Frontage', url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800', tag: '30ft Roadway' }
  ]);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Findings & Remarks
  const [officerFinding, setOfficerFinding] = useState('Verified');
  const [verificationResult, setVerificationResult] = useState('VERIFIED_COMPLIANT');
  const [officerRemarks, setOfficerRemarks] = useState('Physical site inspection completed. Ground boundary measurements agree with cadastral FMB sketch. No adverse possession or encroachment detected.');
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Clarification Modal
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationCategory, setClarificationCategory] = useState('DOCUMENT_DEFICIENCY');
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [clarificationDoc, setClarificationDoc] = useState('');
  const [clarificationDueDate, setClarificationDueDate] = useState('');
  const [requestingClarification, setRequestingClarification] = useState(false);

  // Forward to Authority Modal
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardRemarks, setForwardRemarks] = useState('Field verification conducted in accordance with statutory guidelines. Dossier forwarded for final decision.');
  const [forwarding, setForwarding] = useState(false);

  // Schedule Inspection Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [scheduleType, setScheduleType] = useState('Cadastral Ground Verification');
  const [scheduleRemarks, setScheduleRemarks] = useState('On-site physical inspection and ground truth boundary verification.');
  const [scheduling, setScheduling] = useState(false);
  const [startingProcessing, setStartingProcessing] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/field/application/${applicationId}`);
      const data = res.data;
      setApp(data);

      // Pre-fill existing verification data if available
      if (data.fieldVerification) {
        const fv = data.fieldVerification;
        if (fv.gpsLatitude) setGpsLat(fv.gpsLatitude);
        if (fv.gpsLongitude) setGpsLng(fv.gpsLongitude);
        if (fv.gpsAccuracy) setGpsAccuracy(fv.gpsAccuracy);
        if (fv.gpsCoordinatesVerified !== undefined) setGpsVerified(fv.gpsCoordinatesVerified);
        if (fv.boundaryMatchesRecord !== undefined) setBoundaryMatchesRecord(fv.boundaryMatchesRecord);
        if (fv.encroachmentDetected !== undefined) setEncroachmentDetected(fv.encroachmentDetected);
        if (fv.remarks) setOfficerRemarks(fv.remarks);
        if (fv.officerFinding) setOfficerFinding(fv.officerFinding);
        if (fv.verificationResult) setVerificationResult(fv.verificationResult);

        // Parse reportData JSON if present
        if (fv.reportData) {
          try {
            const parsed = JSON.parse(fv.reportData);
            if (parsed.boundaryStonesStatus) setBoundaryStonesStatus(parsed.boundaryStonesStatus);
            if (parsed.northBoundary) setNorthBoundary(parsed.northBoundary);
            if (parsed.southBoundary) setSouthBoundary(parsed.southBoundary);
            if (parsed.eastBoundary) setEastBoundary(parsed.eastBoundary);
            if (parsed.westBoundary) setWestBoundary(parsed.westBoundary);
            if (parsed.roadAccessWidth) setRoadAccessWidth(parsed.roadAccessWidth);
            if (parsed.roadType) setRoadType(parsed.roadType);
            if (parsed.terrainCondition) setTerrainCondition(parsed.terrainCondition);
            if (parsed.groundUse) setGroundUse(parsed.groundUse);
            if (parsed.serviceParams) setServiceParams(parsed.serviceParams);
            if (parsed.checklistAnswers) setChecklistAnswers(parsed.checklistAnswers);
            if (parsed.photos && parsed.photos.length > 0) setPhotos(parsed.photos);
          } catch (e) {
            console.error('Failed to parse reportData', e);
          }
        }
      } else if (data.parcel) {
        setGpsLat(data.parcel.latitude);
        setGpsLng(data.parcel.longitude);
      }
    } catch (err) {
      console.error('Failed to load application:', err);
      alert('Unable to load application dossier. You may not be assigned to this application.');
      navigate('/field-officer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Browser Geolocation API
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. You may manually verify coordinates.');
      return;
    }

    setGpsCapturing(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLat(position.coords.latitude.toFixed(6));
        setGpsLng(position.coords.longitude.toFixed(6));
        setGpsAccuracy(position.coords.accuracy.toFixed(1));
        setGpsCapturing(false);
      },
      (error) => {
        setGpsCapturing(false);
        let errorMsg = 'Location capture unavailable.';
        if (error.code === 1) errorMsg = 'GPS Permission Denied. Please enable location permissions in browser settings.';
        else if (error.code === 2) errorMsg = 'Position unavailable. GPS signal weak.';
        else if (error.code === 3) errorMsg = 'GPS capture timed out.';
        setGpsError(`${errorMsg} Registered cadastral coordinates will be referenced.`);
        // Fallback to parcel coordinates if available
        if (app?.parcel) {
          setGpsLat(app.parcel.latitude);
          setGpsLng(app.parcel.longitude);
          setGpsAccuracy(5.0);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Document verification handler
  const handleOpenDocModal = (doc) => {
    setDocVerifyingId(doc.id);
    setDocStatus(doc.verificationStatus || 'VERIFIED');
    setDocRemark(doc.officerRemark || `Verified with statutory repository.`);
  };

  const handleSaveDocVerification = async () => {
    if (!docVerifyingId) return;
    setSavingDoc(true);
    try {
      await api.post('/api/field/document/verify', {
        documentId: docVerifyingId,
        verificationStatus: docStatus,
        officerRemark: docRemark
      });
      setDocVerifyingId(null);
      await loadApplication();
      alert('Document verification status updated successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update document verification');
    } finally {
      setSavingDoc(false);
    }
  };

  // Compile full report payload
  const buildReportPayload = () => {
    const reportData = {
      boundaryStonesStatus,
      northBoundary,
      southBoundary,
      eastBoundary,
      westBoundary,
      encroachmentDetails: encroachmentDetected ? encroachmentDetails : '',
      roadAccessWidth,
      roadType,
      terrainCondition,
      groundUse,
      serviceParams,
      checklistAnswers,
      photos,
    };

    return {
      applicationId: app.id,
      gpsLatitude: parseFloat(gpsLat) || app.parcel?.latitude,
      gpsLongitude: parseFloat(gpsLng) || app.parcel?.longitude,
      gpsAccuracy: parseFloat(gpsAccuracy) || 3.0,
      gpsCoordinatesVerified: gpsVerified,
      boundaryMatchesRecord,
      encroachmentDetected,
      remarks: officerRemarks,
      photoUrls: photos.map(p => p.url).join(','),
      officerFinding,
      inspectionType: app.service?.serviceName || 'Cadastral Ground Verification',
      reportData: JSON.stringify(reportData),
      verificationResult
    };
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    const payload = buildReportPayload();
    try {
      if (!isOnline) {
        await enqueueOfflineAction('SAVE_INSPECTION_DRAFT', payload);
        alert('Draft saved to offline IndexedDB queue! Will sync when reconnected.');
      } else {
        await api.post('/api/field/inspection/save-draft', payload);
        alert('Inspection draft successfully saved to government server.');
      }
      await loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit Inspection Report
  const handleSubmitReport = async () => {
    if (!window.confirm('Submit finalized inspection report? This marks on-site inspection as COMPLETED.')) return;
    setSubmittingReport(true);
    const payload = buildReportPayload();
    try {
      if (!isOnline) {
        await enqueueOfflineAction('SUBMIT_INSPECTION_REPORT', payload);
        alert('Inspection report saved to offline queue! Will sync when reconnected.');
      } else {
        await api.post('/api/field/inspection/submit-report', payload);
        alert('Field Inspection Report successfully submitted! Status updated to INSPECTION_COMPLETED.');
      }
      await loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit inspection report');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Clarification
  const handleRequestClarification = async (e) => {
    e.preventDefault();
    if (!clarificationMessage.trim()) return;

    setRequestingClarification(true);
    try {
      await api.post('/api/field/inspection/clarification', {
        applicationId: app.id,
        category: clarificationCategory,
        message: clarificationMessage,
        requiredDocument: clarificationDoc,
        dueDate: clarificationDueDate || null
      });
      setShowClarificationModal(false);
      await loadApplication();
      alert('Clarification request dispatched to citizen. Application status set to CLARIFICATION_REQUIRED.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request clarification');
    } finally {
      setRequestingClarification(false);
    }
  };

  // Forward to Approving Authority
  const handleForwardToAuthority = async (e) => {
    e.preventDefault();
    setForwarding(true);
    try {
      await api.post('/api/field/inspection/forward', {
        applicationId: app.id,
        officerFinding,
        remarks: forwardRemarks
      });
      setShowForwardModal(false);
      await loadApplication();
      alert('Application verified and forwarded to Approving Authority / Supervisor.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to forward application');
    } finally {
      setForwarding(false);
    }
  };

  // Start Processing
  const handleStartProcessing = async () => {
    setStartingProcessing(true);
    try {
      await api.post('/api/field/inspection/save-draft', {
        applicationId: app.id,
        remarks: 'Officer initiated active desk & ground verification of application dossier.',
        officerFinding: 'Processing Initiated'
      });
      alert('Application processing initiated. Status updated.');
      await loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start processing');
    } finally {
      setStartingProcessing(false);
    }
  };

  // Schedule Inspection
  const handleScheduleInspection = async (e) => {
    e.preventDefault();
    if (!scheduleDate) return;
    setScheduling(true);
    try {
      await api.post('/api/field/inspection/schedule', {
        applicationId: app.id,
        inspectionDate: scheduleDate,
        inspectionType: scheduleType,
        remarks: scheduleRemarks
      });
      setShowScheduleModal(false);
      alert('Field inspection successfully scheduled! Citizen notified.');
      await loadApplication();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule inspection');
    } finally {
      setScheduling(false);
    }
  };

  // Service configuration
  const serviceConfig = getServiceInspectionConfig(app?.service?.serviceCode);

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-semibold text-slate-700">Loading application dossier...</p>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* 1. Header Navigation & Application Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              to="/officer/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition mb-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Officer Worklist
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xl sm:text-2xl font-black text-slate-900">
                {app.applicationNumber}
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {app.service?.serviceName}
              </span>
              <StatusBadge status={app.status} />
            </div>

            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Citizen: <strong className="text-slate-900">{app.citizenName}</strong> ({app.citizenMobile})</span>
              <span>•</span>
              <Link
                to={`/map?search=${encodeURIComponent(app.parcel?.ulpin || '')}`}
                className="text-teal-700 hover:underline font-mono font-bold inline-flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                ULPIN: {app.parcel?.ulpin}
              </Link>
              <span>•</span>
              <span>Survey: <strong>{app.parcel?.surveyNumber}</strong> ({app.parcel?.village}, {app.parcel?.taluk})</span>
            </p>
          </div>

          {/* Top Officer Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {['ASSIGNED', 'SUBMITTED'].includes(app.status) && (
              <button
                onClick={handleStartProcessing}
                disabled={startingProcessing}
                className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                title="Start Processing Application"
              >
                <Compass className="w-4 h-4" />
                {startingProcessing ? 'Starting...' : 'Start Processing'}
              </button>
            )}

            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border border-slate-300"
              title="Save Draft (Preserves unsubmitted data)"
            >
              <Save className="w-4 h-4" />
              {savingDraft ? 'Saving...' : 'Save Draft'}
            </button>

            {deptConfig.canPerformFieldOps && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border border-indigo-200"
                title="Schedule Field Inspection"
              >
                <Calendar className="w-4 h-4" />
                Schedule Inspection
              </button>
            )}

            <button
              onClick={() => setShowClarificationModal(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border border-rose-200"
              title="Request Clarification from Citizen"
            >
              <AlertTriangle className="w-4 h-4" />
              Request Clarification
            </button>

            <button
              onClick={() => setShowForwardModal(true)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-md shadow-teal-700/20"
              title="Forward to Approving Authority / Supervisor"
            >
              <Send className="w-4 h-4" />
              Forward to Approving Authority
            </button>

            <button
              onClick={() => { setActiveTab('report'); setTimeout(() => window.print(), 300); }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
              title="Print Official Inspection Report"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Dynamically Ordered by Department Configuration) */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2">
          {deptConfig.canPerformFieldOps ? (
            <>
              <button
                onClick={() => setActiveTab('inspection')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'inspection'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                {deptConfig.isCadastralSurvey ? 'Cadastral DGPS Inspection' : deptConfig.fieldInspectionLabel}
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'documents'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                Document Verification ({app.documents?.filter(d => d.verificationStatus === 'VERIFIED').length || 0}/{app.documents?.length || 0})
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'documents'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                Document Scrutiny & Title Audit ({app.documents?.filter(d => d.verificationStatus === 'VERIFIED').length || 0}/{app.documents?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('inspection')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'inspection'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                Site Inspection (Supplementary / Optional)
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('landRecord')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'landRecord'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Land Record vs Ground Truth
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Citizen & Application Profile
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {deptConfig.isCadastralSurvey ? 'Cadastral GIS Map' : 'Department GIS Map'}
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Official Verification Report
          </button>
        </div>
      </div>

      {/* 2. TAB 1: FIELD INSPECTION & DGPS WORKFLOW */}
      {activeTab === 'inspection' && (
        <div className="space-y-6">

          {/* Section A: GPS & Location Evidence Capture */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-teal-600" />
                  GPS & Location Evidence Capture
                </h3>
                <p className="text-xs text-slate-500">
                  Verify ground coordinates using browser Geolocation API or connected RTK-DGPS rover.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={gpsCapturing}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-sm"
              >
                <Compass className={`w-4 h-4 ${gpsCapturing ? 'animate-spin' : ''}`} />
                {gpsCapturing ? 'Acquiring Satellite Lock...' : 'Capture Current Location'}
              </button>
            </div>

            {gpsError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{gpsError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Captured Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={gpsLat}
                  onChange={(e) => setGpsLat(e.target.value)}
                  placeholder="e.g. 12.9249"
                  className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Captured Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={gpsLng}
                  onChange={(e) => setGpsLng(e.target.value)}
                  placeholder="e.g. 80.1472"
                  className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">GPS Accuracy (± meters)</span>
                <input
                  type="number"
                  step="any"
                  value={gpsAccuracy}
                  onChange={(e) => setGpsAccuracy(e.target.value)}
                  placeholder="e.g. 2.4"
                  className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gpsVerified}
                  onChange={(e) => setGpsVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <p className="text-xs font-bold text-teal-900">
                    Handheld GPS / DGPS coordinates conform to Cadastral Polygon
                  </p>
                  <p className="text-[11px] text-teal-700">
                    Registered Parcel Center: {app.parcel?.latitude?.toFixed(4)}, {app.parcel?.longitude?.toFixed(4)}
                  </p>
                </div>
              </label>
              <span className="px-2.5 py-1 rounded-lg bg-teal-200/80 text-teal-900 text-xs font-mono font-bold">
                Delta: ~0.15m (Compliant)
              </span>
            </div>
          </div>

          {/* Section B: Physical Land Conditions & Boundary Verification */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                Physical Land Conditions & Boundary Verification
              </h3>
              <p className="text-xs text-slate-500">
                Ground demarcation audit against Field Measurement Book (FMB) survey record.
              </p>
            </div>

            {/* Boundary Stones Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cadastral Boundary Stones (FMB)
                </label>
                <select
                  value={boundaryStonesStatus}
                  onChange={(e) => setBoundaryStonesStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
                >
                  <option value="All 4 Corner Stones Intact">All 4 Corner Stones Intact & Undisturbed</option>
                  <option value="1 Stone Weathered / Displaced">1 Stone Weathered / Displaced</option>
                  <option value="Multiple Stones Missing">Multiple Stones Missing (Requires Repenning)</option>
                  <option value="Temporary Wooden Pegs Fixed">Temporary Wooden Pegs Fixed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Observed Land Use on Ground
                </label>
                <select
                  value={groundUse}
                  onChange={(e) => setGroundUse(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
                >
                  <option value="Vacant Plot">Vacant Plot (Clear boundaries)</option>
                  <option value="Single-Storey Residential House">Single-Storey Residential House</option>
                  <option value="Commercial Structure">Commercial Structure</option>
                  <option value="Agricultural Crop Cultivation">Agricultural Crop Cultivation</option>
                  <option value="Under Active Construction">Under Active Construction</option>
                </select>
              </div>
            </div>

            {/* 4 Cardinal Boundaries check */}
            <div className="space-y-3">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-xs">
                Cardinal Boundary Verification (North, South, East, West)
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-teal-800">North Boundary:</span>
                  <input
                    type="text"
                    value={northBoundary}
                    onChange={(e) => setNorthBoundary(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-teal-800">South Boundary:</span>
                  <input
                    type="text"
                    value={southBoundary}
                    onChange={(e) => setSouthBoundary(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-teal-800">East Boundary:</span>
                  <input
                    type="text"
                    value={eastBoundary}
                    onChange={(e) => setEastBoundary(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-teal-800">West Boundary:</span>
                  <input
                    type="text"
                    value={westBoundary}
                    onChange={(e) => setWestBoundary(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Encroachment & Access Road */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={boundaryMatchesRecord}
                    onChange={(e) => setBoundaryMatchesRecord(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600"
                  />
                  <span>Boundaries Match FMB Record</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  Physical measurements correspond with state cadastral maps within ±0.5%.
                </p>
              </div>

              <div className={`p-3 rounded-2xl border ${encroachmentDetected ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                  <input
                    type="checkbox"
                    checked={encroachmentDetected}
                    onChange={(e) => setEncroachmentDetected(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span>Encroachment Detected</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  Check if applicant or neighbor encroaches on public or adjacent land.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="font-bold text-slate-700">Access Road Width:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={roadAccessWidth}
                    onChange={(e) => setRoadAccessWidth(e.target.value)}
                    className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                  <span className="text-slate-500 text-xs">meters</span>
                </div>
              </div>
            </div>

            {encroachmentDetected && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl space-y-2 text-xs">
                <label className="block font-bold text-rose-800 uppercase tracking-wider">
                  Encroachment Findings & Extent (sq ft)
                </label>
                <textarea
                  rows={2}
                  value={encroachmentDetails}
                  onChange={(e) => setEncroachmentDetails(e.target.value)}
                  placeholder="Describe encroached portion, survey number affected, and estimated area..."
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}
          </div>

          {/* Section C: Service-Specific Inspection Parameters */}
          {serviceConfig && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-5">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Service Parameters: {app.service?.serviceName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {serviceConfig.statutoryRule}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                  {serviceConfig.inspectionType}
                </span>
              </div>

              {/* Service Dynamic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {serviceConfig.fields.map((fld) => (
                  <div key={fld.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                      {fld.label} {fld.unit && `(${fld.unit})`}
                    </label>
                    {fld.type === 'select' ? (
                      <select
                        value={serviceParams[fld.id] || fld.options[0]}
                        onChange={(e) => setServiceParams({ ...serviceParams, [fld.id]: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
                      >
                        {fld.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type={fld.type}
                          value={serviceParams[fld.id] || ''}
                          onChange={(e) => setServiceParams({ ...serviceParams, [fld.id]: e.target.value })}
                          placeholder={fld.placeholder || ''}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-medium"
                        />
                        {fld.unit && <span className="text-slate-500 font-bold shrink-0">{fld.unit}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Statutory Inspection Checklist */}
              {serviceConfig.checklists && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="block font-bold text-slate-800 uppercase tracking-wider text-xs">
                    Statutory Inspection Checklist
                  </span>
                  <div className="space-y-2 text-xs">
                    {serviceConfig.checklists.map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklistAnswers[idx] !== false}
                          onChange={(e) => setChecklistAnswers({ ...checklistAnswers, [idx]: e.target.checked })}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-slate-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section D: Inspection Photographs Evidence Gallery */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-teal-600" />
                  Geotagged Site Inspection Photographs ({photos.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Photographic evidence of boundary stones, access road, and ground condition.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((p, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
                  <img
                    src={p.url}
                    alt={p.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3 text-xs">
                    <p className="font-bold text-slate-900">{p.title}</p>
                    <p className="text-[11px] text-teal-700 font-mono mt-0.5">{p.tag || 'Geotagged'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Lat: {gpsLat || app.parcel?.latitude?.toFixed(4)}, Lng: {gpsLng || app.parcel?.longitude?.toFixed(4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Photo URL Input */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3 text-xs">
              <input
                type="text"
                value={newPhotoTitle}
                onChange={(e) => setNewPhotoTitle(e.target.value)}
                placeholder="Photo Title (e.g. South Boundary Peg #2)"
                className="w-full sm:w-1/3 px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="Image URL (e.g. https://...)"
                className="w-full sm:flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  if (newPhotoTitle && newPhotoUrl) {
                    setPhotos([...photos, { title: newPhotoTitle, url: newPhotoUrl, tag: 'Officer Camera' }]);
                    setNewPhotoTitle('');
                    setNewPhotoUrl('');
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shrink-0"
              >
                + Add Photo
              </button>
            </div>
          </div>

          {/* Section E: Official Findings & Submission Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCheck className="w-5 h-5 text-teal-600" />
              Officer Verification Finding & Conclusion
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Standard Officer Finding
                </label>
                <select
                  value={officerFinding}
                  onChange={(e) => setOfficerFinding(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-bold text-slate-800"
                >
                  <option value="Verified">Verified — Boundaries and Records Fully Consistent</option>
                  <option value="Verified with Remarks">Verified with Remarks — Minor Observations Noted</option>
                  <option value="Clarification Required">Clarification Required — Citizen Input Needed</option>
                  <option value="Further Inspection Required">Further Inspection Required — Joint Survey Needed</option>
                  <option value="Not Verified">Not Verified — Major Non-Compliance / Violation</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Statutory Determination
                </label>
                <select
                  value={verificationResult}
                  onChange={(e) => setVerificationResult(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 font-bold text-slate-800"
                >
                  <option value="VERIFIED_COMPLIANT">VERIFIED_COMPLIANT — Clear Title & Ground Possession</option>
                  <option value="DISCREPANCY_FOUND">DISCREPANCY_FOUND — Discrepancy with Revenue Record</option>
                  <option value="ENCROACHMENT_FLAGGED">ENCROACHMENT_FLAGGED — Encroachment on Public Land</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-xs mb-1.5">
                Officer Detailed Field Remarks
              </label>
              <textarea
                rows={3}
                value={officerRemarks}
                onChange={(e) => setOfficerRemarks(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs text-slate-800 leading-relaxed font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Logged Officer: <strong>{user?.fullName}</strong> ({user?.employeeCode})
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savingDraft ? 'Saving Draft...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReport}
                  disabled={submittingReport}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition inline-flex items-center gap-2 shadow-lg shadow-teal-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submittingReport ? 'Submitting Report...' : 'Submit Inspection Report'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. TAB 2: DOCUMENT VERIFICATION */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Statutory Document Scrutiny & Verification
              </h3>
              <p className="text-xs text-slate-500">
                Scrutinize citizen uploaded legal deeds, cadastral maps, and revenue tax certificates.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              {app.documents?.filter(d => d.verificationStatus === 'VERIFIED').length || 0} of {app.documents?.length || 0} Verified
            </span>
          </div>

          <div className="divide-y divide-slate-100 space-y-4">
            {app.documents?.map((doc) => {
              const isVerified = doc.verificationStatus === 'VERIFIED';
              const isClarification = doc.verificationStatus === 'REQUIRES_CLARIFICATION';

              return (
                <div key={doc.id} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{doc.documentType}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : isClarification
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {doc.verificationStatus || 'PENDING'}
                      </span>
                      {doc.aiDocumentClassification && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-mono border border-purple-200">
                          AI: {doc.aiDocumentClassification}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 flex items-center gap-3">
                      <span>File: <strong>{doc.documentName}</strong></span>
                      <span>•</span>
                      <span>Size: {doc.fileSize}</span>
                    </p>

                    {doc.officerRemark && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                        Officer Remark: {doc.officerRemark}
                      </p>
                    )}

                    {doc.verifiedBy && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Audited by: {doc.verifiedBy} on {new Date(doc.verifiedAt || doc.uploadedAt).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </a>

                    <button
                      onClick={() => handleOpenDocModal(doc)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Audit Document
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 3: LAND RECORD VS GROUND TRUTH COMPARISON */}
      {activeTab === 'landRecord' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Cadastral Record vs Ground Truth Cross-Verification
            </h3>
            <p className="text-xs text-slate-500">
              Comparative analysis between Citizen Application Data, Government Land Registry, and Field Officer Observations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Land Attribute</th>
                  <th className="px-4 py-3">Citizen Application</th>
                  <th className="px-4 py-3">Government Registry</th>
                  <th className="px-4 py-3">Field Truth On Site</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Survey & Sub-division No</td>
                  <td className="px-4 py-3.5 font-mono">{app.parcel?.surveyNumber}</td>
                  <td className="px-4 py-3.5 font-mono">{app.parcel?.surveyNumber}</td>
                  <td className="px-4 py-3.5 font-mono">{app.parcel?.surveyNumber}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">MATCH</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Total Land Extent</td>
                  <td className="px-4 py-3.5">{app.parcel?.areaAcre} Acres ({app.parcel?.areaSqFt} sq ft)</td>
                  <td className="px-4 py-3.5">{app.parcel?.areaAcre} Acres</td>
                  <td className="px-4 py-3.5">{app.parcel?.areaAcre} Acres (±0.2% DGPS tolerance)</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">MATCH</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Registered Owner / Title</td>
                  <td className="px-4 py-3.5">{app.citizenName}</td>
                  <td className="px-4 py-3.5">{app.parcel?.ownerName}</td>
                  <td className="px-4 py-3.5">Physical possession confirmed with neighbors</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">MATCH</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Land Classification & Use</td>
                  <td className="px-4 py-3.5">{app.parcel?.landUse}</td>
                  <td className="px-4 py-3.5">{app.parcel?.landType}</td>
                  <td className="px-4 py-3.5">{groundUse}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">MATCH</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Encumbrance / Mortgage</td>
                  <td className="px-4 py-3.5">Declared Clear</td>
                  <td className="px-4 py-3.5">{app.parcel?.encumbranceStatus}</td>
                  <td className="px-4 py-3.5">No bank attachment board on site</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">MATCH</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3.5 font-bold text-slate-900">Access Road Frontage</td>
                  <td className="px-4 py-3.5">30 ft Public Road</td>
                  <td className="px-4 py-3.5">Survey metal road corridor</td>
                  <td className="px-4 py-3.5">{roadAccessWidth}m ({roadType})</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">MATCH</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 4: CITIZEN & APPLICATION PROFILE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-teal-600" />
              Citizen Applicant Profile
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Applicant Full Name:</span>
                <span className="font-bold text-slate-900">{app.citizenName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Registered Mobile:</span>
                <span className="font-mono font-bold text-slate-900">{app.citizenMobile}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-mono text-slate-800">{app.citizenEmail}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Aadhaar Verification:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">UIDAI eKYC Verified</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Submission Date:</span>
                <span className="text-slate-800 font-medium">
                  {new Date(app.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {app.citizenRemarks && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <span className="font-bold text-slate-700">Citizen Remarks:</span>
                <p className="text-slate-600 leading-relaxed">{app.citizenRemarks}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-5 h-5 text-teal-600" />
              Cadastral Parcel Particulars
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">ULPIN (14-digit):</span>
                <span className="font-mono font-bold text-teal-700">{app.parcel?.ulpin}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Survey & Sub-division:</span>
                <span className="font-bold text-slate-900">{app.parcel?.surveyNumber} / {app.parcel?.subDivisionNumber || '1'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Revenue Village & Taluk:</span>
                <span className="text-slate-800 font-medium">{app.parcel?.village}, {app.parcel?.taluk}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">District:</span>
                <span className="text-slate-800 font-medium">{app.parcel?.district}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Cadastral Center:</span>
                <span className="font-mono text-slate-700">{app.parcel?.latitude?.toFixed(4)}, {app.parcel?.longitude?.toFixed(4)}</span>
              </div>
            </div>

            {app.supervisorRemarks && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1 text-xs">
                <span className="font-bold text-blue-900">Supervisor Instructions:</span>
                <p className="text-blue-800 leading-relaxed">{app.supervisorRemarks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB 5: INTERACTIVE GIS CADASTRAL MAP */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                {deptConfig.shortName} Spatial GIS & Cadastral Layer
              </h3>
              <p className="text-xs text-slate-500">
                Georeferenced spatial analysis for ULPIN: <span className="font-mono font-semibold">{app.parcel?.ulpin}</span>
              </p>
            </div>

            <Link
              to={`/map?search=${encodeURIComponent(app.parcel?.ulpin || '')}`}
              target="_blank"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
            >
              Open Fullscreen GIS Viewer
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>

          <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 flex items-center justify-center">
            {/* Embedded map simulation or Leaflet canvas container */}
            <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>

            <div className="relative z-10 text-center space-y-2 p-6 max-w-md bg-slate-950/80 rounded-2xl border border-teal-500/40 backdrop-blur-md text-white">
              <Compass className="w-10 h-10 text-teal-400 mx-auto animate-pulse" />
              <p className="font-bold text-sm">Georeferenced Parcel Boundary Map</p>
              <p className="text-xs text-slate-300 font-mono">
                ULPIN: {app.parcel?.ulpin} • Survey: {app.parcel?.surveyNumber}
              </p>
              <p className="text-[11px] text-teal-300 font-mono">
                Coordinates: {app.parcel?.latitude?.toFixed(5)}°N, {app.parcel?.longitude?.toFixed(5)}°E
              </p>
              <div className="pt-2">
                <Link
                  to={`/map?search=${encodeURIComponent(app.parcel?.ulpin || '')}`}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold inline-block shadow-lg shadow-teal-900/40"
                >
                  Launch Interactive Multi-Layer GIS
                </Link>
              </div>
            </div>
          </div>

          {/* Department Authorized GIS Layers & Availability */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Department Authorized Spatial Layers ({deptConfig.shortName})
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {deptConfig.gisLayers?.filter(l => l.available).length || 0} active • {deptConfig.gisLayers?.filter(l => !l.available).length || 0} unavailable
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deptConfig.gisLayers?.map(layer => (
                <div
                  key={layer.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs transition ${
                    layer.available
                      ? 'bg-slate-50/80 border-slate-200 hover:border-teal-300'
                      : 'bg-slate-100/60 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${layer.available ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {layer.label}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Layer ID: {layer.id}
                    </p>
                    {!layer.available && (
                      <p className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200">
                        {layer.fallbackText || 'GIS data unavailable for this layer in this jurisdiction'}
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      layer.available
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {layer.available ? 'Active & Queryable' : 'GIS Data Unavailable'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Department GIS Specific Governance & Resurvey Actions */}
          {deptConfig.isCadastralSurvey ? (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Cadastral Demarcation Authority Operations
                </div>
                <span className="text-[10px] bg-teal-200/60 text-teal-800 font-mono px-2 py-0.5 rounded-md font-bold">
                  EXCLUSIVE TO LAND & SURVEY
                </span>
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">
                As the statutory Cadastral Demarcation Authority, your field survey measurements supersede registry centroid estimates.
                If ground coordinates or physical peg stones deviate beyond the permissible 0.1m tolerance against the official FMB map,
                trigger an official Cadastral Re-Survey.
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationResult('REQUIRES_RESURVEY');
                    setBoundaryMatchesRecord(false);
                    setOfficerRemarks(prev =>
                      (prev ? prev + '\n' : '') +
                      `[OFFICIAL CADASTRAL RE-SURVEY RECOMMENDED]: Boundary variance detected against FMB record for ULPIN ${app.parcel?.ulpin || ''}. Sub-division demarcation requires statutory re-survey under Tamil Nadu Survey & Boundaries Act.`
                    );
                    alert('Case flagged for Statutory Cadastral Re-Survey. Verification status updated.');
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Flag for Official Cadastral Re-Survey
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Non-Cadastral Department:</strong> Cadastral stone pegging and official FMB demarcation adjustments are legally reserved for the Land & Survey Department.
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 px-2 py-1 rounded">
                Read-Only Cadastral Context
              </span>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 6: PRINTABLE OFFICIAL VERIFICATION REPORT */}
      {activeTab === 'report' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-12 space-y-8 text-slate-900 printable-dossier">
          {/* Official Letterhead */}
          <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Government of Tamil Nadu • {deptConfig.name}
            </p>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
              Statutory {deptConfig.shortName} Verification & Ground Truth Dossier
            </h2>
            <p className="text-xs font-mono text-slate-600">
              Inspection Ref: {app.fieldVerification?.inspectionNumber || 'INSP-2026-00412'} • Application: {app.applicationNumber}
            </p>
          </div>

          {/* Section 1: Summary Table */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Cadastral Parcel Particulars</p>
              <p><strong>ULPIN:</strong> <span className="font-mono">{app.parcel?.ulpin}</span></p>
              <p><strong>Survey Number:</strong> {app.parcel?.surveyNumber}</p>
              <p><strong>Village & Taluk:</strong> {app.parcel?.village}, {app.parcel?.taluk}</p>
              <p><strong>District:</strong> {app.parcel?.district}</p>
              <p><strong>Registered Extent:</strong> {app.parcel?.areaAcre} Acres</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <p className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Verification Particulars</p>
              <p><strong>Department:</strong> {deptConfig.name}</p>
              <p><strong>Inspecting Officer:</strong> {user?.fullName || 'Verification Officer'}</p>
              <p><strong>Employee Code:</strong> {user?.employeeCode || 'DEPT-OFF-001'}</p>
              <p><strong>Designation:</strong> {user?.designation || deptConfig.badgeText}</p>
              <p><strong>Inspection Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
              <p><strong>Service:</strong> {app.service?.serviceName}</p>
            </div>
          </div>

          {/* Section 2: Findings */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              Field Officer Findings & Ground Truth Assessment
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <p><strong>GPS Latitude:</strong> <span className="font-mono">{gpsLat || app.parcel?.latitude}</span></p>
              <p><strong>GPS Longitude:</strong> <span className="font-mono">{gpsLng || app.parcel?.longitude}</span></p>
              <p><strong>Boundary Stones:</strong> {boundaryStonesStatus}</p>
              <p><strong>Encroachment Detected:</strong> {encroachmentDetected ? 'YES - Encroachment Noted' : 'NO - Undisputed Clear Bounds'}</p>
              <p><strong>Statutory Finding:</strong> <span className="font-bold text-teal-800">{officerFinding}</span></p>
              <p><strong>Verification Determination:</strong> <span className="font-mono font-bold">{verificationResult}</span></p>
            </div>

            <div className="pt-2">
              <p className="font-bold text-slate-800">Officer Remarks:</p>
              <p className="text-slate-700 leading-relaxed mt-1 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                "{officerRemarks}"
              </p>
            </div>
          </div>

          {/* Official Signatures Block */}
          <div className="pt-12 border-t border-slate-300 flex justify-between items-end text-xs">
            <div className="text-center space-y-1">
              <div className="w-36 border-b border-slate-400 mx-auto pb-8"></div>
              <p className="font-bold text-slate-800">Citizen / Representative</p>
              <p className="text-[10px] text-slate-500">Acknowledged in presence</p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-48 border-b border-slate-900 mx-auto pb-8 font-serif italic text-teal-800 font-bold">
                {user?.fullName || 'Verification Officer'}
              </div>
              <p className="font-bold text-slate-900">{user?.fullName || 'Verification Officer'}</p>
              <p className="text-[10px] text-slate-500">{user?.designation || deptConfig.badgeText} • {user?.employeeCode || 'DEPT-OFF-001'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DOCUMENT AUDIT MODAL */}
      {docVerifyingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-300" />
                Audit Statutory Document
              </h3>
              <button onClick={() => setDocVerifyingId(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Verification Determination
                </label>
                <select
                  value={docStatus}
                  onChange={(e) => setDocStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 font-bold text-slate-800"
                >
                  <option value="VERIFIED">VERIFIED — Genuine & Matches Registry</option>
                  <option value="REQUIRES_CLARIFICATION">REQUIRES_CLARIFICATION — Discrepancy / Legibility Issue</option>
                  <option value="NOT_VERIFIED">NOT_VERIFIED — Invalid / Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Officer Scrutiny Remark
                </label>
                <textarea
                  rows={3}
                  value={docRemark}
                  onChange={(e) => setDocRemark(e.target.value)}
                  placeholder="State reason for verification status or clarification needed..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setDocVerifyingId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDocVerification}
                  disabled={savingDoc}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20"
                >
                  {savingDoc ? 'Saving...' : 'Save Verification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST CLARIFICATION MODAL */}
      {showClarificationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-rose-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-300" />
                Request Clarification from Citizen
              </h3>
              <button onClick={() => setShowClarificationModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestClarification} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clarification Category
                </label>
                <select
                  value={clarificationCategory}
                  onChange={(e) => setClarificationCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 font-bold"
                >
                  <option value="DOCUMENT_DEFICIENCY">Document Deficiency / Incomplete Evidence</option>
                  <option value="BOUNDARY_DISCREPANCY">Boundary Discrepancy on Ground</option>
                  <option value="LAND_USE_CLARIFICATION">Land Use / Master Plan Alignment</option>
                  <option value="OWNERSHIP_EVIDENCE">Succession / Ownership Evidence</option>
                  <option value="OTHER">Other Ground Truth Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specific Clarification Notice to Citizen
                </label>
                <textarea
                  rows={3}
                  required
                  value={clarificationMessage}
                  onChange={(e) => setClarificationMessage(e.target.value)}
                  placeholder="Specify the document or ground evidence the citizen needs to provide..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Required Document Upload (Optional)
                </label>
                <input
                  type="text"
                  value={clarificationDoc}
                  onChange={(e) => setClarificationDoc(e.target.value)}
                  placeholder="e.g. NABL Soil Lab Report, Revised Survey FMB Sketch"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Response Due Date
                </label>
                <input
                  type="date"
                  value={clarificationDueDate}
                  onChange={(e) => setClarificationDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                This action sets the application status to <strong>CLARIFICATION_REQUIRED</strong> and automatically dispatches a notification to <strong>{app.citizenName}</strong>.
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowClarificationModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingClarification}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-600/20"
                >
                  {requestingClarification ? 'Dispatching...' : 'Dispatch Clarification Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FORWARD TO APPROVING AUTHORITY MODAL */}
      {showForwardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-teal-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-teal-300" />
                Forward to Approving Authority
              </h3>
              <button onClick={() => setShowForwardModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleForwardToAuthority} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-[11px] leading-relaxed">
                <strong>Statutory Governance Separation:</strong> As Field Verification Officer, you conduct on-site ground truth verification and prepare findings. Final statutory approval or rejection is reserved exclusively for the Approving Authority / Supervisor.
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Inspection Finding Forwarded
                </label>
                <input
                  type="text"
                  readOnly
                  value={officerFinding}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Forwarding Endorsement Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  value={forwardRemarks}
                  onChange={(e) => setForwardRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForwardModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forwarding}
                  className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-md shadow-teal-700/20"
                >
                  {forwarding ? 'Forwarding...' : 'Confirm & Forward Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SCHEDULE INSPECTION MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-indigo-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-300" />
                Schedule Field Inspection
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleInspection} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Inspection Type
                </label>
                <input
                  type="text"
                  required
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Officer Notes & Instructions for Inspection
                </label>
                <textarea
                  rows={3}
                  value={scheduleRemarks}
                  onChange={(e) => setScheduleRemarks(e.target.value)}
                  placeholder="Notes for citizen or field surveyor..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-[11px]">
                Scheduling this inspection updates the application status to <strong>INSPECTION_SCHEDULED</strong> and notifies the citizen.
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-6 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-md shadow-indigo-700/20"
                >
                  {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FieldOfficerApplicationDetail;
