import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building, FileText, Layers, History, Shield,
  CheckCircle2, Clock, AlertTriangle, ArrowRight, BarChart3,
  PieChart, Activity, Sparkles
} from 'lucide-react';
import api from '../../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Compiling executive governance analytics...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-semibold uppercase tracking-wider mb-2">
            System Administration & Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            National LandStack Executive Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            System-wide monitoring of cadastral registries, departmental throughput, staff assignments, and audit trails.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/staff"
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" /> Manage Staff
          </Link>
          <Link
            to="/admin/audit-logs"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition flex items-center gap-1.5"
          >
            <History className="w-4 h-4" /> Audit Logs
          </Link>
        </div>
      </div>

      {/* Macro Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Citizens</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{stats?.totalCitizens || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gov Staff</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{stats?.totalStaff || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Departments</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{stats?.totalDepartments || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Catalog Services</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{stats?.totalServices || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ULPIN Parcels</span>
          <p className="text-2xl font-black text-blue-700 font-mono mt-1">{stats?.totalParcels || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Applications</span>
          <p className="text-2xl font-black text-indigo-700 font-mono mt-1">{stats?.totalApplications || 0}</p>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Applications by Department */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Service Throughput by Department
          </h3>

          <div className="space-y-3 text-xs">
            {stats?.applicationsByDepartment && Object.entries(stats.applicationsByDepartment).map(([dept, count]) => {
              const max = Math.max(...Object.values(stats.applicationsByDepartment), 1);
              const pct = Math.round((count / max) * 100);

              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">{dept}</span>
                    <span className="font-mono font-bold text-slate-900">{count} cases</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applications by Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" />
            Application Lifecycle Distribution
          </h3>

          <div className="space-y-3 text-xs">
            {stats?.applicationsByStatus && Object.entries(stats.applicationsByStatus).map(([status, count]) => {
              const total = stats.totalApplications || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">{status.replace('_', ' ')}</span>
                    <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cadastral Verification Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Cadastral Parcel Verification Health
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800">Verified</span>
              <p className="text-xl font-mono font-bold text-emerald-700 mt-1">{stats?.parcelVerificationStats?.['Verified'] || 0}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800">Pending</span>
              <p className="text-xl font-mono font-bold text-amber-700 mt-1">{stats?.parcelVerificationStats?.['Pending Verification'] || 0}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <span className="text-[10px] uppercase font-bold text-red-800">Disputed</span>
              <p className="text-xl font-mono font-bold text-red-700 mt-1">{stats?.parcelVerificationStats?.['Disputed'] || 0}</p>
            </div>
          </div>
        </div>

        {/* Land-Use Zoning Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Zoning & Land-Use Allocation
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {stats?.landUseDistribution && Object.entries(stats.landUseDistribution).map(([zoning, count]) => (
              <div key={zoning} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-700 truncate">{zoning}</span>
                <span className="font-mono font-bold text-blue-700 ml-1">{count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
