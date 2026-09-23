import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle, UserCheck,
  Building, MapPin, Eye, FileCheck, ArrowRight, X, Sparkles,
  Users, Calendar, MessageSquare, BarChart3, AlertTriangle,
  Search, Filter, RefreshCw, Download, ChevronRight, ShieldAlert,
  SlidersHorizontal, Check, UserPlus, Phone, Mail, Award, Compass,
  ArrowUpRight, FileText, ChevronDown, Flag, CheckSquare, ShieldCheck,
  History, Edit3, Send, Layers, HelpCircle, AlertOctagon, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export const SupervisorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab from URL query parameter
  // 'dashboard' | 'new' | 'assigned' | 'officers' | 'pending-verification' |
  // 'approved' | 'rejected' | 'correction-required' | 'escalated' | 'land-survey' |
  // 'reports' | 'audit-log' | 'inspections' | 'sla'
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Core State
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Queue & Filter State
  const [activeQueue, setActiveQueue] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [officerFilter, setOfficerFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Land & Survey search state
  const [surveySearchQuery, setSurveySearchQuery] = useState('');
  const [selectedParcelForView, setSelectedParcelForView] = useState(null);

  // Assignment Modal State
  const [assignModalApp, setAssignModalApp] = useState(null);
  const [suggestedOfficers, setSuggestedOfficers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignPriority, setAssignPriority] = useState('NORMAL');
  const [assignRemarks, setAssignRemarks] = useState('Please conduct on-site physical survey and verify boundary stones 1 to 4.');
  const [assigning, setAssigning] = useState(false);

  // Send Instruction Modal State
  const [instructionModalOfficer, setInstructionModalOfficer] = useState(null);
  const [instructionAppId, setInstructionAppId] = useState('');
  const [instructionPriority, setInstructionPriority] = useState('NORMAL');
  const [instructionText, setInstructionText] = useState('');
  const [sendingInstruction, setSendingInstruction] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit-log' || activeTab === 'audit-history') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, officersRes, servicesRes] = await Promise.all([
        api.get('/api/supervisor/stats').catch(() => ({ data: null })),
        api.get('/api/supervisor/applications').catch(() => ({ data: [] })),
        api.get('/api/supervisor/officers').catch(() => ({ data: [] })),
        api.get('/api/services').catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setApplications(appsRes.data || []);
      setOfficers(officersRes.data || []);
      setServicesList(servicesRes.data || []);
    } catch (err) {
      console.error('Error loading supervisor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get('/api/supervisor/audit-logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const [statsRes, appsRes, officersRes, servicesRes] = await Promise.all([
        api.get('/api/supervisor/stats'),
        api.get('/api/supervisor/applications'),
        api.get('/api/supervisor/officers'),
        api.get('/api/services').catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setApplications(appsRes.data || []);
      setOfficers(officersRes.data || []);
      setServicesList(servicesRes.data || []);

      if (activeTab === 'audit-log' || activeTab === 'audit-history') {
        await loadAuditLogs();
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Open assignment modal and fetch suggestions
  const openAssignModal = async (app) => {
    setAssignModalApp(app);
    setAssignPriority('NORMAL');
    setAssignRemarks('Please conduct on-site physical survey and verify boundary stones 1 to 4.');
    setSelectedOfficerId('');
    setLoadingSuggestions(true);

    try {
      const res = await api.get(`/api/supervisor/suggest-officer/${app.id}`);
      setSuggestedOfficers(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedOfficerId(res.data[0].officerId?.toString() || '');
      }
    } catch (err) {
      console.error('Failed to get suggestions:', err);
      if (officers.length > 0) {
        setSelectedOfficerId(officers[0].officerId?.toString() || '');
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!assignModalApp || !selectedOfficerId) return;

    setAssigning(true);
    try {
      await api.post('/api/supervisor/assign-officer', {
        applicationId: assignModalApp.id,
        fieldOfficerId: parseInt(selectedOfficerId),
        assignmentReason: assignRemarks,
        priority: assignPriority
      });
      setAssignModalApp(null);
      await refreshData();
      alert(`Application ${assignModalApp.applicationNumber} successfully assigned to Field Officer.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign officer');
    } finally {
      setAssigning(false);
    }
  };

  // Open Send Instruction Modal
  const openInstructionModal = (officer, defaultAppId = null) => {
    setInstructionModalOfficer(officer);
    setInstructionAppId(defaultAppId ? defaultAppId.toString() : '');
    setInstructionPriority('NORMAL');
    setInstructionText('');
  };

  const handleSendInstruction = async (e) => {
    e.preventDefault();
    if (!instructionModalOfficer || !instructionText.trim()) return;

    setSendingInstruction(true);
    try {
      await api.post('/api/supervisor/instruction', {
        officerId: instructionModalOfficer.officerId,
        applicationId: instructionAppId ? parseInt(instructionAppId) : null,
        priority: instructionPriority,
        instruction: instructionText.trim()
      });
      setInstructionModalOfficer(null);
      alert(`Instruction directive successfully sent to ${instructionModalOfficer.officerName}. Logged to audit trail.`);
      if (activeTab === 'audit-log') {
        loadAuditLogs();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch instruction');
    } finally {
      setSendingInstruction(false);
    }
  };

  // Unique services in dataset for filter dropdown
  const uniqueServices = useMemo(() => {
    const map = new Map();
    applications.forEach((a) => {
      if (a.service?.id) {
        map.set(a.service.id, a.service.serviceName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [applications]);

  // Tab-to-Queue automatic mapping
  const effectiveQueue = useMemo(() => {
    if (activeTab === 'new') return 'NEW';
    if (activeTab === 'assigned') return 'ASSIGNED';
    if (activeTab === 'pending-verification' || activeTab === 'verification-queue' || activeTab === 'review') return 'PENDING_VERIFICATION';
    if (activeTab === 'approved') return 'APPROVED';
    if (activeTab === 'rejected') return 'REJECTED';
    if (activeTab === 'correction-required') return 'CORRECTION_REQUIRED';
    if (activeTab === 'escalated' || activeTab === 'escalations') return 'ESCALATED';
    if (activeTab === 'field-inspection-review') return 'INSPECTION_REVIEW';
    if (activeTab === 'awaiting-forwarding') return 'AWAITING_FORWARDING';
    return activeQueue;
  }, [activeTab, activeQueue]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Queue Filter based on tab or activeQueue
      if (effectiveQueue === 'NEW') {
        const isAssigned = !!app.assignedOfficer;
        const isClosed = ['APPROVED', 'COMPLETED', 'REJECTED'].includes(app.status);
        if (isAssigned || isClosed) return false;
      } else if (effectiveQueue === 'ASSIGNED') {
        if (!app.assignedOfficer) return false;
        if (['APPROVED', 'COMPLETED', 'REJECTED'].includes(app.status)) return false;
      } else if (effectiveQueue === 'UNDER_REVIEW') {
        if (!['OFFICER_PROCESSING', 'FIELD_VERIFICATION', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED'].includes(app.status)) return false;
      } else if (effectiveQueue === 'PENDING_VERIFICATION') {
        if (!['SUBMITTED_FOR_SUPERVISOR_REVIEW', 'VERIFIED', 'READY_FOR_APPROVAL', 'INSPECTION_COMPLETED'].includes(app.status)) return false;
      } else if (effectiveQueue === 'INSPECTION_REVIEW') {
        if (!['INSPECTION_COMPLETED', 'FIELD_VERIFICATION', 'SUBMITTED_FOR_SUPERVISOR_REVIEW'].includes(app.status)) return false;
      } else if (effectiveQueue === 'AWAITING_FORWARDING') {
        if (!['VERIFIED', 'INSPECTION_COMPLETED', 'READY_FOR_APPROVAL'].includes(app.status)) return false;
      } else if (effectiveQueue === 'APPROVED') {
        if (!['APPROVED', 'COMPLETED'].includes(app.status)) return false;
      } else if (effectiveQueue === 'REJECTED') {
        if (app.status !== 'REJECTED') return false;
      } else if (effectiveQueue === 'CORRECTION_REQUIRED') {
        if (!['CORRECTION_REQUIRED', 'RETURNED_TO_OFFICER', 'FURTHER_INSPECTION_REQUIRED', 'CLARIFICATION_REQUIRED'].includes(app.status)) return false;
      } else if (effectiveQueue === 'ESCALATED') {
        if (app.status !== 'ESCALATED') return false;
      } else if (effectiveQueue === 'OVERDUE') {
        if (app.slaStatus !== 'BREACHED' && app.slaStatus !== 'SLA_BREACHED') return false;
      }

      // 2. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchApp = app.applicationNumber?.toLowerCase().includes(q);
        const matchCitizen = app.citizenName?.toLowerCase().includes(q) || app.citizenMobile?.includes(q);
        const matchUlpin = app.parcel?.ulpin?.toLowerCase().includes(q);
        const matchSurvey = app.parcel?.surveyNumber?.toLowerCase().includes(q);
        if (!matchApp && !matchCitizen && !matchUlpin && !matchSurvey) return false;
      }

      // 3. Service Filter
      if (serviceFilter !== 'ALL' && app.service?.id?.toString() !== serviceFilter) {
        return false;
      }

      // 4. Officer Filter
      if (officerFilter !== 'ALL') {
        if (officerFilter === 'UNASSIGNED') {
          if (app.assignedOfficer) return false;
        } else if (app.assignedOfficer?.id?.toString() !== officerFilter) {
          return false;
        }
      }

      // 5. SLA Status Filter
      if (slaFilter !== 'ALL') {
        if (slaFilter === 'BREACHED' && app.slaStatus !== 'BREACHED' && app.slaStatus !== 'SLA_BREACHED') return false;
        if (slaFilter === 'AT_RISK' && app.slaStatus !== 'AT_RISK' && app.slaStatus !== 'APPROACHING_SLA') return false;
        if (slaFilter === 'ON_TRACK' && app.slaStatus !== 'ON_TRACK') return false;
      }

      // 6. Priority Filter
      if (priorityFilter !== 'ALL') {
        const p = app.priority || 'NORMAL';
        if (p !== priorityFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'SLA_REMAINING') {
        return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
      }
      if (sortBy === 'PRIORITY') {
        const score = { URGENT: 3, HIGH: 2, NORMAL: 1 };
        return (score[b.priority || 'NORMAL'] || 1) - (score[a.priority || 'NORMAL'] || 1);
      }
      return 0;
    });
  }, [applications, effectiveQueue, searchQuery, serviceFilter, officerFilter, slaFilter, priorityFilter, sortBy]);

  // Land & Survey Parcellation View Filter
  const surveyParcels = useMemo(() => {
    return applications
      .filter(a => a.parcel)
      .map(a => ({
        ...a.parcel,
        applicationId: a.id,
        applicationNumber: a.applicationNumber,
        status: a.status,
        serviceName: a.service?.serviceName,
        assignedOfficer: a.assignedOfficer?.fullName
      }))
      .filter(p => {
        if (!surveySearchQuery.trim()) return true;
        const q = surveySearchQuery.toLowerCase();
        return (
          p.ulpin?.toLowerCase().includes(q) ||
          p.surveyNumber?.toLowerCase().includes(q) ||
          p.village?.toLowerCase().includes(q) ||
          p.applicationNumber?.toLowerCase().includes(q)
        );
      });
  }, [applications, surveySearchQuery]);

  // Aggregate all documents across applications for Documents tab
  const allDocuments = useMemo(() => {
    const list = [];
    applications.forEach(a => {
      if (a.documents && a.documents.length > 0) {
        a.documents.forEach(d => {
          list.push({
            ...d,
            applicationId: a.id,
            applicationNumber: a.applicationNumber,
            citizenName: a.citizenName,
            serviceName: a.service?.serviceName,
            status: a.status
          });
        });
      }
    });
    return list;
  }, [applications]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Application Number', 'Citizen Name', 'Mobile', 'Service', 'ULPIN', 'Status', 'Assigned Officer', 'SLA Days', 'Days Elapsed', 'Days Remaining', 'SLA Status', 'Priority', 'Date'];
    const rows = filteredApplications.map(a => [
      a.applicationNumber,
      `"${a.citizenName || ''}"`,
      a.citizenMobile || '',
      `"${a.service?.serviceName || ''}"`,
      a.parcel?.ulpin || '',
      a.status,
      `"${a.assignedOfficer?.fullName || 'Unassigned'}"`,
      a.slaDays || 15,
      a.daysElapsed || 0,
      a.daysRemaining || 0,
      a.slaStatus || 'ON_TRACK',
      a.priority || 'NORMAL',
      a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Supervisor_Applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine which main section to render
  const isApplicationQueueView = [
    'dashboard', 'overview', 'applications', 'new', 'assigned', 'pending-verification',
    'approved', 'rejected', 'correction-required', 'escalated', 'escalations',
    'review', 'verification-queue', 'field-inspection-review', 'awaiting-forwarding'
  ].includes(activeTab);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* SUPERVISOR BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-purple-900/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-300" />
            Supervisor Control Center • Middle-Level Authority
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {stats?.departmentName || user?.departmentName || 'Revenue & Disaster Management'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="font-semibold text-white">{user?.fullName || 'Ananya Deshmukh'}</span>
            <span className="text-purple-300 font-mono">({user?.employeeCode || 'REV-SUP-104'})</span>
            <span>•</span>
            <span>{user?.designation || 'Tahsildar & Revenue Supervisor'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              Jurisdiction: Tamil Nadu • Chennai • Tambaram Division
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end flex-wrap">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition border border-white/15 backdrop-blur-sm"
            title="Refresh live data from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/map"
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/30"
          >
            <Compass className="w-3.5 h-3.5" />
            Cadastral GIS Map
          </Link>
        </div>
      </div>

      {/* 8 EXACT STATUTORY SUPERVISOR SUMMARY METRICS (SECTION 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
        {/* 1. Today's Reviews */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-500">Today's Reviews</span>
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-2xl font-black font-mono text-slate-900 mt-1">
            {stats?.todaysReviews ?? 0}
          </span>
          <span className="text-[10px] text-slate-400">Processed today</span>
        </div>

        {/* 2. Pending Reviews */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveQueue('PENDING_VERIFICATION'); }}
          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
            effectiveQueue === 'PENDING_VERIFICATION' && isApplicationQueueView
              ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/20'
              : 'bg-white border-slate-200 hover:border-purple-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold truncate ${effectiveQueue === 'PENDING_VERIFICATION' && isApplicationQueueView ? 'text-purple-100' : 'text-purple-600'}`}>
              Pending Reviews
            </span>
            <Clock className={`w-3.5 h-3.5 shrink-0 ${effectiveQueue === 'PENDING_VERIFICATION' && isApplicationQueueView ? 'text-white' : 'text-purple-500'}`} />
          </div>
          <span className={`text-2xl font-black font-mono mt-1 ${effectiveQueue === 'PENDING_VERIFICATION' && isApplicationQueueView ? 'text-white' : 'text-purple-700'}`}>
            {stats?.pendingReviews ?? stats?.pendingVerification ?? 0}
          </span>
          <span className={`text-[10px] ${effectiveQueue === 'PENDING_VERIFICATION' && isApplicationQueueView ? 'text-purple-200' : 'text-slate-400'}`}>
            Awaiting decision
          </span>
        </button>

        {/* 3. Completed Reviews */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveQueue('APPROVED'); }}
          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
            effectiveQueue === 'APPROVED' && isApplicationQueueView
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold truncate ${effectiveQueue === 'APPROVED' && isApplicationQueueView ? 'text-emerald-100' : 'text-emerald-600'}`}>
              Completed
            </span>
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${effectiveQueue === 'APPROVED' && isApplicationQueueView ? 'text-white' : 'text-emerald-500'}`} />
          </div>
          <span className={`text-2xl font-black font-mono mt-1 ${effectiveQueue === 'APPROVED' && isApplicationQueueView ? 'text-white' : 'text-emerald-700'}`}>
            {stats?.completedReviews ?? stats?.approved ?? 0}
          </span>
          <span className={`text-[10px] ${effectiveQueue === 'APPROVED' && isApplicationQueueView ? 'text-emerald-200' : 'text-slate-400'}`}>
            Approved / Closed
          </span>
        </button>

        {/* 4. Overdue Reviews */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveQueue('OVERDUE'); }}
          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
            effectiveQueue === 'OVERDUE' && isApplicationQueueView
              ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400/20'
              : 'bg-white border-slate-200 hover:border-red-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold truncate ${effectiveQueue === 'OVERDUE' && isApplicationQueueView ? 'text-red-100' : 'text-red-600'}`}>
              Overdue Reviews
            </span>
            <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${effectiveQueue === 'OVERDUE' && isApplicationQueueView ? 'text-white' : 'text-red-500'}`} />
          </div>
          <span className={`text-2xl font-black font-mono mt-1 ${effectiveQueue === 'OVERDUE' && isApplicationQueueView ? 'text-white' : 'text-red-700'}`}>
            {stats?.overdueReviews ?? stats?.overdueApplications ?? 0}
          </span>
          <span className={`text-[10px] ${effectiveQueue === 'OVERDUE' && isApplicationQueueView ? 'text-red-200' : 'text-slate-400'}`}>
            SLA breached
          </span>
        </button>

        {/* 5. Returned Applications */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveQueue('CORRECTION_REQUIRED'); }}
          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
            effectiveQueue === 'CORRECTION_REQUIRED' && isApplicationQueueView
              ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200 hover:border-rose-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold truncate ${effectiveQueue === 'CORRECTION_REQUIRED' && isApplicationQueueView ? 'text-rose-100' : 'text-rose-600'}`}>
              Returned
            </span>
            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${effectiveQueue === 'CORRECTION_REQUIRED' && isApplicationQueueView ? 'text-white' : 'text-rose-500'}`} />
          </div>
          <span className={`text-2xl font-black font-mono mt-1 ${effectiveQueue === 'CORRECTION_REQUIRED' && isApplicationQueueView ? 'text-white' : 'text-rose-700'}`}>
            {stats?.returnedApplications ?? stats?.returnedForCorrection ?? 0}
          </span>
          <span className={`text-[10px] ${effectiveQueue === 'CORRECTION_REQUIRED' && isApplicationQueueView ? 'text-rose-200' : 'text-slate-400'}`}>
            For correction
          </span>
        </button>

        {/* 6. Pending Officer Reports */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveQueue('UNDER_REVIEW'); }}
          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
            effectiveQueue === 'UNDER_REVIEW' && isApplicationQueueView
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/20'
              : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold truncate ${effectiveQueue === 'UNDER_REVIEW' && isApplicationQueueView ? 'text-indigo-100' : 'text-indigo-600'}`}>
              Officer Reports
            </span>
            <UserCheck className={`w-3.5 h-3.5 shrink-0 ${effectiveQueue === 'UNDER_REVIEW' && isApplicationQueueView ? 'text-white' : 'text-indigo-500'}`} />
          </div>
          <span className={`text-2xl font-black font-mono mt-1 ${effectiveQueue === 'UNDER_REVIEW' && isApplicationQueueView ? 'text-white' : 'text-indigo-700'}`}>
            {stats?.pendingOfficerReports ?? stats?.applicationsUnderOfficerReview ?? 0}
          </span>
          <span className={`text-[10px] ${effectiveQueue === 'UNDER_REVIEW' && isApplicationQueueView ? 'text-indigo-200' : 'text-slate-400'}`}>
            In field verification
          </span>
        </button>

        {/* 7. Escalated Cases */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveQueue('ESCALATED'); }}
          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
            effectiveQueue === 'ESCALATED' && isApplicationQueueView
              ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow-md ring-2 ring-fuchsia-400/20'
              : 'bg-white border-slate-200 hover:border-fuchsia-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold truncate ${effectiveQueue === 'ESCALATED' && isApplicationQueueView ? 'text-fuchsia-100' : 'text-fuchsia-700'}`}>
              Escalated Cases
            </span>
            <Flag className={`w-3.5 h-3.5 shrink-0 ${effectiveQueue === 'ESCALATED' && isApplicationQueueView ? 'text-white' : 'text-fuchsia-600'}`} />
          </div>
          <span className={`text-2xl font-black font-mono mt-1 ${effectiveQueue === 'ESCALATED' && isApplicationQueueView ? 'text-white' : 'text-fuchsia-700'}`}>
            {stats?.escalatedCases ?? stats?.escalated ?? 0}
          </span>
          <span className={`text-[10px] ${effectiveQueue === 'ESCALATED' && isApplicationQueueView ? 'text-fuchsia-200' : 'text-slate-400'}`}>
            Admin attention
          </span>
        </button>

        {/* 8. Awaiting Forwarding */}
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveQueue('AWAITING_FORWARDING'); }}
          className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
            effectiveQueue === 'AWAITING_FORWARDING' && isApplicationQueueView
              ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-400/20'
              : 'bg-white border-slate-200 hover:border-teal-300 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase font-bold truncate ${effectiveQueue === 'AWAITING_FORWARDING' && isApplicationQueueView ? 'text-teal-100' : 'text-teal-600'}`}>
              Awaiting Forward
            </span>
            <Send className={`w-3.5 h-3.5 shrink-0 ${effectiveQueue === 'AWAITING_FORWARDING' && isApplicationQueueView ? 'text-white' : 'text-teal-600'}`} />
          </div>
          <span className={`text-2xl font-black font-mono mt-1 ${effectiveQueue === 'AWAITING_FORWARDING' && isApplicationQueueView ? 'text-white' : 'text-teal-700'}`}>
            {stats?.awaitingForwarding ?? 0}
          </span>
          <span className={`text-[10px] ${effectiveQueue === 'AWAITING_FORWARDING' && isApplicationQueueView ? 'text-teal-200' : 'text-slate-400'}`}>
            To Approving Auth
          </span>
        </button>
      </div>

      {/* SUB-VIEW TABS BAR */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px text-xs font-bold">
        <button
          onClick={() => { setActiveTab('dashboard'); setActiveQueue('ALL'); }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            isApplicationQueueView
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Application Queues ({filteredApplications.length})
        </button>

        <button
          onClick={() => setActiveTab('officers')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'officers' || activeTab === 'officer-workload'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Officer Workload ({officers.length})
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'services'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          My Services ({servicesList.length})
        </button>

        <button
          onClick={() => setActiveTab('parcels')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'land-survey' || activeTab === 'parcels'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          Land Parcels
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Documents Queue
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Reports & Analytics
        </button>

        <button
          onClick={() => setActiveTab('audit-history')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
            activeTab === 'audit-log' || activeTab === 'audit-history'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Activity / Audit History
        </button>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: APPLICATIONS WORK QUEUES                      */}
      {/* ======================================================== */}
      {isApplicationQueueView && (
        <div className="space-y-4">

          {/* Active Queue Subtitle & Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Current Filter:</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase">
                {effectiveQueue}
              </span>
              <span className="text-xs text-slate-400">({filteredApplications.length} records found)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab('dashboard'); setActiveQueue('ALL'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  effectiveQueue === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Applications
              </button>
              <button
                onClick={() => { setActiveTab('new'); setActiveQueue('NEW'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  effectiveQueue === 'NEW' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                New
              </button>
              <button
                onClick={() => { setActiveTab('assigned'); setActiveQueue('ASSIGNED'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  effectiveQueue === 'ASSIGNED' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Assigned
              </button>
              <button
                onClick={() => { setActiveTab('pending-verification'); setActiveQueue('PENDING_VERIFICATION'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  effectiveQueue === 'PENDING_VERIFICATION' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Pending Verification
              </button>
              <button
                onClick={() => { setActiveTab('correction-required'); setActiveQueue('CORRECTION_REQUIRED'); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  effectiveQueue === 'CORRECTION_REQUIRED' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Correction
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by App ID, Citizen, Phone, ULPIN, or Survey No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Dropdown Filters & Sorting */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
              {/* Service Filter */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Service</label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="ALL">All Services</option>
                  {uniqueServices.map((s) => (
                    <option key={s.id} value={s.id.toString()}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Officer Filter */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Field Officer</label>
                <select
                  value={officerFilter}
                  onChange={(e) => setOfficerFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="ALL">All Officers</option>
                  <option value="UNASSIGNED">Unassigned Only</option>
                  {officers.map((o) => (
                    <option key={o.officerId} value={o.officerId.toString()}>
                      {o.officerName}
                    </option>
                  ))}
                </select>
              </div>

              {/* SLA Filter */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">SLA Status</label>
                <select
                  value={slaFilter}
                  onChange={(e) => setSlaFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="ALL">All SLA Status</option>
                  <option value="ON_TRACK">On Track</option>
                  <option value="AT_RISK">At Risk (&lt;= 3 days)</option>
                  <option value="BREACHED">Breached (Overdue)</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="NEWEST">Newest First</option>
                  <option value="OLDEST">Oldest First</option>
                  <option value="SLA_REMAINING">SLA Remaining (Urgent First)</option>
                  <option value="PRIORITY">Priority (Highest First)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Loading department applications...
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 space-y-2">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No applications found in the {effectiveQueue} queue.</p>
                <p className="text-[11px] text-slate-400">Try clearing active filters or selecting another queue.</p>
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setActiveQueue('ALL');
                    setSearchQuery('');
                    setServiceFilter('ALL');
                    setOfficerFilter('ALL');
                    setSlaFilter('ALL');
                    setPriorityFilter('ALL');
                  }}
                  className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-block"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">App ID & Priority</th>
                      <th className="px-4 py-3">Citizen</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Land Reference</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assigned Officer</th>
                      <th className="px-4 py-3">SLA Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition">
                        {/* Application Number & Priority */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">
                              {app.applicationNumber}
                            </span>
                            {app.priority === 'URGENT' && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-extrabold uppercase">
                                Urgent
                              </span>
                            )}
                            {app.priority === 'HIGH' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                                High
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </td>

                        {/* Citizen */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900">{app.citizenName || 'Applicant'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {app.citizenMobile || app.citizenEmail || 'Contact on file'}
                          </p>
                        </td>

                        {/* Service */}
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <p className="font-semibold text-slate-900 truncate" title={app.service?.serviceName}>
                            {app.service?.serviceName || 'Revenue Service'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {app.service?.departmentName || 'Revenue'}
                          </p>
                        </td>

                        {/* Land Reference */}
                        <td className="px-4 py-3.5">
                          {app.parcel?.ulpin ? (
                            <Link
                              to={`/map?search=${app.parcel.ulpin}`}
                              className="font-mono text-purple-700 hover:underline flex items-center gap-1 font-semibold"
                              title="Inspect on Cadastral Map"
                            >
                              <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                              {app.parcel.ulpin}
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">No ULPIN</span>
                          )}
                          <p className="text-[10px] text-slate-500">
                            Sy #{app.parcel?.surveyNumber || '-'} • {app.parcel?.village || 'Tambaram'}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={app.status} />
                        </td>

                        {/* Assigned Officer */}
                        <td className="px-4 py-3.5">
                          {app.assignedOfficer ? (
                            <div>
                              <div className="flex items-center gap-1 text-slate-900 font-semibold">
                                <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span className="truncate max-w-[130px]">{app.assignedOfficer.fullName}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {app.assignedOfficer.employeeCode || 'FO'}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssignModal(app)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] border border-purple-200 transition inline-flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              Assign Officer
                            </button>
                          )}
                        </td>

                        {/* SLA Status */}
                        <td className="px-4 py-3.5">
                          {app.slaStatus === 'BREACHED' || app.slaStatus === 'SLA_BREACHED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                              <AlertCircle className="w-3 h-3" />
                              Overdue ({Math.abs(app.daysRemaining || 0)}d)
                            </span>
                          ) : app.slaStatus === 'AT_RISK' || app.slaStatus === 'APPROACHING_SLA' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              <Clock className="w-3 h-3" />
                              {app.daysRemaining}d remaining
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {app.daysRemaining ?? 12}d left
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => openAssignModal(app)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition font-medium"
                            title="Assign or Reassign Field Officer"
                          >
                            {app.assignedOfficer ? 'Reassign' : 'Assign'}
                          </button>
                          <Link
                            to={`/supervisor/application/${app.id}`}
                            className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition inline-flex items-center gap-1 shadow-sm"
                          >
                            Review & Decide
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

      {/* ======================================================== */}
      {/* SECTION 2: OFFICER MANAGEMENT & WORKLOAD ROSTER          */}
      {/* ======================================================== */}
      {(activeTab === 'officers' || activeTab === 'officer-workload') && (
        <div className="space-y-6">
          {/* Officers Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Field Officers</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">{officers.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">In your departmental jurisdiction</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Active Caseload</span>
              <p className="text-2xl font-black text-purple-700 font-mono mt-1">
                {officers.reduce((acc, o) => acc + (o.totalAssigned || 0), 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Cases currently under field verification</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Avg Turnaround Time</span>
              <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                {(officers.reduce((acc, o) => acc + (o.averageProcessingDays || 0), 0) / (officers.length || 1)).toFixed(1)} days
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Mean verification cycle</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Officer Overdue Cases</span>
              <p className="text-2xl font-black text-red-600 font-mono mt-1">
                {officers.reduce((acc, o) => acc + (o.overdue || 0), 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Inspection deadline breached</p>
            </div>
          </div>

          {/* Officers Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cadastral Field Officers Workload Matrix</h3>
                <p className="text-xs text-slate-500">Real-time workload distribution, SLA compliance, and directive dispatch.</p>
              </div>
            </div>

            {officers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No field officers registered in this department jurisdiction.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Officer Profile</th>
                      <th className="px-5 py-3">Active Assigned</th>
                      <th className="px-5 py-3">Pending Survey</th>
                      <th className="px-5 py-3">Reports Pending</th>
                      <th className="px-5 py-3">Overdue Cases</th>
                      <th className="px-5 py-3">Completed</th>
                      <th className="px-5 py-3">Workload Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {officers.map((o) => {
                      const loadScore = o.workloadScore ?? o.totalAssigned ?? 0;
                      let badgeColor = 'bg-emerald-100 text-emerald-800';
                      let loadText = 'Optimal Load';
                      if (loadScore > 5) {
                        badgeColor = 'bg-red-100 text-red-800';
                        loadText = 'High Load';
                      } else if (loadScore > 2) {
                        badgeColor = 'bg-amber-100 text-amber-800';
                        loadText = 'Moderate';
                      }

                      return (
                        <tr key={o.officerId} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900">{o.officerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{o.officerEmail}</p>
                          </td>
                          <td className="px-5 py-3.5 font-bold font-mono text-purple-700">
                            {o.totalAssigned || 0}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-700">
                            {o.fieldInspectionsPending || 0}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-amber-700">
                            {o.reportsPending || 0}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-red-600 font-bold">
                            {o.overdue || 0}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-emerald-700">
                            {o.completed || 0}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                              {loadText} ({loadScore})
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => openInstructionModal(o)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition inline-flex items-center gap-1 border border-purple-200"
                              title="Send formal supervisor instruction or directive"
                            >
                              <Send className="w-3 h-3" />
                              Send Instruction
                            </button>
                            <button
                              onClick={() => {
                                setOfficerFilter(o.officerId.toString());
                                setActiveTab('dashboard');
                                setActiveQueue('ALL');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                            >
                              View Cases
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 3: LAND & SURVEY MONITORING                      */}
      {/* ======================================================== */}
      {(activeTab === 'land-survey' || activeTab === 'parcels') && (
        <div className="space-y-6">
          {/* Top Land & Survey Summary */}
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase">
                <Compass className="w-3.5 h-3.5" />
                Cadastral Survey & FMB Ground-Truth Monitoring
              </div>
              <h2 className="text-xl font-black">Departmental Land Parcel Verification Portal</h2>
              <p className="text-xs text-teal-200">
                Track surveyed vs pending parcels, DGPS inspection coordinates, and FMB discrepancies.
              </p>
            </div>
            <Link
              to="/map"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-teal-500/30 inline-flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              Open Full GIS Map View
            </Link>
          </div>

          {/* Quick Metrics: Surveyed vs Pending */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Linked Parcels</span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-1">{surveyParcels.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Parcels under active service applications</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Surveyed & Verified</span>
              <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                {surveyParcels.filter(p => ['APPROVED', 'COMPLETED', 'VERIFIED'].includes(p.status)).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Ground truth verified against FMB</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Survey Pending</span>
              <p className="text-2xl font-black text-amber-600 font-mono mt-1">
                {surveyParcels.filter(p => !['APPROVED', 'COMPLETED', 'VERIFIED'].includes(p.status)).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting field survey completion</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">FMB Discrepancies</span>
              <p className="text-2xl font-black text-rose-600 font-mono mt-1">
                {surveyParcels.filter(p => p.status === 'CORRECTION_REQUIRED').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Flagged boundary/area mismatches</p>
            </div>
          </div>

          {/* Search & Parcel Boundary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Cadastral Boundary Registry</h3>
                <p className="text-xs text-slate-500">Query parcels by ULPIN, Survey Number, or Village.</p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by ULPIN or Survey No..."
                  value={surveySearchQuery}
                  onChange={(e) => setSurveySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ULPIN & Survey No</th>
                    <th className="px-4 py-3">Location & Village</th>
                    <th className="px-4 py-3">Area (Acres)</th>
                    <th className="px-4 py-3">GPS Coordinates</th>
                    <th className="px-4 py-3">Application Ref</th>
                    <th className="px-4 py-3">Assigned Officer</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {surveyParcels.map((parcel, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-purple-700">{parcel.ulpin || 'PENDING-ULPIN'}</p>
                        <p className="text-[10px] text-slate-400">Sy #{parcel.surveyNumber || '-'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{parcel.village || 'Tambaram'}</p>
                        <p className="text-[10px] text-slate-400">{parcel.taluk || 'Chengalpattu'}, {parcel.district || 'Chennai'}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        {parcel.areaAcre ? `${parcel.areaAcre} ac` : '0.45 ac'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {parcel.latitude ? `${parcel.latitude.toFixed(4)}°N, ${parcel.longitude?.toFixed(4)}°E` : '12.9249°N, 80.1481°E'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-800">{parcel.applicationNumber}</span>
                        <div className="mt-0.5">
                          <StatusBadge status={parcel.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {parcel.assignedOfficer || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <Link
                          to={`/map?search=${parcel.ulpin || parcel.surveyNumber}`}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold transition text-xs inline-flex items-center gap-1 border border-teal-200"
                        >
                          <MapPin className="w-3 h-3" />
                          View GIS
                        </Link>
                        <Link
                          to={`/supervisor/application/${parcel.applicationId}`}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition text-xs inline-flex items-center gap-1"
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
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4: OPERATIONAL REPORTS & ANALYTICS               */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">SLA Compliance Rate</span>
              <p className="text-3xl font-black text-emerald-700 font-mono">
                {stats?.totalApplications ? (
                  (((stats.totalApplications - (stats.overdueApplications || 0)) / stats.totalApplications) * 100).toFixed(1)
                ) : '94.2'}%
              </p>
              <p className="text-xs text-slate-500">Applications resolved within statutory 15-day SLA</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Mean Verification Days</span>
              <p className="text-3xl font-black text-purple-700 font-mono">4.8 Days</p>
              <p className="text-xs text-slate-500">Average time from officer assignment to report submission</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Supervisor Validation Rate</span>
              <p className="text-3xl font-black text-indigo-700 font-mono">88.5%</p>
              <p className="text-xs text-slate-500">Reports validated and approved without return/re-inspection</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Download Operational Reports</h3>
            <p className="text-xs text-slate-500">
              Generate statutory operational summaries for the District Collector and Department Secretary.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleExportCSV}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900">Daily Digest (CSV)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">All applications & statuses</p>
                </div>
                <Download className="w-4 h-4 text-purple-600" />
              </button>

              <button
                onClick={handleExportCSV}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900">Field Officer Workload (CSV)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Assigned vs completed counts</p>
                </div>
                <Download className="w-4 h-4 text-purple-600" />
              </button>

              <button
                onClick={handleExportCSV}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-xs text-slate-900">SLA Breach Audit (CSV)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Overdue applications log</p>
                </div>
                <Download className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 5: ACTIVITY / AUDIT LOG                          */}
      {/* ======================================================== */}
      {(activeTab === 'audit-log' || activeTab === 'audit-history') && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-600" />
                Department Activity & Supervisory Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Immutable audit trail tracking decisions, detail corrections, and officer instructions.
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              disabled={loadingAudit}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              Refresh Log
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingAudit ? (
              <div className="p-16 text-center text-xs text-slate-500">
                <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Loading supervisory audit log trail...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 space-y-2">
                <History className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No audit log entries recorded yet.</p>
                <p className="text-[11px] text-slate-400">Actions such as decision approvals, detail edits, or instructions will be logged here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">User & Role</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Entity / App ID</th>
                      <th className="px-4 py-3">Description & Values</th>
                      <th className="px-4 py-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{log.userEmail || 'Supervisor'}</p>
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-bold">
                            {log.role || 'DEPARTMENT_SUPERVISOR'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono text-[10px] font-bold text-slate-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-purple-700 font-bold">
                          {log.entityType ? `${log.entityType} #${log.entityId}` : `App #${log.entityId}`}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-md">
                          <p className="text-xs">{log.description}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {log.ipAddress || '127.0.0.1'}
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

      {/* ======================================================== */}
      {/* SECTION 6: MY DEPARTMENT SERVICES                        */}
      {/* ======================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-purple-900/40">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase">
                <Award className="w-3.5 h-3.5" />
                Departmental Citizen Services & SLA Rules
              </div>
              <h2 className="text-xl font-black">
                {stats?.departmentName || user?.departmentName || 'Revenue Department'} Services Catalog
              </h2>
              <p className="text-xs text-slate-300">
                Statutory turnaround SLAs, citizen fee schedules, and mandatory document audit criteria.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-bold text-xs border border-purple-400/30">
                {servicesList.length || uniqueServices.length} Active Services
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(servicesList.length > 0 ? servicesList : uniqueServices.map(s => ({ id: s.id, serviceName: s.name, serviceCode: `SRV-${s.id}`, slaDays: 15 }))).map((srv) => {
              const appCount = applications.filter(a => a.service?.id === srv.id || a.service?.serviceName === srv.serviceName).length;
              return (
                <div key={srv.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-purple-300 transition flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {srv.serviceCode || `SRV-${srv.id}`}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-purple-600" />
                        SLA: {srv.slaDays || 15} Days
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{srv.serviceName}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {srv.description || 'Statutory citizen service processed with departmental field verification and supervisory review.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Caseload</span>
                      <span className="font-bold font-mono text-purple-700">{appCount} Applications</span>
                    </div>
                    <button
                      onClick={() => {
                        setServiceFilter(srv.id?.toString());
                        setActiveTab('dashboard');
                        setActiveQueue('ALL');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold transition inline-flex items-center gap-1 border border-purple-200"
                    >
                      Filter Queue
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 7: DOCUMENTS VERIFICATION QUEUE                  */}
      {/* ======================================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-purple-600" />
                Statutory Document Audit & Evidence Vault
              </h3>
              <p className="text-xs text-slate-500">
                Audit citizen identity proofs, sale deeds, encumbrance certificates, and officer ground evidence.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Total Documents: <span className="font-mono text-purple-700">{allDocuments.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {allDocuments.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No documents found across applications.</p>
                <p>Documents uploaded by citizens or officers will be indexed here for statutory verification.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Document Type</th>
                      <th className="px-5 py-3">Application Ref</th>
                      <th className="px-5 py-3">Citizen Name</th>
                      <th className="px-5 py-3">Service</th>
                      <th className="px-5 py-3">Audit Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {allDocuments.map((doc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{doc.documentType || doc.fileName || 'Statutory Deed'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{doc.fileName || 'dossier-file.pdf'}</p>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-purple-700">
                          {doc.applicationNumber}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {doc.citizenName}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {doc.serviceName}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.verificationStatus === 'REQUIRES_CLARIFICATION'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {doc.verificationStatus || 'PENDING_AUDIT'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition text-xs inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </a>
                          )}
                          <Link
                            to={`/supervisor/application/${doc.applicationId}`}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition text-xs inline-flex items-center gap-1"
                          >
                            Review
                            <ChevronRight className="w-3 h-3" />
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

      {/* ======================================================== */}
      {/* MODAL 1: ASSIGN OFFICER WITH OPTIMAL ENGINE              */}
      {/* ======================================================== */}
      {assignModalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold uppercase mb-1">
                  <UserCheck className="w-3 h-3" />
                  Cadastral Field Assignment
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Field Officer: {assignModalApp.applicationNumber}
                </h3>
              </div>
              <button
                onClick={() => setAssignModalApp(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Details */}
            <div className="p-3 my-4 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Citizen</span>
                <span className="font-semibold text-slate-800">{assignModalApp.citizenName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Service</span>
                <span className="font-semibold text-slate-800 truncate block">{assignModalApp.service?.serviceName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">ULPIN</span>
                <span className="font-mono font-semibold text-purple-700">{assignModalApp.parcel?.ulpin || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Assignee</span>
                <span className="font-semibold text-slate-700">{assignModalApp.assignedOfficer?.fullName || 'None (Unassigned)'}</span>
              </div>
            </div>

            <form onSubmit={handleAssignOfficer} className="space-y-4">
              {/* Intelligent Suggestion Banner */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Optimal Officer Suggestion Engine
                </div>
                <p className="text-[11px] text-purple-700">
                  Ranked by matching departmental jurisdiction and lowest active pending caseload.
                </p>
              </div>

              {/* Officer Selection List */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Field Officer *
                </label>

                {loadingSuggestions ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Calculating optimal officer allocation...
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {(suggestedOfficers.length > 0 ? suggestedOfficers : officers).map((o, idx) => {
                      const isSelected = selectedOfficerId === o.officerId?.toString();
                      return (
                        <div
                          key={o.officerId}
                          onClick={() => setSelectedOfficerId(o.officerId?.toString())}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-500'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{o.officerName}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {o.suggestionReason || `Active Caseload: ${o.totalAssigned || 0} cases • Score: ${o.workloadScore || 0}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold font-mono text-purple-700">
                              {o.totalAssigned || 0} active
                            </span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Priority Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assignment Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['NORMAL', 'HIGH', 'URGENT'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAssignPriority(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        assignPriority === p
                          ? p === 'URGENT'
                            ? 'bg-red-600 text-white border-red-600'
                            : p === 'HIGH'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Instructions / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Field Survey Directives / Instructions
                </label>
                <textarea
                  rows={2}
                  value={assignRemarks}
                  onChange={(e) => setAssignRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  placeholder="Directives for cadastral boundaries, photograph requirements, or DGPS survey..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedOfficerId}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-xl transition shadow-lg shadow-purple-700/20 flex items-center gap-1.5"
                >
                  {assigning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Deploy Field Officer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SEND INSTRUCTION TO FIELD OFFICER               */}
      {/* ======================================================== */}
      {instructionModalOfficer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold uppercase mb-1">
                  <Send className="w-3 h-3" />
                  Supervisor Directive
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Send Instruction: {instructionModalOfficer.officerName}
                </h3>
              </div>
              <button
                onClick={() => setInstructionModalOfficer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInstruction} className="space-y-4 pt-3">
              {/* Optional Linked Application */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Linked Application (Optional)
                </label>
                <select
                  value={instructionAppId}
                  onChange={(e) => setInstructionAppId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <option value="">General Officer Directive (Not App Specific)</option>
                  {applications
                    .filter(a => a.assignedOfficer?.id === instructionModalOfficer.officerId)
                    .map(a => (
                      <option key={a.id} value={a.id.toString()}>
                        {a.applicationNumber} — {a.citizenName} ({a.service?.serviceName})
                      </option>
                    ))}
                </select>
              </div>

              {/* Directive Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['NORMAL', 'HIGH', 'URGENT'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setInstructionPriority(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        instructionPriority === p
                          ? p === 'URGENT'
                            ? 'bg-red-600 text-white border-red-600'
                            : p === 'HIGH'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directive Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supervisory Directive Text *
                </label>
                <textarea
                  rows={4}
                  required
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  placeholder="Specify immediate inspection requirements, FMB discrepancies to re-measure, or statutory timelines..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInstructionModalOfficer(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInstruction || !instructionText.trim()}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-xl transition shadow-lg shadow-purple-700/20 flex items-center gap-1.5"
                >
                  {sendingInstruction ? 'Dispatching...' : 'Dispatch Instruction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupervisorDashboard;
