import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import ActionMenu from '../../components/ActionMenu';

export const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [formData, setFormData] = useState({
    serviceCode: '',
    serviceName: '',
    description: '',
    departmentId: '',
    requiredDocuments: 'Registered Sale Deed, Encumbrance Certificate, Identity Proof',
    processingDays: 7,
    feeInr: 150,
    active: true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [svcRes, deptRes] = await Promise.all([
        api.get('/api/services/admin/all'),
        api.get('/api/admin/departments'),
      ]);
      setServices(svcRes.data || []);
      setDepartments(deptRes.data || []);
      if (deptRes.data?.length > 0) {
        setFormData(prev => ({ ...prev, departmentId: deptRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      serviceCode: '',
      serviceName: '',
      description: '',
      departmentId: departments[0]?.id?.toString() || '',
      requiredDocuments: 'Registered Sale Deed, Encumbrance Certificate, Identity Proof',
      processingDays: 7,
      feeInr: 150,
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (svc) => {
    setEditingService(svc);
    setFormData({
      serviceCode: svc.serviceCode,
      serviceName: svc.serviceName,
      description: svc.description || '',
      departmentId: svc.departmentId.toString(),
      requiredDocuments: svc.requiredDocuments || '',
      processingDays: svc.processingDays || 7,
      feeInr: svc.feeInr || 0,
      active: svc.active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      ...formData,
      departmentId: parseInt(formData.departmentId),
      processingDays: parseInt(formData.processingDays),
      feeInr: parseFloat(formData.feeInr),
    };

    try {
      if (editingService) {
        await api.put(`/api/services/${editingService.id}`, payload);
      } else {
        await api.post('/api/services', payload);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this service from the public catalog?')) return;
    try {
      await api.delete(`/api/services/${id}`);
      loadData();
    } catch (err) {
      alert('Failed to delete service');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Government Service Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin management of digital land services, statutory SLAs, document prerequisites, and fees.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto shadow-md shadow-blue-700/20"
        >
          <Plus className="w-4 h-4" /> Add Service to Catalog
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading government services catalog...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Service Name</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">SLA Days</th>
                  <th className="px-5 py-3">Fee (INR)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {svc.serviceCode}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{svc.serviceName}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{svc.description}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800">
                      {svc.departmentName}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-700">
                      {svc.processingDays} Days
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      ₹{svc.feeInr}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${svc.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {svc.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ActionMenu
                        items={[
                          {
                            label: 'Edit',
                            icon: Edit,
                            iconColor: 'text-blue-600',
                            onClick: () => handleOpenEdit(svc)
                          },
                          {
                            label: 'Delete',
                            icon: Trash2,
                            danger: true,
                            onClick: () => handleDelete(svc.id)
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingService ? 'Edit Government Service' : 'Add New Service to Catalog'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Service Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingService}
                    value={formData.serviceCode}
                    onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase font-mono disabled:bg-slate-100"
                    placeholder="SRV-LOC-09"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="e.g. Land Ownership Certificate (Patta)"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Required Documents (Comma-separated)</label>
                <input
                  type="text"
                  value={formData.requiredDocuments}
                  onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Processing SLA (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.processingDays}
                    onChange={(e) => setFormData({ ...formData, processingDays: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Statutory Fee (INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.feeInr}
                    onChange={(e) => setFormData({ ...formData, feeInr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-md shadow-blue-700/20"
                >
                  {saving ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServiceManagement;
