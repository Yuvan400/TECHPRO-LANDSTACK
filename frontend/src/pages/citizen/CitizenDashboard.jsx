import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShieldCheck, Landmark, Map as MapIcon,
  FileText, Trees, Building2, Wrench, Leaf, Zap, Compass,
  ChevronRight, ChevronLeft, X, CheckCircle2, AlertCircle, Eye, Check, Clock, Car
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getDepartmentDataForParcel } from '../../utils/departmentDataGenerator';
import StatusBadge from '../../components/StatusBadge';
import PattaApplicationWorkflow from '../../components/PattaApplicationWorkflow';
import EcApplicationWorkflow from '../../components/EcApplicationWorkflow';
import LandConversionWorkflow from '../../components/LandConversionWorkflow';
import PropertyMutationWorkflow from '../../components/PropertyMutationWorkflow';
import BuildingPermissionWorkflow from '../../components/BuildingPermissionWorkflow';
import DgpsSurveyWorkflow from '../../components/DgpsSurveyWorkflow';
import PropertyTaxKhataWorkflow from '../../components/PropertyTaxKhataWorkflow';
import WaterSewerageNocWorkflow from '../../components/WaterSewerageNocWorkflow';
import ZoningReclassificationWorkflow from '../../components/ZoningReclassificationWorkflow';
import HighwayAccessSetbackWorkflow from '../../components/HighwayAccessSetbackWorkflow';
import ForestClearanceWorkflow from '../../components/ForestClearanceWorkflow';
import ElectricalNocWorkflow from '../../components/ElectricalNocWorkflow';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search & Parcel States
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [resolvedParcel, setResolvedParcel] = useState(null);
  const [resolvedUlpin, setResolvedUlpin] = useState('');
  const [resolvedData, setResolvedData] = useState(null);
  const [allParcels, setAllParcels] = useState([]);

  // Applications History State
  const [applications, setApplications] = useState([]);

  // Department Modal State
  const [activeDeptModal, setActiveDeptModal] = useState(null);

  // Dedicated Application Workflow State: null | 'patta' | 'ec' | 'land-conversion'
  const [activeWorkflow, setActiveWorkflow] = useState(null);

  // 10 Statutory Government Departments Definition
  const DEPARTMENTS = [
    {
      id: 'revenue',
      number: 'Dept 01',
      title: 'Revenue Department',
      availabilityText: 'Land record & Patta information available',
      icon: Landmark,
      color: 'blue',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
      borderHover: 'hover:border-blue-500'
    },
    {
      id: 'survey',
      number: 'Dept 02',
      title: 'Survey & Land Records',
      availabilityText: 'Cadastral geodetic & FMB data available',
      icon: MapIcon,
      color: 'indigo',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      borderHover: 'hover:border-indigo-500'
    },
    {
      id: 'registration',
      number: 'Dept 03',
      title: 'Registration Department',
      availabilityText: 'Registration & encumbrance information available',
      icon: FileText,
      color: 'emerald',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      borderHover: 'hover:border-emerald-500'
    },
    {
      id: 'agriculture',
      number: 'Dept 04',
      title: 'Agriculture Department',
      availabilityText: 'Crop, soil taxonomy & irrigation data available',
      icon: Trees,
      color: 'lime',
      badgeBg: 'bg-lime-50 text-lime-800 border-lime-200',
      iconBg: 'bg-lime-600 text-white',
      borderHover: 'hover:border-lime-500'
    },
    {
      id: 'localBodies',
      number: 'Dept 05',
      title: 'Local Bodies / Rural Development',
      availabilityText: 'Assessment, ward & property tax data available',
      icon: Building2,
      color: 'purple',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
      borderHover: 'hover:border-purple-500'
    },
    {
      id: 'municipal',
      number: 'Dept 06',
      title: 'Municipal Administration',
      availabilityText: 'Civic utilities & building permission data available',
      icon: Building2,
      color: 'teal',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
      iconBg: 'bg-teal-600 text-white',
      borderHover: 'hover:border-teal-500'
    },
    {
      id: 'pwd',
      number: 'Dept 07',
      title: 'Public Works Department (PWD)',
      availabilityText: 'Infrastructure, right of way & canal buffer available',
      icon: Wrench,
      color: 'amber',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
      borderHover: 'hover:border-amber-500'
    },
    {
      id: 'environment',
      number: 'Dept 08',
      title: 'Environment & Forest Department',
      availabilityText: 'CRZ, eco-sensitive zone & environmental clearance available',
      icon: Leaf,
      color: 'cyan',
      badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      iconBg: 'bg-cyan-600 text-white',
      borderHover: 'hover:border-cyan-500'
    },
    {
      id: 'electricity',
      number: 'Dept 09',
      title: 'Electricity Department',
      availabilityText: 'Power connection & grid corridor information available',
      icon: Zap,
      color: 'yellow',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-slate-950',
      borderHover: 'hover:border-yellow-500'
    },
    {
      id: 'planning',
      number: 'Dept 10',
      title: 'Town & Country Planning',
      availabilityText: 'Master plan zoning, FSI & setback parameters available',
      icon: Compass,
      color: 'rose',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-600 text-white',
      borderHover: 'hover:border-rose-500'
    }
  ];

  // Pre-load parcel dataset cache & applications
  useEffect(() => {
    loadParcelsCache();
    loadApplications();
  }, [user]);

  const loadParcelsCache = async () => {
    try {
      const res = await api.get('/api/parcels');
      if (res.data && res.data.length > 0) {
        setAllParcels(res.data);
      }
    } catch (err) {
      console.error('Failed to pre-cache parcels:', err);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await api.get('/api/applications/citizen');
      if (res.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error('Failed to load citizen applications:', err);
    }
  };

  // Search Engine: Resolves Survey Number or ULPIN and renders all 10 departments
  const executeSearch = async (queryText) => {
    const term = (queryText || '').trim();

    // Validation: Empty check
    if (!term) {
      setSearchError('Please enter a Survey Number or ULPIN.');
      setResolvedParcel(null);
      setResolvedUlpin('');
      setResolvedData(null);
      setActiveWorkflow(null);
      return;
    }

    setSearching(true);
    setSearchError('');
    setActiveWorkflow(null);

    try {
      let foundParcel = null;
      const lower = term.toLowerCase().replace(/\s+/g, '');

      // 1. Check in loaded parcels list first (exact or partial match)
      if (allParcels && allParcels.length > 0) {
        const localMatch = allParcels.find(p => {
          const pUlpin = (p.ulpin || '').toLowerCase().replace(/\s+/g, '');
          const pSurvey = (p.surveyNumber || '').toLowerCase().replace(/\s+/g, '');
          return pUlpin === lower || pSurvey === lower || pUlpin.includes(lower) || pSurvey.includes(lower);
        });
        if (localMatch) foundParcel = localMatch;
      }

      // 2. Query backend search API if not matched locally
      if (!foundParcel) {
        const res = await api.get(`/api/parcels/search?q=${encodeURIComponent(term)}`);
        if (res.data && res.data.length > 0) {
          foundParcel = res.data[0];
        } else {
          // 3. Try direct ULPIN lookup endpoint
          try {
            const directRes = await api.get(`/api/parcels/${encodeURIComponent(term)}`);
            if (directRes.data && directRes.data.ulpin) {
              foundParcel = directRes.data;
            }
          } catch (_) {
            // Not found via direct endpoint
          }
        }
      }

      // If no record found
      if (!foundParcel) {
        setSearchError('No land record found for the entered ULPIN/Survey Number.');
        setResolvedParcel(null);
        setResolvedUlpin('');
        setResolvedData(null);
        return;
      }

      // Resolve ULPIN and fetch 10-department data
      const ulpin = foundParcel.ulpin;
      const data = getDepartmentDataForParcel(foundParcel);

      setResolvedParcel(foundParcel);
      setResolvedUlpin(ulpin);
      setResolvedData(data);
      setSearchError('');
    } catch (err) {
      console.error('Search request failed:', err);
      setSearchError('No land record found for the entered ULPIN/Survey Number.');
      setResolvedParcel(null);
      setResolvedUlpin('');
      setResolvedData(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    executeSearch(searchQuery);
  };

  // Department navigation inside modal
  const navigateDept = (direction) => {
    const currentIndex = DEPARTMENTS.findIndex(d => d.id === activeDeptModal);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + direction + DEPARTMENTS.length) % DEPARTMENTS.length;
    setActiveDeptModal(DEPARTMENTS[nextIndex].id);
  };

  const activeDeptObj = DEPARTMENTS.find(d => d.id === activeDeptModal);

  // Helper to get parameters array for a given department
  const getParamsForDept = (deptId) => {
    if (!resolvedData || !resolvedData[deptId]) return [];
    return resolvedData[deptId].parameters || [];
  };

  // Helper for badge rendering
  const renderBadge = (badge, badgeColor) => {
    if (!badge) return null;
    let colors = 'bg-slate-100 text-slate-700 border-slate-200';
    if (badgeColor === 'green') colors = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (badgeColor === 'amber') colors = 'bg-amber-100 text-amber-800 border-amber-300';
    if (badgeColor === 'red') colors = 'bg-red-100 text-red-800 border-red-300';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${colors}`}>
        {badge}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* DEDICATED WORKFLOWS: Rendered when Patta, EC, or Land Conversion service is selected */}
      {activeWorkflow === 'patta' && resolvedParcel ? (
        <PattaApplicationWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'ec' && resolvedParcel ? (
        <EcApplicationWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'land-conversion' && resolvedParcel ? (
        <LandConversionWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'property-mutation' && resolvedParcel ? (
        <PropertyMutationWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'building-permission' && resolvedParcel ? (
        <BuildingPermissionWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'dgps-survey' && resolvedParcel ? (
        <DgpsSurveyWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'property-tax-khata' && resolvedParcel ? (
        <PropertyTaxKhataWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'water-sewerage-noc' && resolvedParcel ? (
        <WaterSewerageNocWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'zoning-reclassification' && resolvedParcel ? (
        <ZoningReclassificationWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'highway-noc' && resolvedParcel ? (
        <HighwayAccessSetbackWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'forest-clearance' && resolvedParcel ? (
        <ForestClearanceWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : activeWorkflow === 'electrical-noc' && resolvedParcel ? (
        <ElectricalNocWorkflow
          parcel={resolvedParcel}
          deptData={resolvedData}
          user={user}
          onBack={() => setActiveWorkflow(null)}
          onSuccess={(newApp) => {
            loadApplications();
            setActiveWorkflow(null);
          }}
        />
      ) : (
        <>
          {/* 1. WELCOME SECTION */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Verified Citizen Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome, {user?.fullName || 'Citizen'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Search land records by Survey Number or ULPIN (Bhu-Aadhaar) to access unified statutory information across all 10 government departments.
              </p>
            </div>
          </div>

          {/* 2. SIMPLE LAND SEARCH SECTION */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Search Your Land
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Search land records using a Survey Number or ULPIN.
              </p>
            </div>

            {/* ONE Search Input & ONE Search Button */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Survey Number or ULPIN"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shrink-0"
              >
                {searching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Search</span>
              </button>
            </form>

            {/* Quick Sample ULPIN Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-medium">Quick Select Sample ULPINs:</span>
              {[
                { ulpin: '33TNCHN0000123456', label: 'Chennai / Tambaram (Karthik)' },
                { ulpin: '33TNKAN0000456789', label: 'Kanchipuram (Sriperumbudur)' },
                { ulpin: '33TNTAM0000234567', label: 'Chromepet (Residential)' }
              ].map((chip) => (
                <button
                  key={chip.ulpin}
                  type="button"
                  onClick={() => {
                    setSearchQuery(chip.ulpin);
                    executeSearch(chip.ulpin);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 rounded-lg border border-slate-200 transition font-mono text-[11px] font-semibold active:scale-95 flex items-center gap-1.5"
                >
                  <span className="text-blue-600 font-bold">#</span>
                  {chip.ulpin}
                  <span className="text-[10px] text-slate-400 font-sans font-normal">({chip.label})</span>
                </button>
              ))}
            </div>

            {/* Search Error Message */}
            {searchError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold">{searchError}</span>
              </div>
            )}
          </div>

          {/* 3. 10 DEPARTMENTS SECTION (Appears ONLY after successful search) */}
          {resolvedParcel && resolvedData && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Land Services & Departments
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select a department to view statutory services and apply online.
                  </p>
                </div>
              </div>

              {/* 10 Department Cards Grid (ONLY Departments, No Service Buttons) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {DEPARTMENTS.map((dept) => {
                  const Icon = dept.icon;

                  return (
                    <div
                      key={dept.id}
                      onClick={() => setActiveDeptModal(dept.id)}
                      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden ${dept.borderHover}`}
                    >
                      {/* Top Accent Line on Hover */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${dept.iconBg} group-hover:scale-110 transition-transform`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-mono font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {dept.number}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition leading-snug">
                          {dept.title}
                        </h4>

                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          {dept.availabilityText}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Available
                        </span>

                        <span className="text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          View Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. DEPARTMENT DETAILS MODAL */}
          {activeDeptModal && activeDeptObj && resolvedParcel && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start pt-16 sm:pt-20 pb-8 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col my-0">

                {/* Modal Header */}
                <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${activeDeptObj.iconBg}`}>
                      <activeDeptObj.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 bg-blue-600/30 text-blue-300 border border-blue-400/30 rounded">
                          {activeDeptObj.number}
                        </span>
                        <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                          {activeDeptObj.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {activeDeptObj.availabilityText}
                      </p>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setActiveDeptModal(null)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                  {/* Department Availability & Status Banner */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{activeDeptObj.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{activeDeptObj.availabilityText}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Available
                    </span>
                  </div>

                  {/* Department Statutory Information */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Verified Department Information
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Statutory Record Attributes
                      </span>
                    </div>

                    {/* Parameters Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 w-1/3">Parameter</th>
                          <th className="px-4 py-3">Statutory Value</th>
                          <th className="px-4 py-3 w-28 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {getParamsForDept(activeDeptObj.id).map((param, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-blue-50/40 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {param.label}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-900">
                              {param.value || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {param.badge ? (
                                renderBadge(param.badge, param.badgeColor || 'green')
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <Check className="w-3 h-3 text-emerald-600" /> Verified
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

                {/* Modal Navigation Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <button
                    onClick={() => navigateDept(-1)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Department
                  </button>

                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    {activeDeptObj.number} of 10 Departments
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigateDept(1)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      Next Department
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveDeptModal(null)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-sm active:scale-95"
                    >
                      Done
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 5. APPLICATION HISTORY & STATUS TRACKING SECTION */}
          {applications.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Application History & Status Tracking
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time lifecycle tracking for submitted Patta and land governance requests.
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 self-start sm:self-auto">
                  {applications.length} Application{applications.length > 1 ? 's' : ''} Submitted
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Application ID</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Type / Category</th>
                      <th className="px-4 py-3">ULPIN</th>
                      <th className="px-4 py-3">Survey Number</th>
                      <th className="px-4 py-3">Submission Date</th>
                      <th className="px-4 py-3">Current Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {applications.map((app) => {
                      // Extract specific type (Mutation Type, Transfer Type, Water Connection Type, Proposed Land Use, Application Type, Survey Type)
                      let subType = 'Standard';
                      const rem = app.citizenRemarks || '';
                      if (rem.includes('Transfer Type: ')) {
                        const m = rem.match(/Transfer Type:\s*([^|]+)/);
                        if (m) subType = m[1].trim();
                      } else if (rem.includes('Highway Type: ')) {
                        const m = rem.match(/Highway Type:\s*([^|]+)/);
                        if (m) subType = m[1].trim();
                      } else if (rem.includes('Proposed Land Use: ')) {
                        const m = rem.match(/Proposed Land Use:\s*([^|]+)/);
                        if (m) subType = m[1].trim();
                      } else if (rem.includes('Water: ')) {
                        const m = rem.match(/Water:\s*([^|(]+)/);
                        if (m) subType = m[1].trim();
                      } else if (rem.includes('HT Line: ')) {
                        const m = rem.match(/HT Line:\s*([^|(]+)/);
                        if (m) subType = m[1].trim();
                      } else if (rem.includes('Type: ')) {
                        const m = rem.match(/Type:\s*([^|]+)/);
                        if (m) subType = m[1].trim();
                      } else if (rem.includes('App Type: ')) {
                        const m = rem.match(/App Type:\s*([^|]+)/);
                        if (m) subType = m[1].trim();
                      } else if (app.service?.serviceCode === 'SRV-HWY-10' || app.service?.serviceName?.toLowerCase().includes('highway') || app.applicationNumber?.startsWith('HWY-')) {
                        subType = 'Highway Setback NOC';
                      } else if (app.service?.serviceCode === 'SRV-FOR-11' || app.service?.serviceName?.toLowerCase().includes('forest') || app.applicationNumber?.startsWith('FOR-')) {
                        subType = 'Forest & ESZ Clearance';
                      } else if (app.service?.serviceCode === 'SRV-ELEC-12' || app.service?.serviceName?.toLowerCase().includes('high-tension') || app.service?.serviceName?.toLowerCase().includes('electricity') || app.applicationNumber?.startsWith('ELEC-')) {
                        subType = 'HT Corridor Clearance';
                      } else if (app.service?.serviceCode === 'SRV-TAX-07' || app.service?.serviceName?.toLowerCase().includes('khata') || app.applicationNumber?.startsWith('KHT-')) {
                        subType = 'Khata Transfer';
                      } else if (app.service?.serviceCode === 'SRV-UTIL-08' || app.service?.serviceName?.toLowerCase().includes('water') || app.applicationNumber?.startsWith('WSN-')) {
                        subType = 'Water & Sewer NOC';
                      } else if (app.service?.serviceCode === 'SRV-TCP-09' || app.service?.serviceName?.toLowerCase().includes('zoning') || app.applicationNumber?.startsWith('ZON-')) {
                        subType = 'Zoning Reclassification';
                      } else if (app.service?.serviceCode === 'SRV-MUT-04' || app.service?.serviceName?.toLowerCase().includes('mutation')) {
                        subType = 'Sale / Transfer';
                      } else if (app.service?.serviceCode === 'SRV-BLD-05' || app.service?.serviceName?.toLowerCase().includes('building')) {
                        subType = 'Building Permission';
                      } else if (app.service?.serviceCode === 'SRV-SURV-06' || app.service?.serviceName?.toLowerCase().includes('demarcation')) {
                        subType = 'Boundary Demarcation';
                      } else if (app.service?.serviceCode === 'SRV-EC-02' || app.service?.serviceName?.toLowerCase().includes('encumbrance')) {
                        subType = 'Certified EC';
                      } else if (app.service?.serviceCode === 'SRV-CONV-03' || app.service?.serviceName?.toLowerCase().includes('conversion')) {
                        subType = 'Agricultural to Non-Agri';
                      } else if (app.service?.serviceCode === 'SRV-LOC-01' || app.service?.serviceName?.toLowerCase().includes('patta')) {
                        subType = 'Ownership Patta';
                      }

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3.5 font-mono font-black text-blue-700">
                            {app.applicationNumber}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {app.service?.serviceName || 'Statutory Land Service'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 inline-block whitespace-nowrap">
                              {subType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-700">
                            {app.parcel?.ulpin}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-700">
                            {app.parcel?.surveyNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-500">
                            {new Date(app.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => navigate(`/applications/${app.id}`)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 border border-slate-200"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default CitizenDashboard;
