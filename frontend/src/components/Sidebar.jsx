import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building, FileText, ClipboardList,
  Map, ShieldCheck, History, CheckSquare, Bell, UserCircle,
  FileCheck, Sparkles, HelpCircle, Calendar, Clock, MessageSquare, BarChart3, AlertTriangle,
  CheckCircle2, XCircle, RotateCcw, AlertOctagon, Compass, FileSearch, ArrowUpRight,
  Layers, MapPin, Flag, ShieldAlert, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getDepartmentConfig } from '../utils/departmentOfficerConfig';

export const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'overview';

  // Retrieve department configuration for field ops authorization
  const deptConfig = getDepartmentConfig(user?.departmentName || user?.department?.name);
  const canPerformFieldOps = deptConfig?.canPerformFieldOps ||
    user?.departmentName?.toLowerCase().includes('survey') ||
    user?.departmentName?.toLowerCase().includes('revenue') ||
    user?.departmentName?.toLowerCase().includes('planning');

  // Query-aware active link helpers
  const isSupervisorLinkActive = (path, tab) => {
    if (path === '/supervisor/dashboard') {
      if (!tab || tab === 'overview') {
        return location.pathname === '/supervisor/dashboard' && (!location.search || currentTab === 'overview' || currentTab === 'dashboard');
      }
      return location.pathname === '/supervisor/dashboard' && currentTab === tab;
    }
    return location.pathname === path;
  };

  const supervisorLinkClass = (path, tab) => {
    const active = isSupervisorLinkActive(path, tab);
    return `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
      active
        ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  const isOfficerLinkActive = (path, tab) => {
    if (path === '/officer/dashboard' || path === '/field-officer/dashboard') {
      if (!tab || tab === 'overview') {
        return (location.pathname === '/officer/dashboard' || location.pathname === '/field-officer/dashboard') && (!location.search || currentTab === 'overview' || currentTab === 'dashboard');
      }
      return (location.pathname === '/officer/dashboard' || location.pathname === '/field-officer/dashboard') && currentTab === tab;
    }
    return location.pathname === path;
  };

  const officerLinkClass = (path, tab) => {
    const active = isOfficerLinkActive(path, tab);
    return `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
      active
        ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">

        {/* User Identity Snippet */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{t('active_workspace')}</p>
          <p className="text-xs font-bold text-slate-900 mt-1 truncate">{user.fullName}</p>
          <p className="text-[11px] text-teal-700 font-medium truncate">
            {t('role_' + role.toLowerCase())} {user.departmentName ? `• ${user.departmentName}` : ''}
          </p>
        </div>

        {/* Dynamic Navigation according to Role */}
        <nav className="space-y-1">

          {/* ======================================================== */}
          {/* 1. ADMIN NAV                                             */}
          {/* ======================================================== */}
          {role === 'ADMIN' && (
            <>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Administration
              </div>
              <NavLink to="/admin" end className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                Executive Analytics
              </NavLink>
              <NavLink to="/admin/staff" className={linkClass}>
                <Users className="w-4 h-4" />
                Staff Management
              </NavLink>
              <NavLink to="/admin/departments" className={linkClass}>
                <Building className="w-4 h-4" />
                Departments
              </NavLink>
              <NavLink to="/admin/services" className={linkClass}>
                <FileText className="w-4 h-4" />
                Service Catalog
              </NavLink>
              <NavLink to="/admin/audit-logs" className={linkClass}>
                <History className="w-4 h-4" />
                System Audit Logs
              </NavLink>
            </>
          )}

          {/* ======================================================== */}
          {/* 2. OFFICER SIDEBAR (Section 9 Exact Master Specification) */}
          {/* ======================================================== */}
          {role === 'FIELD_OFFICER' && (
            <div className="space-y-0.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Officer Portal (Operational)
              </div>
              {/* 1. Dashboard */}
              <NavLink to="/officer/dashboard" className={officerLinkClass('/officer/dashboard', 'overview')}>
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0 text-teal-500" />
                <span className="truncate">Dashboard</span>
              </NavLink>
              {/* 2. My Services */}
              <NavLink to="/officer/dashboard?tab=services" className={officerLinkClass('/officer/dashboard', 'services')}>
                <Award className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                <span className="truncate">My Services</span>
              </NavLink>
              {/* 3. Assigned Applications */}
              <NavLink to="/officer/dashboard?tab=applications" className={officerLinkClass('/officer/dashboard', 'applications')}>
                <ClipboardList className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                <span className="truncate">Assigned Applications</span>
              </NavLink>
              {/* 4. Field Operations (only when authorized) */}
              {canPerformFieldOps && (
                <NavLink to="/officer/dashboard?tab=field-ops" className={officerLinkClass('/officer/dashboard', 'field-ops')}>
                  <Compass className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span className="truncate">Field Operations</span>
                </NavLink>
              )}
              {/* 5. Land Parcels */}
              <NavLink to="/officer/dashboard?tab=parcels" className={officerLinkClass('/officer/dashboard', 'parcels')}>
                <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                <span className="truncate">Land Parcels</span>
              </NavLink>
              {/* 6. Documents */}
              <NavLink to="/officer/dashboard?tab=documents" className={officerLinkClass('/officer/dashboard', 'documents')}>
                <FileCheck className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                <span className="truncate">Documents</span>
              </NavLink>
              {/* 7. Reports */}
              <NavLink to="/officer/dashboard?tab=reports" className={officerLinkClass('/officer/dashboard', 'reports')}>
                <BarChart3 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">Reports</span>
              </NavLink>
              {/* 8. Escalations */}
              <NavLink to="/officer/dashboard?tab=escalations" className={officerLinkClass('/officer/dashboard', 'escalations')}>
                <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span className="truncate">Escalations</span>
              </NavLink>
              {/* 9. Notifications */}
              <NavLink to="/notifications" className={officerLinkClass('/notifications')}>
                <Bell className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="truncate">Notifications</span>
              </NavLink>
              {/* 10. Activity / Audit History */}
              <NavLink to="/officer/dashboard?tab=audit-history" className={officerLinkClass('/officer/dashboard', 'audit-history')}>
                <History className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                <span className="truncate">Activity / Audit History</span>
              </NavLink>
              {/* 11. Profile */}
              <NavLink to="/profile" className={officerLinkClass('/profile')}>
                <UserCircle className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                <span className="truncate">Profile</span>
              </NavLink>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. SUPERVISOR SIDEBAR (Section 12 Exact Master Spec)     */}
          {/* ======================================================== */}
          {role === 'DEPARTMENT_SUPERVISOR' && (
            <div className="space-y-0.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Supervisor Portal (Verification & QC)
              </div>
              {/* 1. Dashboard */}
              <NavLink to="/supervisor/dashboard" className={supervisorLinkClass('/supervisor/dashboard', 'overview')}>
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                <span className="truncate">Dashboard</span>
              </NavLink>
              {/* 2. Application Review */}
              <NavLink to="/supervisor/dashboard?tab=review" className={supervisorLinkClass('/supervisor/dashboard', 'review')}>
                <CheckSquare className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                <span className="truncate">Application Review</span>
              </NavLink>
              {/* 3. Assigned Applications */}
              <NavLink to="/supervisor/dashboard?tab=assigned" className={supervisorLinkClass('/supervisor/dashboard', 'assigned')}>
                <ClipboardList className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                <span className="truncate">Assigned Applications</span>
              </NavLink>
              {/* 4. Officer Workload */}
              <NavLink to="/supervisor/dashboard?tab=officer-workload" className={supervisorLinkClass('/supervisor/dashboard', 'officer-workload')}>
                <Users className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                <span className="truncate">Officer Workload</span>
              </NavLink>
              {/* 5. My Services */}
              <NavLink to="/supervisor/dashboard?tab=services" className={supervisorLinkClass('/supervisor/dashboard', 'services')}>
                <Award className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="truncate">My Services</span>
              </NavLink>
              {/* 6. Verification Queue */}
              <NavLink to="/supervisor/dashboard?tab=verification-queue" className={supervisorLinkClass('/supervisor/dashboard', 'verification-queue')}>
                <Clock className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                <span className="truncate">Verification Queue</span>
              </NavLink>
              {/* 7. Field Inspection Review */}
              <NavLink to="/supervisor/dashboard?tab=field-inspection-review" className={supervisorLinkClass('/supervisor/dashboard', 'field-inspection-review')}>
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span className="truncate">Field Inspection Review</span>
              </NavLink>
              {/* 8. Land Parcels */}
              <NavLink to="/supervisor/dashboard?tab=parcels" className={supervisorLinkClass('/supervisor/dashboard', 'parcels')}>
                <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-500" />
                <span className="truncate">Land Parcels</span>
              </NavLink>
              {/* 9. Documents */}
              <NavLink to="/supervisor/dashboard?tab=documents" className={supervisorLinkClass('/supervisor/dashboard', 'documents')}>
                <FileCheck className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                <span className="truncate">Documents</span>
              </NavLink>
              {/* 10. Escalations */}
              <NavLink to="/supervisor/dashboard?tab=escalations" className={supervisorLinkClass('/supervisor/dashboard', 'escalations')}>
                <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span className="truncate">Escalations</span>
              </NavLink>
              {/* 11. Reports */}
              <NavLink to="/supervisor/dashboard?tab=reports" className={supervisorLinkClass('/supervisor/dashboard', 'reports')}>
                <BarChart3 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">Reports</span>
              </NavLink>
              {/* 12. Notifications */}
              <NavLink to="/notifications" className={supervisorLinkClass('/notifications')}>
                <Bell className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                <span className="truncate">Notifications</span>
              </NavLink>
              {/* 13. Activity / Audit History */}
              <NavLink to="/supervisor/dashboard?tab=audit-history" className={supervisorLinkClass('/supervisor/dashboard', 'audit-history')}>
                <History className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                <span className="truncate">Activity / Audit History</span>
              </NavLink>
              {/* 14. Profile */}
              <NavLink to="/profile" className={supervisorLinkClass('/profile')}>
                <UserCircle className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                <span className="truncate">Profile</span>
              </NavLink>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. CITIZEN NAV                                           */}
          {/* ======================================================== */}
          {role === 'CITIZEN' && (
            <>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('citizen_portal')}
              </div>
              <NavLink to="/dashboard" end className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                {t('dashboard')}
              </NavLink>
              <NavLink to="/applications" className={linkClass}>
                <ClipboardList className="w-4 h-4" />
                {t('my_applications')}
              </NavLink>
              <NavLink to="/services" className={linkClass}>
                <FileCheck className="w-4 h-4" />
                {t('apply_services')}
              </NavLink>
            </>
          )}

          {/* Cadastral GIS Tools (Common to all roles) */}
          <div className="pt-4 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('cadastral_tools')}
          </div>
          <NavLink to="/map" className={linkClass}>
            <Map className="w-4 h-4" />
            {t('cadastral_map')}
          </NavLink>
        </nav>
      </div>

      {/* Footer info pill */}
      <div className="pt-4 border-t border-slate-200">
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-blue-900">Digital Public Infrastructure</p>
            <p className="text-[10px] text-blue-700 mt-0.5">ULPIN-Centric Land Stack</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
