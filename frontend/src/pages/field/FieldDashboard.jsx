import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckSquare, Clock, MapPin, Camera, CheckCircle2,
  AlertTriangle, Navigation, Upload, X, ShieldCheck,
  FileCheck, ArrowRight, Eye, Search, Filter, LayoutDashboard,
  Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import ActionMenu from '../../components/ActionMenu';
import { enqueueOfflineAction } from '../../services/indexedDbService';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const FieldDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAssignmentsPage = location.pathname.includes('/assignments');
  const { isOnline, refreshQueueCount } = useOnlineStatus();

  const [stats, setStats] = useState(null);
  const [assignedApps, setAssignedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Verification Form Modal
  const [activeInspectionApp, setActiveInspectionApp] = useState(null);
  const [gpsVerified, setGpsVerified] = useState(true);
  const [boundaryMatch, setBoundaryMatch] = useState(true);
  const [encroachment, setEncroachment] = useState(false);
  const [verificationResult, setVerificationResult] = useState('VERIFIED_COMPLIANT');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800');
  const [officerRemarks, setOfficerRemarks] = useState('On-site inspection completed. Physical boundary stones numbered 1 to 4 intact. No encroachment onto government poramboke land or public roads.');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFieldData();
  }, []);

  const loadFieldData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes] = await Promise.all([
        api.get('/api/field/stats'),
        api.get('/api/field/assignments'),
      ]);
      setStats(statsRes.data);
      setAssignedApps(appsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingApps = assignedApps.filter(a => a.status === 'FIELD_VERIFICATION');
  const completedApps = assignedApps.filter(a => a.status !== 'FIELD_VERIFICATION');

  const filteredApps = assignedApps.filter(app => {
    if (statusFilter === 'PENDING' && app.status !== 'FIELD_VERIFICATION') return false;
    if (statusFilter === 'COMPLETED' && app.status === 'FIELD_VERIFICATION') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchApp = app.applicationNumber?.toLowerCase().includes(q);
      const matchName = app.citizenName?.toLowerCase().includes(q);
      const matchUlpin = app.parcel?.ulpin?.toLowerCase().includes(q);
      const matchVillage = app.parcel?.village?.toLowerCase().includes(q);
      return matchApp || matchName || matchUlpin || matchVillage;
    }
    return true;
  });

  const handleOpenInspection = (app) => {
    setActiveInspectionApp(app);
    setOfficerRemarks(`Physical survey conducted on site for parcel ${app.parcel?.ulpin} (Survey: ${app.parcel?.surveyNumber}). Cadastral boundary markers checked with DGPS. No encroachment.`);
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!activeInspectionApp) return;

    setSubmitting(true);
    const payload = {
      applicationId: activeInspectionApp.id,
      gpsLatitude: activeInspectionApp.parcel?.latitude,
      gpsLongitude: activeInspectionApp.parcel?.longitude,
      gpsCoordinatesVerified: gpsVerified,
      boundaryMatchesRecord: boundaryMatch,
      encroachmentDetected: encroachment,
      remarks: officerRemarks,
      photoUrls: photoUrl,
      verificationResult,
    };

    try {
      if (!isOnline) {
        await enqueueOfflineAction('FIELD_VERIFICATION', payload);
        await refreshQueueCount();
        alert('Verification report saved to IndexedDB offline queue! It will synchronize when connection is restored.');
      } else {
        await api.post('/api/field/verification', payload);
      }
      setActiveInspectionApp(null);
      loadFieldData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit site verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            {isAssignmentsPage ? 'Inspection Worklist' : 'Field Operations Dashboard'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isAssignmentsPage ? 'Assigned Cadastral Inspections' : `Officer ${user?.fullName || 'Vikramaditya Rao'}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {isAssignmentsPage
              ? 'Allocated cadastral parcel verification cases requiring on-site DGPS inspection and physical boundary markers survey.'
              : 'Physical DGPS survey operations, boundary peg verification, and multi-department ground truth coordination.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/map"
            className="px-4 py-2 bg-teal-600/90 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-lg shadow-teal-900/30"
          >
            <MapPin className="w-4 h-4" />
            Cadastral GIS Map
          </Link>
          {isAssignmentsPage ? (
            <Link
              to="/field"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 border border-white/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              View Dashboard
            </Link>
          ) : (
            <Link
              to="/field/assignments"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 border border-white/20"
            >
              <CheckSquare className="w-4 h-4" />
              View Worklist ({pendingApps.length})
            </Link>
          )}
        </div>
      </div>

      {/* 4 Metric KPI Cards (Dashboard Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Allocated</p>
            <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{assignedApps.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Cadastral parcels</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Field Visits</p>
            <p className="text-2xl font-black text-amber-600 mt-1 font-mono">{pendingApps.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Requires physical survey</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Reports Submitted</p>
            <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">{completedApps.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Dossiers completed</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Device & Sync</p>
            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {isOnline ? 'Online • Ready' : 'Offline Queue'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">DGPS GPS & Camera active</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            {isOnline ? <Wifi className="w-5 h-5 text-emerald-600" /> : <WifiOff className="w-5 h-5 text-amber-600" />}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isAssignmentsPage ? 'Allocated Cadastral Survey Cases' : 'Inspection Tasks Overview'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAssignmentsPage
                ? 'Field verification queue prioritized by pending inspection status.'
                : 'Summary list of active survey allocations and submitted dossiers.'}
            </p>
          </div>

          {/* Search & Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({assignedApps.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Needs Visit ({pendingApps.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Completed ({completedApps.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ULPIN, App No..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading assigned inspections...
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No inspection tasks match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[140px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">App Number</th>
                  <th className="px-5 py-3">Citizen</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Parcel ULPIN</th>
                  <th className="px-5 py-3">Location & Coordinates</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {app.applicationNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{app.citizenName}</p>
                      <p className="text-[11px] text-slate-400">{app.citizenMobile}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 font-semibold">
                      {app.service?.serviceName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-blue-700">
                      <Link to={`/map?search=${app.parcel?.ulpin}`} className="hover:underline flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {app.parcel?.ulpin}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-800">{app.parcel?.village}, {app.parcel?.district}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {app.parcel?.latitude?.toFixed(4)}, {app.parcel?.longitude?.toFixed(4)}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ActionMenu
                        items={[
                          ...(app.status === 'FIELD_VERIFICATION' ? [{
                            label: 'Inspect',
                            icon: Camera,
                            iconColor: 'text-teal-600',
                            onClick: () => handleOpenInspection(app)
                          }] : []),
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

      {/* Field Inspection Report Modal */}
      {activeInspectionApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">

            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Submit Cadastral Site Verification Report</h3>
                <p className="text-[11px] text-teal-200">
                  Case: {activeInspectionApp.applicationNumber} • ULPIN: {activeInspectionApp.parcel?.ulpin}
                </p>
              </div>
              <button onClick={() => setActiveInspectionApp(null)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVerification} className="p-6 space-y-4 text-xs">

              {/* GPS Coordinates Check */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-teal-600" />
                    On-Site Differential GPS Check
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 font-bold">
                    LAT: {activeInspectionApp.parcel?.latitude?.toFixed(4)}, LNG: {activeInspectionApp.parcel?.longitude?.toFixed(4)}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={gpsVerified}
                    onChange={(e) => setGpsVerified(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-slate-700">Handheld DGPS reading matches digitized cadastral survey bounds within ±0.2m</span>
                </label>
              </div>

              {/* Physical Boundary Checklist */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Physical Boundary Checklist
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="p-3 rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer bg-slate-50">
                    <input
                      type="checkbox"
                      checked={boundaryMatch}
                      onChange={(e) => setBoundaryMatch(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Boundary stones match FMB sketch</span>
                  </label>

                  <label className="p-3 rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer bg-slate-50">
                    <input
                      type="checkbox"
                      checked={encroachment}
                      onChange={(e) => setEncroachment(e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span className="text-red-700 font-semibold">Encroachment detected</span>
                  </label>
                </div>
              </div>

              {/* Verification Determination */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Verification Determination
                </label>
                <select
                  value={verificationResult}
                  onChange={(e) => setVerificationResult(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  <option value="VERIFIED_COMPLIANT">VERIFIED_COMPLIANT — Clear Boundary & No Violations</option>
                  <option value="DISCREPANCY_FOUND">DISCREPANCY_FOUND — Minor Area / Marker Discrepancy</option>
                  <option value="ENCROACHMENT_FLAGGED">ENCROACHMENT_FLAGGED — Boundary Encroachment on Public Land</option>
                </select>
              </div>

              {/* Photo Simulation */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Geotagged Site Inspection Photograph
                </label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <img
                    src={photoUrl}
                    alt="Inspection preview"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">DGPS_Survey_Photo_Selaiyur_Peg1.jpg</p>
                    <p className="text-[10px] text-slate-500 font-mono">Geotag: 12.9249°N, 80.1472°E • Verified timestamp</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Officer Inspection Remarks
                </label>
                <textarea
                  rows={3}
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveInspectionApp(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/20"
                >
                  {submitting ? 'Submitting Report...' : 'Submit Verification Report'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FieldDashboard;
