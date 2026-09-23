import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText, Upload, CheckCircle2, AlertCircle, ArrowRight,
  ShieldCheck, Sparkles, MapPin, Building2, Clock, WifiOff
} from 'lucide-react';
import api from '../../services/api';
import { enqueueOfflineAction } from '../../services/indexedDbService';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

import { useAuth } from '../../context/AuthContext';
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

export const ApplyService = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isOnline, refreshQueueCount } = useOnlineStatus();

  const [ulpin, setUlpin] = useState(searchParams.get('ulpin') || '33TNCHN0000123456');
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('serviceId') || '');
  const [citizenRemarks, setCitizenRemarks] = useState('Applying for official digital land ownership certificate with authenticated cadastral boundaries.');
  const [services, setServices] = useState([]);
  const [parcel, setParcel] = useState(null);
  const [loadingParcel, setLoadingParcel] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successApp, setSuccessApp] = useState(null);

  // Uploaded documents state (Starts empty, citizen uploads documents)
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (ulpin) {
      loadParcelDetails(ulpin);
    }
  }, [ulpin]);

  const loadServices = async () => {
    try {
      const res = await api.get('/api/services');
      setServices(res.data || []);
      if (!selectedServiceId && res.data?.length > 0) {
        setSelectedServiceId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadParcelDetails = async (targetUlpin) => {
    setLoadingParcel(true);
    try {
      const res = await api.get(`/api/parcels/${targetUlpin.trim()}`);
      setParcel(res.data);
    } catch {
      setParcel(null);
    } finally {
      setLoadingParcel(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedServiceId) {
      setError('Please select a government service');
      return;
    }

    if (!parcel) {
      setError('Please verify a valid land parcel ULPIN first');
      return;
    }

    setSubmitting(true);

    const payload = {
      ulpin: parcel.ulpin,
      serviceId: parseInt(selectedServiceId),
      citizenRemarks,
      documents: documents.map(d => ({
        documentType: d.documentType,
        documentName: d.documentName,
        documentUrl: '/uploads/' + d.documentName,
        fileSize: d.fileSize
      }))
    };

    try {
      if (!isOnline) {
        // Offline queue mode
        await enqueueOfflineAction('SUBMIT_APPLICATION', payload);
        await refreshQueueCount();
        setSuccessApp({
          applicationNumber: 'LS-OFFLINE-QUEUED',
          isOffline: true
        });
      } else {
        const res = await api.post('/api/applications', payload);
        setSuccessApp(res.data);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeService = services.find(s => s.id.toString() === selectedServiceId);
  const isPattaService = selectedServiceId === '1' || activeService?.serviceName?.toLowerCase().includes('patta') || searchParams.get('service') === 'patta';
  const isEcService = selectedServiceId === '2' || activeService?.serviceName?.toLowerCase().includes('encumbrance') || searchParams.get('service') === 'ec';
  const isConversionService = selectedServiceId === '3' || activeService?.serviceName?.toLowerCase().includes('conversion') || searchParams.get('service') === 'conversion';
  const isMutationService = selectedServiceId === '4' || activeService?.serviceName?.toLowerCase().includes('mutation') || searchParams.get('service') === 'mutation';
  const isBuildingService = selectedServiceId === '5' || activeService?.serviceName?.toLowerCase().includes('building') || searchParams.get('service') === 'building';
  const isSurveyService = selectedServiceId === '6' || activeService?.serviceName?.toLowerCase().includes('demarcation') || activeService?.serviceName?.toLowerCase().includes('dgps') || searchParams.get('service') === 'survey';
  const isKhataService = selectedServiceId === '7' || activeService?.serviceCode === 'SRV-TAX-07' || activeService?.serviceName?.toLowerCase().includes('khata') || searchParams.get('service') === 'khata';
  const isWaterService = selectedServiceId === '8' || activeService?.serviceCode === 'SRV-UTIL-08' || activeService?.serviceName?.toLowerCase().includes('water') || activeService?.serviceName?.toLowerCase().includes('sewerage') || searchParams.get('service') === 'water';
  const isZoningService = selectedServiceId === '9' || activeService?.serviceCode === 'SRV-TCP-09' || activeService?.serviceName?.toLowerCase().includes('zoning') || activeService?.serviceName?.toLowerCase().includes('reclassification') || searchParams.get('service') === 'zoning';
  const isHighwayService = selectedServiceId === '10' || activeService?.serviceCode === 'SRV-HWY-10' || activeService?.serviceName?.toLowerCase().includes('highway') || activeService?.serviceName?.toLowerCase().includes('setback') || searchParams.get('service') === 'highway';
  const isForestService = selectedServiceId === '11' || activeService?.serviceCode === 'SRV-FOR-11' || activeService?.serviceName?.toLowerCase().includes('forest') || activeService?.serviceName?.toLowerCase().includes('eco-sensitive') || searchParams.get('service') === 'forest';
  const isElectricalService = selectedServiceId === '12' || activeService?.serviceCode === 'SRV-ELEC-12' || activeService?.serviceName?.toLowerCase().includes('high-tension') || activeService?.serviceName?.toLowerCase().includes('substation') || activeService?.serviceName?.toLowerCase().includes('electricity') || searchParams.get('service') === 'electrical';

  if (isPattaService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <PattaApplicationWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isEcService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <EcApplicationWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isConversionService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <LandConversionWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isMutationService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <PropertyMutationWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isBuildingService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <BuildingPermissionWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isSurveyService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <DgpsSurveyWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isKhataService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <PropertyTaxKhataWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isWaterService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <WaterSewerageNocWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isZoningService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ZoningReclassificationWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isHighwayService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <HighwayAccessSetbackWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isForestService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ForestClearanceWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (isElectricalService && parcel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ElectricalNocWorkflow
          parcel={parcel}
          user={user}
          onBack={() => navigate('/dashboard')}
          onSuccess={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Breadcrumb / Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Citizen Portal</span>
          <span>/</span>
          <span>Services</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold">New Service Application</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Apply for Integrated Land Governance Service
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit official service request linked directly to your digital ULPIN record.
        </p>
      </div>

      {!isOnline && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <strong className="font-bold">Offline Mode Active:</strong> You can submit this application without an internet connection. It will be stored safely in your local IndexedDB queue and automatically synchronized with the Spring Boot server once connectivity is restored.
          </div>
        </div>
      )}

      {/* Success View */}
      {successApp ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">
              {successApp.isOffline ? 'Application Queued Locally' : 'Application Submitted Successfully!'}
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {successApp.isOffline
                ? 'Your application has been enqueued into IndexedDB. It will automatically upload to the Department Supervisor when you reconnect.'
                : 'Your statutory application has been logged and routed to the assigned Department Supervisor for scrutiny and field verification.'
              }
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Application ID:</span>
              <span className="font-bold text-slate-900">{successApp.applicationNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Parcel ULPIN:</span>
              <span className="text-blue-700">{parcel?.ulpin}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Department:</span>
              <span className="text-slate-800 font-sans">{activeService?.departmentName}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(successApp.isOffline ? '/dashboard' : `/applications/${successApp.id}`)}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition"
            >
              Track Application Progress
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Select Service */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="font-bold text-slate-900 text-sm">Select Government Service</h3>
            </div>

            {loadingServices ? (
              <p className="text-xs text-slate-400">Loading services...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((svc) => (
                  <label
                    key={svc.id}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      selectedServiceId === svc.id.toString()
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-slate-900">{svc.serviceName}</span>
                      <input
                        type="radio"
                        name="serviceSelect"
                        value={svc.id}
                        checked={selectedServiceId === svc.id.toString()}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="text-blue-600 mt-0.5"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{svc.departmentName}</span>
                      <span className="font-semibold text-blue-700">₹{svc.feeInr} (SLA: {svc.processingDays}d)</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Parcel Selection */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="font-bold text-slate-900 text-sm">Target Land Parcel (ULPIN)</h3>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={ulpin}
                onChange={(e) => setUlpin(e.target.value)}
                placeholder="Enter 16-digit ULPIN..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => loadParcelDetails(ulpin)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-slate-800 transition"
              >
                {loadingParcel ? 'Checking...' : 'Fetch Parcel'}
              </button>
            </div>

            {parcel ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-700">{parcel.ulpin}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {parcel.verificationStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">Owner</span>
                    <strong className="text-slate-800">{parcel.ownerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Survey No</span>
                    <strong className="text-slate-800">{parcel.surveyNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Area</span>
                    <strong className="text-slate-800">{parcel.areaAcre} Acres</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Location</span>
                    <strong className="text-slate-800">{parcel.village}, {parcel.district}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600">Please enter a valid seeded ULPIN (e.g. 33TNCHN0000123456)</p>
            )}
          </div>

          {/* Step 3: Required Documents Verification */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="font-bold text-slate-900 text-sm">Required Document Dossier</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                AI Pre-Scanned & Verified
              </span>
            </div>

            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">{doc.documentType}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{doc.documentName} • {doc.fileSize}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Attached
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Remarks & Submission */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Citizen Application Remarks
            </label>
            <textarea
              rows={3}
              value={citizenRemarks}
              onChange={(e) => setCitizenRemarks(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="State any specific details or urgency..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting || !parcel}
            className="w-full py-3.5 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-700/30 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Submit Application to Department
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>
      )}

    </div>
  );
};

export default ApplyService;
