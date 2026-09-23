import React, { useState } from 'react';
import { INDIA_MAP_VIEWBOX, INDIA_STATES } from '../data/indiaMapData';
import { MapPin, Sparkles, Building2, Layers } from 'lucide-react';

export const IndiaMap = ({
  selectedState,
  onSelectState,
  searchHighlightedIds = [], // Array of IDs matching current search
  highlightColor = '#2563eb', // Blue-600
  searchColor = '#f59e0b',    // Amber-500 for search match
  hoverColor = '#93c5fd',     // Blue-300
  defaultColor = '#e2e8f0',   // Slate-200
  strokeColor = '#ffffff'
}) => {
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const isStateSelected = (state) => {
    if (!selectedState) return false;
    return (
      selectedState.id === state.id ||
      selectedState.code === state.code ||
      selectedState.slug === state.slug
    );
  };

  const isStateSearchHighlighted = (state) => {
    if (!searchHighlightedIds || searchHighlightedIds.length === 0) return false;
    return searchHighlightedIds.includes(state.id) || searchHighlightedIds.includes(state.code);
  };

  const isStateHovered = (state) => {
    return hoveredState && hoveredState.id === state.id;
  };

  return (
    <div
      className="relative w-full aspect-[1/1] max-w-full select-none flex items-center justify-center p-2"
      onMouseMove={handleMouseMove}
    >
      {/* SVG Map of India */}
      <svg
        viewBox={INDIA_MAP_VIEWBOX}
        className="w-full h-full filter drop-shadow-md transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Subtle drop shadow filter for hovered/selected state */}
          <filter id="active-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1e40af" floodOpacity="0.4" />
          </filter>
          <filter id="search-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#f59e0b" floodOpacity="0.6" />
          </filter>
          <filter id="hover-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.3" />
          </filter>
          <linearGradient id="selected-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="search-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>

        {/* 1. Base Map Layer: All 36 States & UTs */}
        <g id="states-group">
          {INDIA_STATES.map((state) => {
            const selected = isStateSelected(state);
            const searchHit = isStateSearchHighlighted(state);
            const hovered = isStateHovered(state);

            let fill = defaultColor;
            let stroke = strokeColor;
            let strokeW = 1.2;
            let filter = undefined;

            if (selected) {
              fill = 'url(#selected-gradient)';
              stroke = '#1e3a8a';
              strokeW = 2.4;
              filter = 'url(#active-glow)';
            } else if (searchHit) {
              fill = 'url(#search-gradient)';
              stroke = '#b45309';
              strokeW = 2.2;
              filter = 'url(#search-glow)';
            } else if (hovered) {
              fill = hoverColor;
              stroke = '#2563eb';
              strokeW = 1.6;
              filter = 'url(#hover-glow)';
            }

            return (
              <path
                key={state.id}
                d={state.d}
                id={state.id}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeW}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter={filter}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectState && onSelectState(state)}
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
              />
            );
          })}
        </g>

        {/* 2. Callout connectors for compact UTs & small states */}
        <g id="callouts-group" pointerEvents="none">
          {INDIA_STATES.filter(s => s.callout && s.calloutPos).map(state => {
            const selected = isStateSelected(state);
            const searchHit = isStateSearchHighlighted(state);
            const hovered = isStateHovered(state);
            const anchor = state.center;
            const target = state.calloutPos;

            return (
              <g key={`callout-line-${state.id}`}>
                {/* Connecting Line */}
                <line
                  x1={anchor.x}
                  y1={anchor.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={selected ? '#2563eb' : searchHit ? '#f59e0b' : hovered ? '#3b82f6' : '#94a3b8'}
                  strokeWidth={selected || searchHit ? 2 : 1.2}
                  strokeDasharray={selected || searchHit ? 'none' : '3,3'}
                />
                {/* Center dot on the territory */}
                <circle
                  cx={anchor.x}
                  cy={anchor.y}
                  r={selected || searchHit ? 4.5 : 3}
                  fill={selected ? '#1d4ed8' : searchHit ? '#f59e0b' : '#64748b'}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </g>

        {/* 3. Interactive Name Labels & Callout Badges */}
        <g id="labels-group">
          {INDIA_STATES.map((state) => {
            const selected = isStateSelected(state);
            const searchHit = isStateSearchHighlighted(state);
            const hovered = isStateHovered(state);

            // If state has a callout badge (small UT)
            if (state.callout && state.calloutPos) {
              const pos = state.calloutPos;
              const textWidth = Math.max(state.name.length * 7.5 + 24, 75);

              return (
                <g
                  key={`callout-badge-${state.id}`}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer"
                  onClick={() => onSelectState && onSelectState(state)}
                  onMouseEnter={() => setHoveredState(state)}
                  onMouseLeave={() => setHoveredState(null)}
                >
                  <rect
                    x={-textWidth / 2}
                    y={-14}
                    width={textWidth}
                    height={26}
                    rx={13}
                    fill={selected ? '#1d4ed8' : searchHit ? '#f59e0b' : hovered ? '#eff6ff' : '#ffffff'}
                    stroke={selected ? '#1e3a8a' : searchHit ? '#b45309' : hovered ? '#3b82f6' : '#cbd5e1'}
                    strokeWidth={selected || searchHit ? 2 : 1}
                    className="shadow-sm transition-colors"
                  />
                  <text
                    x={0}
                    y={3}
                    textAnchor="middle"
                    fill={selected || searchHit ? '#ffffff' : '#1e293b'}
                    fontSize="10"
                    fontWeight={selected || searchHit || hovered ? 'bold' : '600'}
                    fontFamily="Inter, sans-serif"
                    className="pointer-events-none"
                  >
                    {state.code} • {state.name.length > 14 ? state.name.substring(0, 12) + '...' : state.name}
                  </text>
                </g>
              );
            }

            // Standard on-map label for medium and large states
            const { x, y } = state.center;
            return (
              <g
                key={`label-${state.id}`}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer"
                onClick={() => onSelectState && onSelectState(state)}
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
              >
                {/* White background glow for readability on dark fills */}
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  fill="#ffffff"
                  stroke="#ffffff"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  fontSize={selected || searchHit ? '11' : '9.5'}
                  fontWeight="bold"
                  fontFamily="Inter, sans-serif"
                  opacity={0.8}
                >
                  {state.code}
                </text>
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  fill={selected || searchHit ? '#ffffff' : '#0f172a'}
                  fontSize={selected || searchHit ? '11' : '9.5'}
                  fontWeight={selected || searchHit || hovered ? 'bold' : '600'}
                  fontFamily="Inter, sans-serif"
                >
                  {state.code}
                </text>
                <text
                  x={0}
                  y={10}
                  textAnchor="middle"
                  fill={selected ? '#dbeafe' : searchHit ? '#78350f' : '#475569'}
                  fontSize="7.5"
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {state.name.length > 13 ? state.name.split(' ')[0] : state.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Dynamic Hover Tooltip Card */}
      {hoveredState && (
        <div
          className="pointer-events-none absolute z-40 transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-slate-700 min-w-[210px] animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.min(Math.max(tooltipPos.x, 110), 390)}px`,
            top: `${Math.max(tooltipPos.y - 12, 40)}px`
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="font-extrabold text-xs tracking-tight text-white">
                {hoveredState.name}
              </p>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700 font-bold">
              {hoveredState.code}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300">
            <p className="flex items-center justify-between">
              <span className="text-slate-400">Type:</span>
              <span className="font-semibold text-slate-200">{hoveredState.type}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-slate-400">Capital:</span>
              <span className="font-semibold text-slate-200">{hoveredState.capital}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-slate-400">Land Portal:</span>
              <span className="font-medium text-emerald-300 truncate max-w-[130px]" title={hoveredState.portalName}>
                {hoveredState.portalName}
              </span>
            </p>
            <div className="pt-1.5 mt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Bhu-Aadhaar Coverage:</span>
              <span className="font-bold text-blue-400">{hoveredState.ulpinCoverage}</span>
            </div>
          </div>
          
          <div className="mt-1 text-[9px] text-slate-400 text-center font-mono">
            Click to select state
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaMap;
