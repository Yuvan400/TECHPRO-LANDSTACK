import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Search, Layers, Sparkles, Filter, MapPin, Compass,
  CheckCircle2, AlertTriangle, Eye, ArrowRight, RefreshCw,
  Globe, Navigation, Crosshair, Map as MapIcon
} from 'lucide-react';
import api from '../services/api';
import PropertyPanel from '../components/PropertyPanel';

// Fix Leaflet default icon URL issues in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map centering & flying to selected parcel
const MapController = ({ targetCoords, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (targetCoords) {
      map.flyTo(targetCoords, zoom || 16, { animate: true, duration: 1.2 });
    }
  }, [targetCoords, zoom, map]);
  return null;
};

export const LandMap = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [parcels, setParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedLandType, setSelectedLandType] = useState('All');
  const [targetCoords, setTargetCoords] = useState([12.9249, 80.1472]); // Default center at Tambaram/Selaiyur
  const [mapZoom, setMapZoom] = useState(13);
  const [loading, setLoading] = useState(true);
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [aiSearchPrompt, setAiSearchPrompt] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiSearching, setAiSearching] = useState(false);

  // Map layer switcher & GPS current location states
  const [mapLayer, setMapLayer] = useState('boundary'); // 'boundary' | 'satellite' | 'hybrid'
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy, isFallback }
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showBoundaries, setShowBoundaries] = useState(true);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, accuracy: accuracy || 30 });
        setTargetCoords([latitude, longitude]);
        setMapZoom(16);
        setLocatingUser(false);
      },
      (err) => {
        console.warn('Geolocation failed or denied, using regional reference:', err);
        // Fallback: zoom to cadastral sample location
        const fallback = parcels[0] ? [parcels[0].latitude, parcels[0].longitude] : [12.9249, 80.1472];
        setUserLocation({ lat: fallback[0], lng: fallback[1], accuracy: 50, isFallback: true });
        setTargetCoords(fallback);
        setMapZoom(16);
        setLocatingUser(false);
        setLocationError('Real GPS permission unavailable; mapped to Cadastral Anchor.');
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
    );
  };

  // Load parcels
  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/parcels');
      const data = res.data || [];
      setParcels(data);
      setFilteredParcels(data);

      if (initialSearch) {
        handleDirectSearch(initialSearch, data);
      }
    } catch (err) {
      console.error('Failed to load parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSearch = (query, parcelList = parcels) => {
    if (!query) {
      setFilteredParcels(parcelList);
      return;
    }
    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/[\s-]/g, '');
    const matches = parcelList.filter(
      p => p.ulpin.toLowerCase().includes(q) ||
           p.surveyNumber.toLowerCase().includes(q) ||
           (p.ownerAadhaarMasked && p.ownerAadhaarMasked.replace(/[\s-]/g, '').toLowerCase().includes(cleanQ)) ||
           p.ownerName.toLowerCase().includes(q) ||
           p.village.toLowerCase().includes(q)
    );
    setFilteredParcels(matches);

    if (matches.length > 0) {
      const best = matches[0];
      setSelectedParcel(best);
      setTargetCoords([best.latitude, best.longitude]);
      setMapZoom(16);
    }
  };

  // Run filter when search inputs change
  useEffect(() => {
    let result = parcels;

    if (selectedDistrict !== 'All') {
      result = result.filter(p => p.district === selectedDistrict);
    }

    if (selectedLandType !== 'All') {
      result = result.filter(p => p.landType === selectedLandType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cleanQ = q.replace(/[\s-]/g, '');
      result = result.filter(
        p => p.ulpin.toLowerCase().includes(q) ||
             p.surveyNumber.toLowerCase().includes(q) ||
             (p.ownerAadhaarMasked && p.ownerAadhaarMasked.replace(/[\s-]/g, '').toLowerCase().includes(cleanQ)) ||
             p.ownerName.toLowerCase().includes(q) ||
             p.village.toLowerCase().includes(q)
      );
    }

    setFilteredParcels(result);
  }, [searchQuery, selectedDistrict, selectedLandType, parcels]);

  // Handle AI Natural Language Search
  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!aiSearchPrompt.trim()) return;
    setAiSearching(true);
    setAiExplanation('');

    try {
      const res = await api.post('/api/ai/nl-search', { query: aiSearchPrompt });
      const aiData = res.data;
      setAiExplanation(aiData.aiExplanation);
      if (aiData.matchedParcels && aiData.matchedParcels.length > 0) {
        setFilteredParcels(aiData.matchedParcels);
        const best = aiData.matchedParcels[0];
        setSelectedParcel(best);
        setTargetCoords([best.latitude, best.longitude]);
        setMapZoom(15);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiSearching(false);
    }
  };

  // Helper to parse GeoJSON polygon into Leaflet Polygon coordinates [lat, lng]
  const getPolygonCoords = (boundaryGeoJson) => {
    try {
      if (!boundaryGeoJson) return null;
      const parsed = typeof boundaryGeoJson === 'string' ? JSON.parse(boundaryGeoJson) : boundaryGeoJson;
      const ring = parsed.geometry?.coordinates?.[0] || parsed.coordinates?.[0];
      if (Array.isArray(ring)) {
        // GeoJSON is [lng, lat] -> Leaflet requires [lat, lng]
        return ring.map(coord => [coord[1], coord[0]]);
      }
    } catch {
      return null;
    }
    return null;
  };

  const getParcelPolygonStyle = (parcel, isSelected) => {
    if (isSelected) {
      return {
        color: '#2563eb',
        weight: 3.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.5,
        dashArray: null,
      };
    }

    if (parcel.verificationStatus === 'Disputed') {
      return { color: '#dc2626', weight: 2, fillColor: '#ef4444', fillOpacity: 0.35, dashArray: '5, 5' };
    }

    switch (parcel.landType) {
      case 'Residential':
        return { color: '#1d4ed8', weight: 1.8, fillColor: '#60a5fa', fillOpacity: 0.3 };
      case 'Commercial':
        return { color: '#7c3aed', weight: 1.8, fillColor: '#a78bfa', fillOpacity: 0.3 };
      case 'Agricultural':
        return { color: '#047857', weight: 1.8, fillColor: '#34d399', fillOpacity: 0.3 };
      case 'Industrial':
        return { color: '#b45309', weight: 1.8, fillColor: '#fbbf24', fillOpacity: 0.3 };
      default:
        return { color: '#475569', weight: 1.5, fillColor: '#94a3b8', fillOpacity: 0.25 };
    }
  };

  // Extract unique districts
  const districts = ['All', ...new Set(parcels.map(p => p.district).filter(Boolean))];
  const landTypes = ['All', ...new Set(parcels.map(p => p.landType).filter(Boolean))];

  return (
    <div className="relative flex flex-col h-[calc(100vh-4.25rem)] bg-slate-100 overflow-hidden">

      {/* Top Floating Cadastral Search Bar */}
      <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-[32rem] z-30 space-y-2">
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600 ml-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ULPIN, Survey No, Aadhaar, Owner..."
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-1.5"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setShowAiSearch(!showAiSearch)}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                showAiSearch ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
              title="Toggle AI Natural Language Query"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Query</span>
            </button>
          </div>

          {/* Quick Filters */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 flex-1">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
              >
                {districts.map(d => (
                  <option key={d} value={d}>District: {d}</option>
                ))}
              </select>

              <select
                value={selectedLandType}
                onChange={(e) => setSelectedLandType(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
              >
                {landTypes.map(lt => (
                  <option key={lt} value={lt}>Type: {lt}</option>
                ))}
              </select>
            </div>

            <span className="text-[11px] font-mono text-slate-500 shrink-0">
              {filteredParcels.length} parcels
            </span>
          </div>
        </div>

        {/* AI Natural Language Assistant Box */}
        {showAiSearch && (
          <div className="bg-slate-900/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Natural Language Cadastre Assistant
              </div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">Engine Active</span>
            </div>

            <form onSubmit={handleAiSearch} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiSearchPrompt}
                  onChange={(e) => setAiSearchPrompt(e.target.value)}
                  placeholder="e.g. Find residential plots in Tambaram above 2 acres..."
                  className="w-full bg-slate-800 text-xs px-3 py-2 rounded-xl text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={aiSearching}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shrink-0"
                >
                  {aiSearching ? 'Analyzing...' : 'Search'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAiSearchPrompt("Find residential plots in Tambaram over 2 acres")}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-700"
                >
                  "Residential in Tambaram &gt; 2 acres"
                </button>
                <button
                  type="button"
                  onClick={() => setAiSearchPrompt("Commercial plots in Chennai with clear title")}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-700"
                >
                  "Commercial in Chennai"
                </button>
              </div>
            </form>

            {aiExplanation && (
              <div className="mt-2.5 p-2 bg-indigo-950/70 rounded-lg border border-indigo-800 text-[11px] text-indigo-200">
                {aiExplanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Map + Side Property Panel Split */}
      <div className="flex-1 flex relative overflow-hidden">

        {/* Leaflet Map */}
        <div className="flex-1 relative z-10">
          <MapContainer
            center={targetCoords}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            {/* Dynamic Tile Layer according to Selector */}
            {mapLayer === 'boundary' && (
              <TileLayer
                key="boundary-tile"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | LandStack Cadastre'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}

            {mapLayer === 'satellite' && (
              <TileLayer
                key="satellite-tile"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}

            {mapLayer === 'hybrid' && (
              <React.Fragment key="hybrid-tiles">
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                  attribution='&copy; CartoDB'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                />
              </React.Fragment>
            )}

            <MapController targetCoords={targetCoords} zoom={mapZoom} />

            {/* Current GPS Location Marker & Accuracy Radius */}
            {userLocation && (
              <React.Fragment key="user-gps-location">
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={Math.max(userLocation.accuracy || 30, 20)}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.2,
                    weight: 1.5,
                    dashArray: '4, 4'
                  }}
                />
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={8}
                  pathOptions={{
                    color: '#ffffff',
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    weight: 3
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1">
                      <div className="flex items-center gap-1.5 font-bold text-blue-700">
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        Current Location
                      </div>
                      <p className="font-mono text-[11px] text-slate-700 mt-1">
                        {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Radius Accuracy: ±{Math.round(userLocation.accuracy || 25)}m
                      </p>
                      {userLocation.isFallback && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-semibold">
                          Cadastral Focus Center
                        </span>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            )}

            {/* Render Cadastral GeoJSON Polygons */}
            {showBoundaries && filteredParcels.map((parcel) => {
              const polygonCoords = getPolygonCoords(parcel.boundaryGeoJson);
              const isSelected = selectedParcel?.ulpin === parcel.ulpin;

              return (
                <React.Fragment key={parcel.ulpin}>
                  {polygonCoords && (
                    <Polygon
                      positions={polygonCoords}
                      pathOptions={getParcelPolygonStyle(parcel, isSelected)}
                      eventHandlers={{
                        click: () => {
                          setSelectedParcel(parcel);
                          setTargetCoords([parcel.latitude, parcel.longitude]);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-mono font-bold text-blue-700">{parcel.ulpin}</p>
                          <p className="font-semibold text-slate-900 mt-1">Survey: {parcel.surveyNumber}</p>
                          <p className="text-slate-600">Owner: {parcel.ownerName}</p>
                          <p className="text-slate-600">Area: {parcel.areaAcre} Acres ({parcel.landType})</p>
                          <button
                            onClick={() => setSelectedParcel(parcel)}
                            className="mt-2 w-full text-center py-1 bg-blue-600 text-white rounded text-[11px] font-bold"
                          >
                            Open 360° Property Panel
                          </button>
                        </div>
                      </Popup>
                    </Polygon>
                  )}

                  {/* Marker Pin */}
                  <Marker
                    position={[parcel.latitude, parcel.longitude]}
                    eventHandlers={{
                      click: () => {
                        setSelectedParcel(parcel);
                        setTargetCoords([parcel.latitude, parcel.longitude]);
                      },
                    }}
                  >
                    <Popup>
                      <div className="text-xs">
                        <span className="font-mono font-bold text-blue-700">{parcel.ulpin}</span>
                        <p className="font-medium text-slate-800 mt-1">Survey: {parcel.surveyNumber}</p>
                        <p className="text-slate-500">{parcel.village}, {parcel.district}</p>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>

          {/* Floating Map Layer & Location Selector (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMapLayer('boundary')}
                title="Cadastral Boundary Map"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  mapLayer === 'boundary'
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Parcel Boundary</span>
              </button>

              <button
                type="button"
                onClick={() => setMapLayer('satellite')}
                title="Satellite Orbital Imagery"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  mapLayer === 'satellite'
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Satellite</span>
              </button>

              <button
                type="button"
                onClick={() => setMapLayer('hybrid')}
                title="Satellite with Boundary Labels"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  mapLayer === 'hybrid'
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Hybrid</span>
              </button>
            </div>

            {/* GPS Current Location Button & Boundary Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locatingUser}
                title="Locate Current Position"
                className={`flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border text-xs font-bold transition active:scale-95 ${
                  userLocation
                    ? 'text-blue-700 border-blue-400 bg-blue-50/50'
                    : 'text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Navigation className={`w-3.5 h-3.5 text-blue-600 ${locatingUser ? 'animate-spin' : ''}`} />
                <span>{locatingUser ? 'Locating...' : 'Current Location'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBoundaries(!showBoundaries)}
                title={showBoundaries ? 'Hide Cadastral Boundaries' : 'Show Cadastral Boundaries'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-lg border text-xs font-bold transition active:scale-95 ${
                  showBoundaries
                    ? 'bg-white/95 text-slate-800 border-slate-200 hover:bg-slate-50'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-slate-600" />
                <span>{showBoundaries ? 'Boundaries ON' : 'Boundaries OFF'}</span>
              </button>
            </div>

            {locationError && (
              <div className="bg-slate-900/90 text-amber-300 text-[11px] px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg border border-amber-500/40">
                {locationError}
              </div>
            )}
          </div>

          {/* Floating Map Legend (Bottom Left) */}
          <div className="absolute bottom-6 left-6 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 text-xs space-y-1.5 hidden sm:block">
            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Cadastral Legend
            </p>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-400 border border-blue-600"></span>
              <span className="text-slate-600 text-[11px]">Residential</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-400 border border-purple-600"></span>
              <span className="text-slate-600 text-[11px]">Commercial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-400 border border-emerald-600"></span>
              <span className="text-slate-600 text-[11px]">Agricultural</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-400 border border-amber-600"></span>
              <span className="text-slate-600 text-[11px]">Industrial</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-400 border border-red-600 border-dashed"></span>
              <span className="text-slate-600 text-[11px]">Disputed Boundary</span>
            </div>
          </div>
        </div>

        {/* Slide-out 360-degree Property Panel */}
        {selectedParcel && (
          <div className="w-full sm:w-96 md:w-[26rem] h-full absolute top-0 right-0 z-30 sm:relative">
            <PropertyPanel
              parcel={selectedParcel}
              onClose={() => setSelectedParcel(null)}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default LandMap;
