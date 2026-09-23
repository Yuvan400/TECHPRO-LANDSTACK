import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, ArrowRight, Filter, Clock, Eye, MapPin } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ActionMenu from '../../components/ActionMenu';

export const ApplicationsList = () => {
  const [applications, setApplications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/applications/citizen');
      setApplications(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let list = applications;
    if (statusFilter !== 'ALL') {
      list = list.filter(a => a.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        a => a.applicationNumber.toLowerCase().includes(q) ||
             a.parcel?.ulpin.toLowerCase().includes(q) ||
             a.service?.serviceName.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [statusFilter, search, applications]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Application Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking for all submitted land governance requests.</p>
        </div>

        <Link
          to="/services"
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          Apply New Service
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, ULPIN, or Service..."
            className="w-full bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="FIELD_VERIFICATION">Field Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading applications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No matching applications found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">App Number</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Parcel ULPIN</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Applied On</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {app.applicationNumber}
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 font-semibold">
                      {app.service?.serviceName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-blue-700">
                      {app.parcel?.ulpin}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {app.departmentName}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {new Date(app.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ActionMenu
                        items={[
                          {
                            label: 'View',
                            icon: Eye,
                            iconColor: 'text-blue-600',
                            to: `/applications/${app.id}`
                          },
                          {
                            label: 'Map',
                            icon: MapPin,
                            iconColor: 'text-indigo-600',
                            to: `/map?search=${encodeURIComponent(app.parcel?.ulpin || '')}`
                          }
                        ]}
                      />
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

export default ApplicationsList;
