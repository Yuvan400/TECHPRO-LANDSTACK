import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getStateBySlug, INDIA_STATES } from '../data/indiaMapData';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';
import {
  ArrowLeft, MapPin, Building2, Layers, Sparkles,
  CheckCircle2, Search, FileText, ArrowRight, Shield,
  Globe, Compass, Check, AlertCircle, ExternalLink
} from 'lucide-react';

export const StatePortal = () => {
  const { stateId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();

  const [stateData, setStateData] = useState(() => getStateBySlug(stateId) || INDIA_STATES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const found = getStateBySlug(stateId);
    if (found) {
      setStateData(found);
      localStorage.setItem('landstack_selected_state', JSON.stringify(found));
    }
  }, [stateId]);

  const handleStateChange = (newSlug) => {
    navigate(`/state/${newSlug}`);
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50 flex flex-col font-['Inter',sans-serif]">
      {/* Top Breadcrumb & Language Switcher Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('back_to_map') || 'Back to National Map'}</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span>/</span>
              <span className="text-slate-500">States & UTs</span>
              <span>/</span>
              <span className="font-bold text-slate-900">{stateData.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick State Switcher Dropdown */}
            <select
              value={stateData.slug}
              onChange={(e) => handleStateChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              {INDIA_STATES.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.code} - {s.name} ({s.type === 'State' ? 'State' : 'UT'})
                </option>
              ))}
            </select>

            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Main State Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/30 text-blue-200 border border-blue-400/30 font-mono">
                CODE: {stateData.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {stateData.type}
              </span>
              <span className="text-xs text-slate-400">
                LGD Code: {stateData.lgdCode || '33'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-white">
              {stateData.name}
            </h1>

            <p className="text-sm text-blue-200/90 font-medium max-w-2xl flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Official Land Administration Authority: <strong>{stateData.portalName}</strong>
              </span>
            </p>
          </div>

          {/* Quick Action Button to Sign In / Apply */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition"
            >
              <span>{t('login_for_state') || `Sign In to ${stateData.code} Desk`}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to={isAuthenticated ? "/services" : "/login"}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition"
            >
              <span>Apply for Services</span>
            </Link>
          </div>
        </div>
      </div>

      {/* State Land Governance Metrics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t('total_parcels') || 'Total Cadastral Parcels'}
            </p>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono">
              {stateData.parcelsCount}
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Digitally Indexed
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t('ulpin_coverage') || 'Bhu-Aadhaar ULPIN'}
            </p>
            <p className="text-xl font-black text-blue-700 mt-1 font-mono">
              {stateData.ulpinCoverage}
            </p>
            <p className="text-[10px] text-blue-600 font-semibold mt-1">
              Standard 14-digit Digital Peg
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Capital Headquarters
            </p>
            <p className="text-lg font-black text-slate-900 mt-1 truncate">
              {stateData.capital}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">
              Principal Revenue Secretariat
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Integrated Departments
            </p>
            <p className="text-xl font-black text-indigo-700 mt-1 font-mono">
              10 / 10
            </p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
              Live Interoperability
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Cadastral Search Box */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="max-w-2xl">
            <h2 className="text-lg font-black text-slate-900">
              Search Land Records in {stateData.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Query canonical land parcels using 14-digit ULPIN, Survey Number, or Revenue Village.
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${stateData.name} parcel by ULPIN (e.g. ${stateData.lgdCode || '33'}TN...), Survey No (e.g. 124/3B)...`}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? `/map?search=${encodeURIComponent(searchQuery)}` : '/login')}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <span>Inspect on Cadastral Map</span>
              <Compass className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 8 Statutory Statutory Services Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Statutory Citizen Services in {stateData.name}
              </h3>
              <p className="text-xs text-slate-500">
                Direct online lifecycle application with immutable digital audit trail
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Land Ownership Certificate (Patta / RoR)',
                dept: 'Revenue & Disaster Management',
                tat: '7 Days',
                fee: '₹100',
                desc: 'Official certified Record of Rights proving lawful land ownership and cadastral extent.'
              },
              {
                title: 'Title Mutation & Name Transfer',
                dept: 'Registration & Stamp Revenue',
                tat: '15 Days',
                fee: '₹250',
                desc: 'Transfer of title in Jamabandi registers following purchase deed or legal succession.'
              },
              {
                title: 'Non-Encumbrance Certificate (EC)',
                dept: 'Registration & Stamp Revenue',
                tat: '1 Day (Instant)',
                fee: '₹50',
                desc: 'Certified search of 30-year registered financial charges, liens, or court mortgages.'
              },
              {
                title: 'Land-Use Conversion NOC',
                dept: 'Town & Country Planning',
                tat: '21 Days',
                fee: '₹1,500',
                desc: 'Statutory permission to convert agricultural land to residential or commercial use.'
              },
              {
                title: 'Cadastral Field Survey & Sub-Division',
                dept: 'Survey & Settlement',
                tat: '10 Days',
                fee: '₹500',
                desc: 'On-site DGPS boundary demarcation and Field Measurement Book (FMB) pegging.'
              },
              {
                title: 'Municipal Property Assessment NOC',
                dept: 'Urban Local Bodies (ULB)',
                tat: '5 Days',
                fee: '₹200',
                desc: 'Verification of municipal building tax assessment and local utility drainage NOCs.'
              }
            ].map((srv, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition group flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {srv.dept}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition">
                    {srv.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">TAT: <strong>{srv.tat}</strong></span>
                  <Link
                    to={isAuthenticated ? "/services/apply" : "/login"}
                    className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                  >
                    Apply Now
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatePortal;
