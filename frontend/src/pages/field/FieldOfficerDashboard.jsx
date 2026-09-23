import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckSquare, Clock, MapPin, Camera, CheckCircle2,
  AlertTriangle, Navigation, Upload, X, ShieldCheck,
  FileCheck, ArrowRight, Eye, Search, Filter, LayoutDashboard,
  Wifi, WifiOff, RefreshCw, Calendar, AlertCircle, FileText,
  UserCheck, Send, CheckCircle, ChevronRight, Layers, SlidersHorizontal,
  Download, Compass, Sparkles, Building, Info, FileSpreadsheet, RotateCcw,
  Award, AlertOctagon, History, UserCircle, Flag, Map as MapIcon, Check,
  Edit3, ClipboardList, BarChart3, Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getDepartmentConfig } from '../../utils/departmentOfficerConfig';

const DEPARTMENT_OFFICERS = [
  { name: 'Revenue', code: 'REV', email: 'officer@landstack.demo', roleName: 'Revenue Inspector' },
  { name: 'Survey & Records', code: 'SRV-LR', email: 'officer.survey@landstack.demo', roleName: 'Survey Officer' },
  { name: 'Registration', code: 'REG', email: 'officer.registration@landstack.demo', roleName: 'Sub-Registrar' },
  { name: 'Town Planning', code: 'TCP', email: 'officer.townplanning@landstack.demo', roleName: 'Town Planning Inspector' },
  { name: 'Local Body', code: 'LBD', email: 'officer.localbody@landstack.demo', roleName: 'Municipal Officer' },
  { name: 'Building / PWD', code: 'BLD', email: 'officer.building@landstack.demo', roleName: 'AE / Building Inspector' },
  { name: 'Highways', code: 'HWY', email: 'officer.highways@landstack.demo', roleName: 'Highways Engineer' },
  { name: 'Forest', code: 'FRT', email: 'officer.forest@landstack.demo', roleName: 'Forest Range Officer' },
  { name: 'Electricity', code: 'ELE', email: 'officer.electricity@landstack.demo', roleName: 'TANGEDCO Engineer' },
  { name: 'Water / TWAD', code: 'WTR', email: 'officer.water@landstack.demo', roleName: 'Water Board Engineer' },
  { name: 'Environment', code: 'ENV', email: 'officer.environment@landstack.demo', roleName: 'Pollution Control Inspector' },
];

export const FieldOfficerDashboard = () => {
  const { user, loginStaff } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOnline } = useOnlineStatus();
  const [switchingOfficer, setSwitchingOfficer] = useState(false);

  // Active Tab from URL query parameter (Section 9 Officer Sidebar):
  // 'overview' | 'services' | 'applications' | 'field-ops' | 'parcels' |
  // 'documents' | 'reports' | 'escalations' | 'audit-history'
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Retrieve dynamic department configuration
  const deptConfig = useMemo(() => {
    return getDepartmentConfig(user?.departmentName || user?.department?.name);
  }, [user]);

  // Core State
  const [stats, setStats] = useState(null);
  const [assignedApps, setAssignedApps] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Queue & Filter State for Applications
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQueueTab, setActiveQueueTab] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [ulpinSearch, setUlpinSearch] = useState('');
  const [surveySearch, setSurveySearch] = useState('');

  // Schedule Inspection Modal
  const [scheduleModalApp, setScheduleModalApp] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleType, setScheduleType] = useState(deptConfig.fieldInspectionLabel || 'On-site Inspection');
  const [scheduleRemarks, setScheduleRemarks] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Field Operations State (Section 34 & 37)
  const [activeFieldApp, setActiveFieldApp] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [boundaryStatus, setBoundaryStatus] = useState('All 4 permanent survey boundary stones verified intact');
  const [observedArea, setObservedArea] = useState('');
  const [encroachmentDetected, setEncroachmentDetected] = useState(false);
  const [officerFinding, setOfficerFinding] = useState('Verified');
  const [fieldObservations, setFieldObservations] = useState('');
  const [photoEvidence, setPhotoEvidence] = useState([
    { title: 'Site Frontage & Boundary Peg #1', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', tag: 'DGPS Peg' },
    { title: 'Access Road Alignment', url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800', tag: '30ft Roadway' }
  ]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Document Verification State (Section 32)
  const [docReviewModal, setDocReviewModal] = useState(null);
  const [docVerificationStatus, setDocVerificationStatus] = useState('VERIFIED');
  const [docOfficerRemark, setDocOfficerRemark] = useState('');
  const [verifyingDoc, setVerifyingDoc] = useState(false);

  // Escalation Modal State (Section 38)
  const [escalateModalApp, setEscalateModalApp] = useState(null);
  const [escalateIssueType, setEscalateIssueType] = useState('BOUNDARY_DISPUTE');
  const [escalatePriority, setEscalatePriority] = useState('HIGH');
  const [escalateDescription, setEscalateDescription] = useState('');
  const [escalating, setEscalating] = useState(false);

  const handleSwitchOfficer = async (officerEmail) => {
    if (user?.email === officerEmail) return;
    setSwitchingOfficer(true);
    try {
      await loginStaff(officerEmail, 'Demo@123');
      // Auth context updates user asynchronously, triggering the useEffect
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to switch officer');
    } finally {
      setSwitchingOfficer(false);
    }
  };

  useEffect(() => {
    loadFieldData();
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (activeTab === 'audit-history') {
      loadOfficerAuditLogs();
    }
  }, [activeTab]);

  const loadFieldData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes] = await Promise.all([
        api.get('/api/field/stats').catch(() => ({ data: null })),
        api.get('/api/field/assignments').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setAssignedApps(appsRes.data || []);
      if (appsRes.data && appsRes.data.length > 0 && !activeFieldApp) {
        setActiveFieldApp(appsRes.data[0]);
        setObservedArea(appsRes.data[0].parcel?.areaAcre?.toString() || '0.45');
      }
    } catch (err) {
      console.error('Failed to load officer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOfficerAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get('/api/field/audit-logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load officer audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, appsRes] = await Promise.all([
        api.get('/api/field/stats'),
        api.get('/api/field/assignments')
      ]);
      setStats(statsRes.data);
      setAssignedApps(appsRes.data || []);
      if (activeTab === 'audit-history') {
        await loadOfficerAuditLogs();
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Real GPS Capture via Browser Geolocation API (Section 34)
  const handleCaptureRealGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser/device.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date(pos.timestamp).toISOString()
        });
        setGpsLoading(false);
      },
      (err) => {
        // Fallback to real parcel location with high precision simulation if permissions blocked on local dev
        const parcelLat = activeFieldApp?.parcel?.latitude || 12.9249;
        const parcelLng = activeFieldApp?.parcel?.longitude || 80.1481;
        setGpsData({
          latitude: parcelLat,
          longitude: parcelLng,
          accuracy: 2.4,
          timestamp: new Date().toISOString()
        });
        setGpsError(`Device GPS notice: ${err.message}. Loaded calibrated parcel DGPS coordinates.`);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Save Draft (Section 37)
  const handleSaveDraft = async () => {
    if (!activeFieldApp) return;
    setSavingDraft(true);
    try {
      await api.post('/api/field/inspection/save-draft', {
        applicationId: activeFieldApp.id,
        gpsLatitude: gpsData?.latitude || activeFieldApp.parcel?.latitude || 12.9249,
        gpsLongitude: gpsData?.longitude || activeFieldApp.parcel?.longitude || 80.1481,
        gpsAccuracy: gpsData?.accuracy || 2.4,
        boundaryMatchesRecord: boundaryStatus.toLowerCase().includes('intact'),
        encroachmentDetected: encroachmentDetected,
        remarks: fieldObservations || 'Ground inspection draft recorded.',
        officerFinding: officerFinding,
        verificationResult: officerFinding === 'Verified' ? 'VERIFIED_COMPLIANT' : 'CLARIFICATION_REQUIRED',
        photoUrls: photoEvidence.map(p => p.url)
      });
      alert('Inspection draft successfully saved! You can resume field verification anytime.');
      await refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit Inspection Report to Supervisor (Section 35 & 57)
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!activeFieldApp) return;
    setSubmittingReport(true);
    try {
      await api.post('/api/field/inspection/submit-report', {
        applicationId: activeFieldApp.id,
        gpsLatitude: gpsData?.latitude || activeFieldApp.parcel?.latitude || 12.9249,
        gpsLongitude: gpsData?.longitude || activeFieldApp.parcel?.longitude || 80.1481,
        gpsAccuracy: gpsData?.accuracy || 2.4,
        boundaryMatchesRecord: boundaryStatus.toLowerCase().includes('intact'),
        encroachmentDetected: encroachmentDetected,
        remarks: fieldObservations || `Physical ground verification conducted by Officer ${user?.fullName}. Boundaries demarcated and findings recorded.`,
        officerFinding: officerFinding,
        verificationResult: officerFinding === 'Verified' ? 'VERIFIED_COMPLIANT' : 'FURTHER_VERIFICATION_REQUIRED',
        photoUrls: photoEvidence.map(p => p.url)
      });
      alert(`Certified Inspection Report for Application ${activeFieldApp.applicationNumber} submitted to Supervisor! Status transitioned to SUBMITTED_FOR_SUPERVISOR_REVIEW.`);
      await refreshData();
      setActiveTab('applications');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Document Verification Submit (Section 32)
  const handleVerifyDocument = async (e) => {
    e.preventDefault();
    if (!docReviewModal) return;
    setVerifyingDoc(true);
    try {
      await api.post('/api/field/document/verify', {
        documentId: docReviewModal.id,
        verificationStatus: docVerificationStatus,
        officerRemark: docOfficerRemark
      });
      setDocReviewModal(null);
      await refreshData();
      alert('Document scrutiny audit recorded successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to audit document');
    } finally {
      setVerifyingDoc(false);
    }
  };

  // Schedule Inspection (Section 30)
  const handleOpenScheduleModal = (app) => {
    setScheduleModalApp(app);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 30, 0, 0);
    setScheduleDate(tomorrow.toISOString().slice(0, 16));
    setScheduleType(app.service?.serviceName || deptConfig.fieldInspectionLabel);
    setScheduleRemarks(`Scheduled on-site field verification for parcel ${app.parcel?.ulpin || 'N/A'} (Survey: ${app.parcel?.surveyNumber || '-'}).`);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleModalApp || !scheduleDate) return;
    setScheduling(true);
    try {
      await api.post('/api/field/inspection/schedule', {
        applicationId: scheduleModalApp.id,
        inspectionDate: scheduleDate,
        inspectionType: scheduleType,
        remarks: scheduleRemarks
      });
      setScheduleModalApp(null);
      await refreshData();
      alert('Field inspection scheduled successfully! Citizen and Supervisor notified.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule inspection');
    } finally {
      setScheduling(false);
    }
  };

  // Case Escalation Submit (Section 38)
  const handleEscalateCase = async (e) => {
    e.preventDefault();
    if (!escalateModalApp || !escalateDescription.trim()) return;
    setEscalating(true);
    try {
      await api.post('/api/field/inspection/clarification', {
        applicationId: escalateModalApp.id,
        category: escalateIssueType,
        message: escalateDescription
      });
      setEscalateModalApp(null);
      await refreshData();
      alert(`Case for application ${escalateModalApp.applicationNumber} escalated to Supervisor & recorded in audit history.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to escalate case');
    } finally {
      setEscalating(false);
    }
  };

  // Export CSV Helper
  const handleExportCSV = (reportName = 'Department_Applications_Log') => {
    const headers = ['Application Number', 'Citizen Name', 'Mobile', 'Service Code', 'Service Name', 'ULPIN', 'Survey No', 'Village', 'Status', 'SLA Remaining', 'Finding'];
    const rows = assignedApps.map(a => [
      a.applicationNumber,
      `"${a.citizenName || ''}"`,
      a.citizenMobile || '',
      a.service?.serviceCode || '',
      `"${a.service?.serviceName || ''}"`,
      a.parcel?.ulpin || '',
      a.parcel?.surveyNumber || '',
      `"${a.parcel?.village || ''}"`,
      a.status,
      a.daysRemaining ?? 12,
      `"${a.fieldVerification?.officerFinding || 'Pending'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${deptConfig.code}_${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered applications
  const filteredApps = useMemo(() => {
    return assignedApps.filter(app => {
      // 1. Queue tab filter
      if (activeQueueTab === 'DOC_VERIFICATION') {
        const isPendingDoc = app.status === 'DOCUMENT_VERIFICATION' || app.status === 'PENDING_DOCUMENTS' || app.status === 'SUBMITTED' ||
          app.documents?.some(d => d.verificationStatus === 'NOT_VERIFIED' || !d.verificationStatus);
        if (!isPendingDoc) return false;
      } else if (activeQueueTab === 'FIELD_INSPECTION') {
        if (app.status !== 'FIELD_VERIFICATION' && app.status !== 'DOCUMENT_VERIFICATION') return false;
      } else if (activeQueueTab === 'OVERDUE') {
        if (app.slaStatus !== 'BREACHED' && app.slaStatus !== 'SLA_BREACHED') return false;
      } else if (activeQueueTab === 'CLARIFICATION') {
        if (app.status !== 'CLARIFICATION_REQUIRED') return false;
      } else if (activeQueueTab === 'COMPLETED') {
        const isDone = ['INSPECTION_COMPLETED', 'REPORT_SUBMITTED', 'FORWARDED_TO_AUTHORITY', 'SUPERVISOR_REVIEW', 'VERIFIED', 'APPROVED', 'COMPLETED'].includes(app.status);
        if (!isDone) return false;
      }

      // 2. Service filter
      if (serviceFilter !== 'ALL' && app.service?.serviceCode !== serviceFilter) {
        return false;
      }

      // 3. Cadastral search
      if (ulpinSearch.trim() && !app.parcel?.ulpin?.toLowerCase().includes(ulpinSearch.trim().toLowerCase())) {
        return false;
      }
      if (surveySearch.trim() && !app.parcel?.surveyNumber?.toLowerCase().includes(surveySearch.trim().toLowerCase())) {
        return false;
      }

      // 4. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchApp = app.applicationNumber?.toLowerCase().includes(q);
        const matchName = app.citizenName?.toLowerCase().includes(q);
        const matchUlpin = app.parcel?.ulpin?.toLowerCase().includes(q);
        const matchVillage = app.parcel?.village?.toLowerCase().includes(q);
        const matchSurvey = app.parcel?.surveyNumber?.toLowerCase().includes(q);
        const matchService = app.service?.serviceName?.toLowerCase().includes(q);
        return matchApp || matchName || matchUlpin || matchVillage || matchSurvey || matchService;
      }

      return true;
    });
  }, [assignedApps, activeQueueTab, serviceFilter, searchQuery, ulpinSearch, surveySearch]);

  // Extract unique Land Parcels for Section 9 tab
  const assignedParcels = useMemo(() => {
    const list = [];
    assignedApps.forEach(a => {
      if (a.parcel && a.parcel.id) {
        list.push({
          ...a.parcel,
          applicationId: a.id,
          applicationNumber: a.applicationNumber,
          status: a.status,
          serviceName: a.service?.serviceName
        });
      }
    });
    return list;
  }, [assignedApps]);

  // Extract all documents across assigned applications
  const assignedDocuments = useMemo(() => {
    const docs = [];
    assignedApps.forEach(a => {
      (a.documents || []).forEach(d => {
        docs.push({
          ...d,
          applicationId: a.id,
          applicationNumber: a.applicationNumber,
          citizenName: a.citizenName,
          serviceName: a.service?.serviceName
        });
      });
    });
    return docs;
  }, [assignedApps]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* ======================================================== */}
      {/* 0. 1-CLICK DEPARTMENT OFFICER SWITCHER (11 Statutory Departments) */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
            </span>
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-teal-600" />
              1-Click Department Officer Switcher (All 11 Statutory Departments)
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <span>Viewing as:</span>
            <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
              {user?.departmentName || deptConfig.name} ({user?.fullName || 'Officer'})
            </span>
            {switchingOfficer && (
              <span className="inline-flex items-center gap-1 text-teal-600 text-xs font-semibold animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Switching...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
          {DEPARTMENT_OFFICERS.map((dept) => {
            const isCurrent = user?.email === dept.email || 
              (user?.departmentName && dept.name.toLowerCase().includes(user.departmentName.toLowerCase())) ||
              (user?.departmentName && user.departmentName.toLowerCase().includes(dept.name.toLowerCase()));

            return (
              <button
                key={dept.email}
                onClick={() => handleSwitchOfficer(dept.email)}
                disabled={switchingOfficer || isCurrent}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 text-xs ${
                  isCurrent
                    ? 'bg-teal-700 text-white font-bold shadow-sm ring-2 ring-teal-500/50'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
                title={`Switch to ${dept.name} (${dept.roleName} - ${dept.email})`}
              >
                {isCurrent && <Check className="w-3.5 h-3.5 text-teal-200" />}
                <span>{dept.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isCurrent ? 'bg-teal-800 text-teal-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {dept.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. HEADER: LANDSTACK OFFICER PORTAL (Section 7 Exact Spec) */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-teal-900/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                LandStack Officer Portal
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
                Officer ID: {user?.employeeCode || ('OFF-' + (user?.id || '101'))}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                {user?.fullName || 'Verification Officer'}
              </h1>
              <p className="text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-teal-200">{user?.designation || 'Verification Inspector'}</span>
                <span className="text-slate-500">•</span>
                <span className="text-white font-semibold">{user?.departmentName || deptConfig.name}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  Assigned Jurisdiction: {user?.jurisdiction || 'Tambaram Division, Chennai'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 border border-white/20"
              title="Refresh live assignments from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to="/map"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-lg shadow-teal-900/30"
            >
              <Compass className="w-4 h-4" />
              Cadastral Map
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OFFICER SUMMARY: 6 EXACT REAL METRICS (Section 8 Spec) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Metric 1: Today's Tasks */}
        <button
          onClick={() => { setActiveTab('applications'); setActiveQueueTab('TODAY'); }}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'applications' && activeQueueTab === 'TODAY'
              ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Today's Tasks</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black font-mono">{stats?.todaysTasks ?? stats?.todayVisitsCount ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Scheduled for Today</p>
        </button>

        {/* Metric 2: Pending Tasks */}
        <button
          onClick={() => { setActiveTab('applications'); setActiveQueueTab('ALL'); }}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'applications' && activeQueueTab === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Pending Tasks</span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black font-mono">{stats?.pendingTasks ?? assignedApps.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting Completion</p>
        </button>

        {/* Metric 3: Completed Tasks */}
        <button
          onClick={() => { setActiveTab('applications'); setActiveQueueTab('COMPLETED'); }}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'applications' && activeQueueTab === 'COMPLETED'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Completed Tasks</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600">{stats?.completedTasks ?? stats?.completedApplicationsCount ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Verified / Submitted</p>
        </button>

        {/* Metric 4: Overdue Tasks */}
        <button
          onClick={() => { setActiveTab('applications'); setActiveQueueTab('OVERDUE'); }}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'applications' && activeQueueTab === 'OVERDUE'
              ? 'bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Overdue Tasks</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-600">{stats?.overdueTasks ?? stats?.overdueInspectionsCount ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">SLA Deadline Passed</p>
        </button>

        {/* Metric 5: Pending Verification */}
        <button
          onClick={() => { setActiveTab('applications'); setActiveQueueTab('FIELD_INSPECTION'); }}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'applications' && activeQueueTab === 'FIELD_INSPECTION'
              ? 'bg-amber-700 text-white border-amber-700 shadow-md ring-2 ring-amber-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Verif.</span>
            <FileCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black font-mono text-amber-600">{stats?.pendingVerification ?? stats?.fieldInspectionsRequiredCount ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">On-Site / Desk Audit</p>
        </button>

        {/* Metric 6: Escalated Cases */}
        <button
          onClick={() => setActiveTab('escalations')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'escalations'
              ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow-md ring-2 ring-fuchsia-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-fuchsia-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-700">Escalated Cases</span>
            <AlertOctagon className="w-4 h-4 text-fuchsia-700" />
          </div>
          <p className="text-2xl font-black font-mono text-fuchsia-700">{stats?.escalatedCases ?? 0}</p>
          <p className="text-[10px] text-slate-400 mt-1">Under Supervisory Review</p>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 3. SECTION 9 SUB-VIEW NAVIGATION TABS                    */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard Overview
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'applications'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Assigned Applications ({assignedApps.length})
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'services'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          My Services
        </button>

        {deptConfig.canPerformFieldOps && (
          <button
            onClick={() => setActiveTab('field-ops')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'field-ops'
                ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            Field Operations (GPS & Inspection)
          </button>
        )}

        <button
          onClick={() => setActiveTab('parcels')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'parcels'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Land Parcels ({assignedParcels.length})
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Documents ({assignedDocuments.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Reports
        </button>

        <button
          onClick={() => setActiveTab('escalations')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'escalations'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          Escalations ({stats?.escalatedCases ?? 0})
        </button>

        <button
          onClick={() => setActiveTab('audit-history')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'audit-history'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Activity / Audit History
        </button>
      </div>

      {/* ========================================================= */}
      {/* VIEW A: ASSIGNED APPLICATIONS & QUEUES                    */}
      {/* ========================================================= */}
      {(activeTab === 'overview' || activeTab === 'applications') && (
        <div className="space-y-4">
          {/* CADASTRAL EXCLUSIVE SEARCH PANEL (For Land & Survey Only) */}
          {deptConfig.isCadastralSurvey && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-teal-900 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-teal-700" />
                  Cadastral Ground Search & Demarcation Lookup
                </span>
                <span className="text-[10px] font-bold text-teal-700 uppercase bg-teal-100 px-2 py-0.5 rounded">
                  Land & Survey Exclusive
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-teal-800 mb-1">Search by ULPIN</label>
                  <input
                    type="text"
                    value={ulpinSearch}
                    onChange={(e) => setUlpinSearch(e.target.value)}
                    placeholder="Enter 14-digit ULPIN..."
                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-teal-800 mb-1">Search by Survey Number</label>
                  <input
                    type="text"
                    value={surveySearch}
                    onChange={(e) => setSurveySearch(e.target.value)}
                    placeholder="e.g. 124/2A..."
                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Queue Tab Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {deptConfig.queueTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveQueueTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition whitespace-nowrap ${
                  activeQueueTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search, Filter Toolbar & Export */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Application No, Citizen, ULPIN, or Village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleExportCSV('Worklist')}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                title="Export Filtered Queue to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Loading department applications...
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 space-y-2">
                <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No applications match your active filters.</p>
                <p className="text-[11px] text-slate-400">Applications assigned to your department will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Application ID</th>
                      <th className="px-4 py-3">Citizen</th>
                      <th className="px-4 py-3">Authorized Service</th>
                      <th className="px-4 py-3">Parcel Reference</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Inspection / Visit</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          {app.applicationNumber}
                          <p className="text-[10px] text-slate-400 font-normal">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{app.citizenName || 'Applicant'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{app.citizenMobile || '-'}</p>
                        </td>

                        <td className="px-4 py-3.5 max-w-[200px]">
                          <p className="font-semibold text-slate-900 truncate" title={app.service?.serviceName}>
                            {app.service?.serviceName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{app.service?.serviceCode}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          {app.parcel?.ulpin ? (
                            <Link
                              to={`/map?search=${encodeURIComponent(app.parcel.ulpin)}`}
                              className="font-mono text-teal-700 hover:underline flex items-center gap-1 font-semibold"
                              title="Inspect on Cadastral Map"
                            >
                              <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                              {app.parcel.ulpin}
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">No ULPIN</span>
                          )}
                          <p className="text-[10px] text-slate-500">
                            Sy #{app.parcel?.surveyNumber || '-'} • {app.parcel?.village || 'Tambaram'}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge status={app.status} />
                        </td>

                        <td className="px-4 py-3.5">
                          {app.fieldVerification?.scheduledDate ? (
                            <div>
                              <div className="flex items-center gap-1 text-slate-900 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                <span>{new Date(app.fieldVerification.scheduledDate).toLocaleDateString()}</span>
                              </div>
                              <span className="text-[10px] text-teal-700 font-mono">
                                {new Date(app.fieldVerification.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ) : deptConfig.canPerformFieldOps ? (
                            <button
                              onClick={() => handleOpenScheduleModal(app)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[10px] border border-teal-200 transition"
                            >
                              Schedule Visit
                            </button>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Desk Audit</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          {deptConfig.canPerformFieldOps && (
                            <button
                              onClick={() => {
                                setActiveFieldApp(app);
                                setObservedArea(app.parcel?.areaAcre?.toString() || '0.45');
                                setActiveTab('field-ops');
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold transition text-xs"
                              title="Perform field survey / GPS inspection"
                            >
                              Field Ops
                            </button>
                          )}
                          <Link
                            to={`/officer/application/${app.id}`}
                            className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold transition inline-flex items-center gap-1 shadow-sm"
                          >
                            Open Dossier
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW B: MY SERVICES (Section 14 & 16 Master Spec)         */}
      {/* ========================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3">
            <Award className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-teal-900">
                Department Authorized Service Catalog: {deptConfig.name}
              </h3>
              <p className="text-xs text-teal-700 mt-0.5">
                Officers only see services authorized for their specific department. Each service provides its tailored statutory SLA and verification workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deptConfig.reportTypes.map((service, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[10px] font-bold">
                    {deptConfig.code}-SVC-0{idx + 1}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">SLA: 15 Days</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{service.name}</h4>
                <p className="text-xs text-slate-500">{service.description}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Inspection: <strong>{deptConfig.canPerformFieldOps ? 'Required' : 'Desk Review'}</strong></span>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    View Queue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW C: FIELD OPERATIONS (Section 34, 35, 37 Master Spec) */}
      {/* ========================================================= */}
      {activeTab === 'field-ops' && deptConfig.canPerformFieldOps && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase mb-1">
                <Compass className="w-3.5 h-3.5" />
                Cadastral Ground Operations Studio
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Field Inspection & Ground-Truth Demarcation: {activeFieldApp?.applicationNumber || 'Select Case'}
              </h2>
              <p className="text-xs text-slate-500">
                ULPIN: {activeFieldApp?.parcel?.ulpin || 'N/A'} • Survey Number: {activeFieldApp?.parcel?.surveyNumber || '-'} ({activeFieldApp?.parcel?.village || 'Tambaram'})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activeFieldApp?.id || ''}
                onChange={(e) => {
                  const target = assignedApps.find(a => a.id.toString() === e.target.value);
                  if (target) {
                    setActiveFieldApp(target);
                    setObservedArea(target.parcel?.areaAcre?.toString() || '0.45');
                  }
                }}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                {assignedApps.map(a => (
                  <option key={a.id} value={a.id.toString()}>
                    {a.applicationNumber} — {a.citizenName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-6">
            {/* Real GPS Capture Module */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-teal-600" />
                    Real-Time DGPS Coordinates Capture
                  </h4>
                  <p className="text-[11px] text-slate-500">High-precision geolocation capture via browser sensor.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureRealGps}
                  disabled={gpsLoading}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  {gpsLoading ? 'Acquiring Satellites...' : 'Capture GPS'}
                </button>
              </div>

              {gpsError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                  {gpsError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Latitude</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {gpsData?.latitude ? `${gpsData.latitude.toFixed(6)}°N` : 'Click Capture GPS'}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Longitude</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {gpsData?.longitude ? `${gpsData.longitude.toFixed(6)}°E` : 'Click Capture GPS'}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Precision Accuracy</span>
                  <span className="font-mono font-bold text-teal-700 text-sm">
                    {gpsData?.accuracy ? `±${gpsData.accuracy.toFixed(1)} meters` : 'Pending Sensor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Boundary Markers & Extent Verification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Permanent Survey Boundary Markers Status *
                </label>
                <input
                  type="text"
                  required
                  value={boundaryStatus}
                  onChange={(e) => setBoundaryStatus(e.target.value)}
                  placeholder="e.g. All 4 corner stones intact and verified..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Observed Physical Area (Acres) *
                </label>
                <input
                  type="text"
                  required
                  value={observedArea}
                  onChange={(e) => setObservedArea(e.target.value)}
                  placeholder="e.g. 0.45"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            {/* Encroachment & Finding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="encroachmentCheck"
                  checked={encroachmentDetected}
                  onChange={(e) => setEncroachmentDetected(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <label htmlFor="encroachmentCheck" className="cursor-pointer font-bold text-slate-800">
                  Encroachment Detected on Site / Adjoining Bounds
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Officer Statutory Finding (Section 35) *
                </label>
                <select
                  value={officerFinding}
                  onChange={(e) => setOfficerFinding(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Verified">Verified</option>
                  <option value="Verified with Remarks">Verified with Remarks</option>
                  <option value="Clarification Required">Clarification Required</option>
                  <option value="Further Verification Required">Further Verification Required</option>
                  <option value="Not Verified">Not Verified</option>
                </select>
              </div>
            </div>

            {/* Field Observation Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Field Inspection Observations & Measurements
              </label>
              <textarea
                rows={3}
                value={fieldObservations}
                onChange={(e) => setFieldObservations(e.target.value)}
                placeholder="Record ground boundary observations, road width measurements, and adjoining survey numbers..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* Action Buttons: Save Draft & Submit Report (Section 37 & 57) */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {savingDraft ? 'Saving Draft...' : 'Save Draft'}
              </button>

              <button
                type="submit"
                disabled={submittingReport}
                className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black transition shadow-lg shadow-teal-700/20 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingReport ? 'Submitting to Supervisor...' : 'Submit Report to Supervisor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW D: LAND PARCELS (Section 9 Spec)                     */}
      {/* ========================================================= */}
      {activeTab === 'parcels' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assigned Land Parcels Registry</h3>
              <p className="text-xs text-slate-500">Parcels linked to your active department service cases.</p>
            </div>
            <Link
              to="/map"
              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1"
            >
              <Compass className="w-3.5 h-3.5" />
              Full GIS Map
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ULPIN</th>
                  <th className="px-4 py-3">Survey & Sub-division</th>
                  <th className="px-4 py-3">Village & Taluk</th>
                  <th className="px-4 py-3">Extent (Acres)</th>
                  <th className="px-4 py-3">Linked Application</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {assignedParcels.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-teal-700">
                      {p.ulpin || 'PENDING-ULPIN'}
                    </td>
                    <td className="px-4 py-3 font-mono">Sy #{p.surveyNumber || '-'}</td>
                    <td className="px-4 py-3">{p.village || 'Tambaram'}, {p.taluk || 'Chengalpattu'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.areaAcre || '0.45'} ac</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-900">{p.applicationNumber}</span>
                      <p className="text-[10px] text-slate-400">{p.serviceName}</p>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/map?search=${encodeURIComponent(p.ulpin || p.surveyNumber || '')}`}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-lg inline-flex items-center gap-1 border border-teal-200"
                      >
                        <MapIcon className="w-3 h-3" />
                        GIS
                      </Link>
                      <Link
                        to={`/officer/application/${p.applicationId}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                      >
                        Dossier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW E: DOCUMENTS REVIEW (Section 32 Spec)                */}
      {/* ========================================================= */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Document Verification Queue</h3>
              <p className="text-xs text-slate-500">Deeds, Encumbrance Certificates, and citizen uploads requiring audit.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 space-y-3">
            {assignedDocuments.map((doc) => (
              <div key={doc.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{doc.documentType}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      doc.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.verificationStatus || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono text-[11px]">
                    App: {doc.applicationNumber} • Citizen: {doc.citizenName} • File: {doc.documentName}
                  </p>
                  {doc.officerRemark && (
                    <p className="text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                      Officer Remark: "{doc.officerRemark}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </a>
                  <button
                    onClick={() => {
                      setDocReviewModal(doc);
                      setDocVerificationStatus(doc.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'VERIFIED');
                      setDocOfficerRemark(doc.officerRemark || `Verified by Officer ${user?.fullName}`);
                    }}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold inline-flex items-center gap-1 shadow-sm"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW F: DEPARTMENT REPORTS (Section 41 Spec)              */}
      {/* ========================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-teal-900">
                Department Operational Reports: {deptConfig.name}
              </h3>
              <p className="text-xs text-teal-700 mt-0.5">
                Generate certified operational summaries and compliance extracts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deptConfig.reportTypes.map((rep) => (
              <div key={rep.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="p-2 w-fit rounded-xl bg-teal-50 text-teal-700 mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{rep.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{rep.description}</p>
                </div>

                <button
                  onClick={() => handleExportCSV(rep.id)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW G: ESCALATIONS (Section 38 Spec)                     */}
      {/* ========================================================= */}
      {activeTab === 'escalations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-fuchsia-700" />
                Department Case Escalations
              </h3>
              <p className="text-xs text-slate-500">Applications referred for supervisory intervention or higher authority resolution.</p>
            </div>
          </div>

          {assignedApps.filter(a => a.status === 'ESCALATED' || a.priority === 'URGENT').length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No active escalated cases in your department queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Application</th>
                    <th className="px-4 py-3">Citizen</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {assignedApps
                    .filter(a => a.status === 'ESCALATED' || a.priority === 'URGENT')
                    .map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{app.applicationNumber}</td>
                        <td className="px-4 py-3">{app.citizenName}</td>
                        <td className="px-4 py-3">{app.service?.serviceName}</td>
                        <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/officer/application/${app.id}`}
                            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl"
                          >
                            Review Dossier
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW H: ACTIVITY / AUDIT HISTORY (Section 42 Spec)        */}
      {/* ========================================================= */}
      {activeTab === 'audit-history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Officer Operational Audit History
              </h3>
              <p className="text-xs text-slate-500">Record of verifications, draft saves, reports, and GPS demarcations submitted by your account.</p>
            </div>
            <button
              onClick={loadOfficerAuditLogs}
              disabled={loadingAudit}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingAudit ? (
            <div className="p-12 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading activity history...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No audit entries recorded for your officer account yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity ID</th>
                    <th className="px-4 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-900">{log.entityId}</td>
                      <td className="px-4 py-3 text-slate-600">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE INSPECTION MODAL */}
      {scheduleModalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase mb-1">
                  <Calendar className="w-3 h-3" />
                  {deptConfig.fieldInspectionLabel}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Schedule Verification: {scheduleModalApp.applicationNumber}
                </h3>
              </div>
              <button
                onClick={() => setScheduleModalApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Type *</label>
                <input
                  type="text"
                  required
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instructions for Citizen</label>
                <textarea
                  rows={3}
                  value={scheduleRemarks}
                  onChange={(e) => setScheduleRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="e.g. Please be present on site with original deed documents and boundary demarcation markers..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScheduleModalApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition shadow-lg shadow-teal-700/20 flex items-center gap-1.5"
                >
                  {scheduling ? 'Dispatching...' : 'Confirm & Notify Citizen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT AUDIT MODAL */}
      {docReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Document Audit: {docReviewModal.documentName}
              </h3>
              <button
                onClick={() => setDocReviewModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifyDocument} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Finding *</label>
                <select
                  value={docVerificationStatus}
                  onChange={(e) => setDocVerificationStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="VERIFIED">Verified (Conforms to Requirements)</option>
                  <option value="NOT_VERIFIED">Invalid / Defective Document</option>
                  <option value="REQUIRES_CLARIFICATION">Requires Citizen Clarification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Officer Scrutiny Remarks</label>
                <textarea
                  rows={3}
                  value={docOfficerRemark}
                  onChange={(e) => setDocOfficerRemark(e.target.value)}
                  placeholder="Note seal clarity, registration number check, or discrepancy..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDocReviewModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingDoc}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition shadow-lg shadow-teal-700/20"
                >
                  {verifyingDoc ? 'Recording...' : 'Record Audit Finding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FieldOfficerDashboard;
