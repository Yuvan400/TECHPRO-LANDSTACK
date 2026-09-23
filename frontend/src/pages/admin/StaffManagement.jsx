import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Building, Key, Power,
  Search, CheckCircle2, AlertCircle, X, Edit, Eye, UserCheck, UserX
} from 'lucide-react';
import api from '../../services/api';
import ActionMenu from '../../components/ActionMenu';

export const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: 'Demo@123',
    mobile: '',
    role: 'DEPARTMENT_SUPERVISOR',
    departmentId: '',
    designation: '',
    employeeCode: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, deptsRes] = await Promise.all([
        api.get('/api/admin/staff'),
        api.get('/api/admin/departments'),
      ]);
      setStaff(staffRes.data || []);
      setDepartments(deptsRes.data || []);
      if (deptsRes.data?.length > 0) {
        setFormData(prev => ({ ...prev, departmentId: deptsRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);

    try {
      await api.post('/api/admin/staff', {
        ...formData,
        departmentId: parseInt(formData.departmentId),
      });
      setShowCreateModal(false);
      setFormData({
        fullName: '',
        email: '',
        password: 'Demo@123',
        mobile: '',
        role: 'DEPARTMENT_SUPERVISOR',
        departmentId: departments[0]?.id?.toString() || '',
        designation: '',
        employeeCode: '',
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create staff account');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/api/admin/staff/${id}/toggle-status`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const filtered = staff.filter(
    s => s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
         s.email?.toLowerCase().includes(search.toLowerCase()) ||
         s.departmentName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Government Staff Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin onboarding for Department Supervisors and Cadastral Field Verification Officers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto shadow-md shadow-red-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Onboard New Official
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 max-w-md">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, official email, or department..."
          className="w-full text-xs bg-transparent focus:outline-none"
        />
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading government officials directory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Official</th>
                  <th className="px-5 py-3">Role Hierarchy</th>
                  <th className="px-5 py-3">Assigned Department</th>
                  <th className="px-5 py-3">Designation / Code</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{u.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        u.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                        u.role === 'DEPARTMENT_SUPERVISOR' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-teal-50 text-teal-700 border-teal-200'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800">
                      {u.departmentName || <span className="text-slate-400 italic">Universal Apex</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-900 font-medium">{u.designation || 'Officer'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{u.employeeCode || 'N/A'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.role !== 'ADMIN' ? (
                        <ActionMenu
                          items={[
                            u.active ? {
                              label: 'Deactivate',
                              icon: UserX,
                              danger: true,
                              onClick: () => handleToggleStatus(u.id)
                            } : {
                              label: 'Activate',
                              icon: UserCheck,
                              iconColor: 'text-emerald-600',
                              onClick: () => handleToggleStatus(u.id)
                            }
                          ]}
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Onboard Government Official</h3>
                <p className="text-[11px] text-slate-300">Create supervisor or field officer account and link department</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                    placeholder="e.g. Suresh Patel"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                    placeholder="suresh@landstack.gov.in"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Role Hierarchy</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    <option value="DEPARTMENT_SUPERVISOR">Department Supervisor</option>
                    <option value="FIELD_OFFICER">Field Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Assigned Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                    placeholder="e.g. Senior Cadastral Officer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                    placeholder="e.g. REV-FLD-701"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none"
                    placeholder="+91 98765 00000"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20"
                >
                  {modalLoading ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffManagement;
