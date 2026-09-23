import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { INDIA_STATES } from '../data/indiaMapData';
import IndiaMap from './IndiaMap';
import {
  MapPin, Search, ArrowRight, CheckCircle2,
  Building2, Layers, Filter, Compass, Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const StateSelector = ({
  selectedState,
  onSelectState,
  onEnterState
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'STATE' | 'UT'

  const filteredStates = useMemo(() => {
    return INDIA_STATES.filter(state => {
      const matchesSearch = 
        state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.capital.toLowerCase().includes(searchQuery.toLowerCase()) ||
        state.portalName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filterType === 'STATE') return state.type === 'State';
      if (filterType === 'UT') return state.type === 'Union Territory';
      return true;
    });
  }, [searchQuery, filterType]);

  const handleEnter = () => {
    if (!selectedState) return;
    if (onEnterState) {
      onEnterState(selectedState);
    } else {
      // Navigate to state specific portal
      navigate(`/state/${selectedState.slug}`);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* 1. Header Banner with Selected State Display */}
      <div className="p-4 bg-gradient-to-r from-slate-50 via-blue-50/50 to-emerald-50/40 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-sm transition-colors ${
              selectedState ? 'bg-gradient-to-tr from-blue-700 to-indigo-600' : 'bg-slate-300'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('selected_state_label') || 'Selected State / UT'}:
                </span>
                {selectedState && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                    {selectedState.code}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight flex items-center gap-1.5">
                {selectedState ? (
                  <>
                    <span className="text-blue-700">{selectedState.name}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({selectedState.type})
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 font-normal text-sm">
                    {t('no_state_selected') || 'Click any state or UT on the map'}
                  </span>
                )}
              </h3>
            </div>
          </div>

          {/* Enter Button (Disabled until state is selected) */}
          <div>
            <button
              type="button"
              onClick={handleEnter}
              disabled={!selectedState}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                selectedState
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-600/20 hover:shadow-md'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title={selectedState ? `Enter ${selectedState.name} Portal` : 'Please select a state first'}
            >
              <span>{t('btn_enter_state') || 'Enter State Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selected State Mini Info Strip */}
        {selectedState && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 animate-in fade-in">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-slate-400" />
              <strong className="text-slate-700">Capital:</strong> {selectedState.capital}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-600" />
              <strong className="text-slate-700">Portal:</strong> {selectedState.portalName}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <strong className="text-slate-700">Coverage:</strong> {selectedState.ulpinCoverage}
            </span>
          </div>
        )}
      </div>

      {/* 2. Interactive Search & Quick Filter Controls */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_state') || 'Search 28 States & 8 UTs...'}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterType === 'UT'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            8 UTs
          </button>
        </div>
      </div>

      {/* 3. India Interactive Map Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 bg-gradient-to-b from-slate-50/50 to-white min-h-[380px]">
        <IndiaMap
          selectedState={selectedState}
          onSelectState={onSelectState}
        />
      </div>

      {/* 4. Quick Selection Horizontal Chips Bar */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Quick Select:
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {filteredStates.length} of 36 shown
          </span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
          {filteredStates.map((state) => {
            const isSelected = selectedState && selectedState.id === state.id;
            return (
              <button
                key={state.id}
                type="button"
                onClick={() => onSelectState && onSelectState(state)}
                className={`shrink-0 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
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
  );
};

export default StateSelector;
