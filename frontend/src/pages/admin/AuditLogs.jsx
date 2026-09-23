import React, { useState, useEffect } from 'react';
import { History, Shield, Search, Filter, RefreshCw, FileText, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/audit-logs');
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(l => {
    const matchSearch =
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.entityId?.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === 'ALL' || l.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-red-50 text-red-700 border-red-200 border px-2 py-0.5 rounded-full text-[10px] font-bold">ADMIN</span>;
      case 'DEPARTMENT_SUPERVISOR':
        return <span className="bg-purple-50 text-purple-700 border-purple-200 border px-2 py-0.5 rounded-full text-[10px] font-bold">SUPERVISOR</span>;
      case 'FIELD_OFFICER':
        return <span className="bg-teal-50 text-teal-700 border-teal-200 border px-2 py-0.5 rounded-full text-[10px] font-bold">FIELD OFFICER</span>;
      default:
        return <span className="bg-blue-50 text-blue-700 border-blue-200 border px-2 py-0.5 rounded-full text-[10px] font-bold">CITIZEN</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Shield className="w-3.5 h-3.5 text-red-600" />
            <span>Immutable Governance Record</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">System Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident chronological audit logs recording all administrative decisions, submissions, and status transitions.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor email, entity ID..."
            className="w-full bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none text-slate-700"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin Actions</option>
            <option value="DEPARTMENT_SUPERVISOR">Supervisor Actions</option>
            <option value="FIELD_OFFICER">Field Officer Actions</option>
            <option value="CITIZEN">Citizen Actions</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading audit records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No audit logs found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor / Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Action Type</th>
                  <th className="px-5 py-3">Target Entity</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {log.userEmail}
                    </td>
                    <td className="px-5 py-3.5">
                      {getRoleBadge(log.role)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800 text-[11px]">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[11px] px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                        {log.entityType} ({log.entityId})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs max-w-md leading-relaxed">
                      {log.description}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-400">
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
  );
};

export default AuditLogs;
