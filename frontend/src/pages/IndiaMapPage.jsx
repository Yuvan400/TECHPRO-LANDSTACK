import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { INDIA_STATES } from '../data/indiaMapData';
import IndiaMap from '../components/IndiaMap';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Search, MapPin, Building2, Layers, Sparkles,
  ArrowRight, ArrowLeft, CheckCircle2, Shield,
  Globe, Compass, Check, X, Filter
} from 'lucide-react';

export const IndiaMapPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();

  // Selected state from localStorage or default to Tamil Nadu
  const [selectedState, setSelectedState] = useState(() => {
    try {
      const saved = localStorage.getItem('landstack_selected_state');
      return saved ? JSON.parse(saved) : INDIA_STATES.find(s => s.code === 'TN') || INDIA_STATES[0];
    } catch {
      return INDIA_STATES.find(s => s.code === 'TN') || INDIA_STATES[0];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'STATE' | 'UT'

  // Update selected state and save to localStorage
  const handleSelectState = (state) => {
    setSelectedState(state);
    if (state) {
      localStorage.setItem('landstack_selected_state', JSON.stringify(state));
    }
  };

  // Search matching state IDs for live SVG map highlighting
  const { searchHighlightedIds, searchMatches } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { searchHighlightedIds: [], searchMatches: [] };
    }

    const matches = INDIA_STATES.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.capital.toLowerCase().includes(q) ||
      s.portalName.toLowerCase().includes(q)
    );

    return {
      searchHighlightedIds: matches.map(m => m.id),
      searchMatches: matches
    };
  }, [searchQuery]);

  // When search yields a single exact or top match, automatically focus on it
  useEffect(() => {
    if (searchMatches.length === 1) {
      setSelectedState(searchMatches[0]);
    }
  }, [searchMatches]);

  const filteredStatesList = useMemo(() => {
    return INDIA_STATES.filter(state => {
      if (filterType === 'STATE') return state.type === 'State';
      if (filterType === 'UT') return state.type === 'Union Territory';
      return true;
    });
  }, [filterType]);

  const handleDashboardRedirect = () => {
    if (user?.role === 'ADMIN') navigate('/admin');
    else if (user?.role === 'DEPARTMENT_SUPERVISOR') navigate('/supervisor');
    else if (user?.role === 'FIELD_OFFICER') navigate('/field');
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50 flex flex-col font-['Inter',sans-serif]">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>

            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="font-mono text-blue-700">LandStack</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="hidden sm:inline text-xs font-bold text-slate-600">
                  National Cadastral Map (28 States & 8 UTs)
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleDashboardRedirect}
                className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Language Selector (22 Indian Languages + English) */}
            <LanguageSelector />
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        
        {/* Prominent Search Bar with Live Highlighting Feedback */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any Indian State or UT to highlight on map (e.g. Tamil Nadu, Maharashtra, Delhi, Punjab)..."
                className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-slate-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full md:w-auto justify-center">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All (36)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('STATE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterType === 'STATE'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                28 States
              </button>
              <button
                type="button"
                onClick={() => setFilterType('UT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterType === 'UT'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                8 UTs
              </button>
            </div>

          </div>

          {/* Search Result Feedback Indicator */}
          {searchQuery && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                {searchMatches.length > 0 
                  ? `${searchMatches.length} matching territory highlighted in amber on the map`
                  : 'No states found matching your search'}
              </span>

              {searchMatches.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelectState(m)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    selectedState?.id === m.id
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  }`}
                >
                  {m.name} ({m.code})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map & Selected State Info Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Center: Interactive SVG Map (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[580px]">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-extrabold text-slate-700">
                  Interactive Cadastral Map of India
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Selected State
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  Search Highlighted
                </span>
              </div>
            </div>

            <IndiaMap
              selectedState={selectedState}
              onSelectState={handleSelectState}
              searchHighlightedIds={searchHighlightedIds}
            />

            {/* Quick Horizontal Territory Chips */}
            <div className="w-full mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  All Territories ({filteredStatesList.length}):
                </span>
                <span className="text-[10px]">Click any chip to highlight on map</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                {filteredStatesList.map((state) => {
                  const isSelected = selectedState && selectedState.id === state.id;
                  const isSearchHit = searchHighlightedIds.includes(state.id);
                  return (
                    <button
                      key={state.id}
                      type="button"
                      onClick={() => handleSelectState(state)}
                      className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold'
                          : isSearchHit
                          ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono text-[10px] opacity-75 mr-1">{state.code}</span>
                      {state.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected State Details Panel (4 cols) - NO ENTER STATE PORTAL BUTTON */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Selected State Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
              
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Selected State:
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                      {selectedState?.code}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {selectedState?.name}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700">
                    {selectedState?.type}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-700/20 shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* State Parameters */}
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Official Land Administration Portal
                  </span>
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedState?.portalName}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Capital
                    </span>
                    <p className="font-extrabold text-slate-900 mt-0.5 truncate">
                      {selectedState?.capital}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      LGD Code
                    </span>
                    <p className="font-mono font-extrabold text-slate-900 mt-0.5">
                      {selectedState?.lgdCode || '33'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Total Parcels
                    </span>
                    <p className="font-mono font-extrabold text-emerald-900 mt-0.5">
                      {selectedState?.parcelsCount}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                      Bhu-Aadhaar
                    </span>
                    <p className="font-mono font-extrabold text-blue-900 mt-0.5">
                      {selectedState?.ulpinCoverage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Note (No Enter Button as requested) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{selectedState?.name}</strong> is active in LandStack with full 10-department cadastral interoperability.
                </span>
              </div>

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleDashboardRedirect}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to {selectedState?.code} Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Sign In to {selectedState?.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

            </div>

            {/* Statutory Overview Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Integrated Cadastral Features
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  14-Digit ULPIN (Bhu-Aadhaar) Resolution
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Live DGPS Physical Boundary Verification
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  30-Year Digital Encumbrance Registry
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  Instant Patta / Record of Rights Tracking
                </li>
              </ul>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-400 font-mono">
        LandStack Smart Land Governance Platform • National Cadastral Repository
      </footer>
    </div>
  );
};

export default IndiaMapPage;
