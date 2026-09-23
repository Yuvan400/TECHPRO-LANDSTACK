import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Compass, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, UserCheck, Building2,
  FileText, MapPin, Layers, Sparkles, Navigation, Ruler, Map as MapIcon
} from 'lucide-react';
import api from '../services/api';

export const ZoningReclassificationWorkflow = ({
  parcel,
  deptData,
  user,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Workflow steps: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Automatic Land Details (Reused from searched land parcel)
  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chennai',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    currentLandClassification: parcel?.landType || 'Agricultural / Grama Natham',
    currentLandUse: parcel?.landUse || 'Agricultural / Vacant Land',
    existingZoning: deptData?.planning?.parameters?.find(p => p.label?.toLowerCase().includes('zoning'))?.value || parcel?.zoning || 'Residential Zone (R2)',
    masterPlanZone: deptData?.planning?.parameters?.find(p => p.label?.toLowerCase().includes('master plan zone'))?.value || 'R2 - Mixed Residential Zone',
    planningArea: `${parcel?.district || 'Chennai'} Metropolitan Planning Authority (CMDA / LPA)`,
    abuttingRoad: deptData?.planning?.parameters?.find(p => p.label?.toLowerCase().includes('road width'))?.value ? `${deptData.planning.parameters.find(p => p.label?.toLowerCase().includes('road width')).value} Corridor Road` : '18 m Wide Corporation Road',
    roadWidth: deptData?.planning?.parameters?.find(p => p.label?.toLowerCase().includes('road width'))?.value || '18 m',
    existingLandUseCategory: parcel?.landType === 'Commercial' ? 'Commercial Zone' : (parcel?.landType === 'Agricultural' ? 'Primary Agricultural Zone' : 'Residential Use Zone')
  };

  // Section 1: Planning Parameters
  const [planningParams, setPlanningParams] = useState({
    planningArea: landDetails.planningArea,
    existingZoning: landDetails.existingZoning,
    currentLandUse: landDetails.currentLandUse,
    proposedLandUse: 'Commercial', // Residential, Commercial, Industrial, Institutional, Mixed Use, Other
    proposedDevelopmentType: 'Commercial Complex & Corporate Office Layout',
    developmentPurpose: 'Development of sustainable commercial retail shopping and multi-level office suites.',
    siteArea: `${parcel?.areaSquareMeters ? (parcel.areaSquareMeters).toFixed(0) : '9,915'} sq.m.`,
    landExtent: landDetails.landExtent,
    roadAccess: 'Major Municipal Corridor / PWD Scheme Road',
    abuttingRoadWidth: landDetails.roadWidth,
    proposedDevelopmentDescription: 'Construction of G+4 energy-efficient commercial retail & IT office complex with dedicated multi-level basement parking and mandatory 10% OSR reservation.'
  });

  // Section 2: Land Reclassification Parameters
  const [reclassificationParams, setReclassificationParams] = useState({
    currentClassification: landDetails.currentLandClassification,
    proposedClassification: 'Commercial / Mixed Use (C2 Zone)',
    reasonForReclassification: 'Rapid urban corridor transformation along the 18m municipal trunk corridor, requiring conversion from agricultural/residential to mixed commercial use under the Master Plan statutory amendment regulations.',
    proposedActivity: 'Organized Retail & Financial Services / IT Offices',
    developmentArea: `Full Extent (${landDetails.landExtent})`
  });

  // Section 3: Supporting Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission & Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  // Dynamic suggested document list for Master Plan & Reclassification
  const suggestedDocs = [
    { type: 'Patta Extract / Chitta', desc: 'Current digitally signed Patta extract from Revenue Department', required: true },
    { type: 'Registered Sale Deed / Title Document', desc: 'Certified parent ownership conveyance instrument', required: true },
    { type: 'FMB / Cadastral Survey Sketch', desc: 'Survey sketch demarcating parcel boundaries and adjacent survey numbers', required: true },
    { type: 'Site Plan & Abutting Road Layout', desc: 'Georeferenced site plan detailing road width and access points', required: true },
    { type: 'Master Plan / Zoning Sketch', desc: 'Extract of local master development plan showing current zone coloring', required: true },
    { type: 'Topographical / Contour Map', desc: 'Contour and drainage gradient map prepared by licensed surveyor', required: false },
    { type: 'Location & Key Plan', desc: 'Key plan within 500m radius showing surrounding landmarks', required: false },
    { type: 'Identity Proof of Applicant', desc: 'Aadhaar / Voter ID / Passport of registered applicant', required: true },
    { type: 'Previous Planning Permission', desc: 'Prior layout or building approval copy if applicable', required: false },
    { type: 'Property Tax Receipt', desc: 'Latest municipal / panchayat tax paid clearance', required: false }
  ];

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setDocumentError('');

    const validFiles = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setDocumentError(`File "${file.name}" exceeds 10MB limit.`);
        return;
      }
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
        setDocumentError(`File "${file.name}" has invalid format. Only PDF, JPG, and PNG allowed.`);
        return;
      }

      validFiles.push({
        id: Date.now() + Math.random().toString(36).substring(2, 7),
        documentName: file.name,
        documentType: file.name.split('.')[0].replace(/[-_]/g, ' '),
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        file: file
      });
    }

    setUploadedDocuments(prev => [...prev, ...validFiles]);
  };

  const handleRemoveDoc = (id) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Validation
  const validateForm = () => {
    const errs = {};

    if (!planningParams.proposedLandUse) {
      errs.proposedLandUse = 'Please select the proposed land use.';
    }
    if (!planningParams.proposedDevelopmentType?.trim()) {
      errs.proposedDevelopmentType = 'Please enter the proposed development type.';
    }
    if (!planningParams.abuttingRoadWidth?.trim()) {
      errs.abuttingRoadWidth = 'Please enter the abutting road width.';
    }
    if (!planningParams.developmentPurpose?.trim()) {
      errs.developmentPurpose = 'Please provide development purpose.';
    }
    if (!reclassificationParams.proposedClassification?.trim()) {
      errs.proposedClassification = 'Please enter the proposed classification.';
    }
    if (!reclassificationParams.reasonForReclassification?.trim()) {
      errs.reasonForReclassification = 'Please enter the reason for reclassification.';
    }
    if (!reclassificationParams.proposedActivity?.trim()) {
      errs.proposedActivity = 'Please enter the proposed activity / development.';
    }

    // Documents check
    if (uploadedDocuments.length === 0) {
      errs.documents = 'Please upload at least one required planning document (e.g. Master Plan Sketch, Site Plan, Patta Extract).';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setSubmitError('');
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      // Lookup service ID for SRV-TCP-09 (Master Plan Zoning NOC & Land Reclassification)
      let serviceId = 9;
      try {
        const servicesRes = await api.get('/api/services');
        const tcpService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-TCP-09' || s.serviceName?.toLowerCase().includes('zoning') || s.serviceName?.toLowerCase().includes('reclassification')
        );
        if (tcpService) serviceId = tcpService.id;
      } catch (err) {
        console.warn('Could not lookup service id, defaulting to 9', err);
      }

      // Generate dynamic application ID format: ZON-2026-XXXXXXXX
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const dynamicAppId = `ZON-2026-${randomDigits}`;

      const remarksSummary = `[Master Plan Zoning NOC & Land Reclassification] Current Zoning: ${planningParams.existingZoning} | Proposed Land Use: ${planningParams.proposedLandUse} | Dev Type: ${planningParams.proposedDevelopmentType} | Abutting Road: ${planningParams.abuttingRoadWidth} | Reclass: ${reclassificationParams.currentClassification} -> ${reclassificationParams.proposedClassification} | Area: ${reclassificationParams.developmentArea} | Activity: ${reclassificationParams.proposedActivity} | Reason: ${reclassificationParams.reasonForReclassification} | Description: ${planningParams.proposedDevelopmentDescription}`;

      const payload = {
        ulpin: landDetails.ulpin,
        serviceId: serviceId,
        customApplicationNumber: dynamicAppId,
        citizenRemarks: remarksSummary,
        documents: uploadedDocuments.map(d => ({
          documentType: d.documentType,
          documentName: d.documentName,
          documentUrl: '/uploads/' + d.documentName,
          fileSize: d.fileSize
        }))
      };

      const res = await api.post('/api/applications', payload);

      const generatedNum = res.data?.applicationNumber || dynamicAppId;

      setGeneratedApplication({
        ...res.data,
        applicationNumber: generatedNum,
        proposedLandUse: planningParams.proposedLandUse,
        submissionDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        })
      });

      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit Zoning / Reclassification application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER STEP 3: SUCCESS CONFIRMATION
  // ==========================================
  if (step === 'success' && generatedApplication) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl max-w-3xl mx-auto text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-rose-100 text-rose-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-black uppercase tracking-wider">
            Town & Country Planning / Local Planning Authority
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Zoning & Reclassification Application Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your proposal for Master Plan Zoning Clearance and Land Reclassification has been registered with the Directorate of Town and Country Planning.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
            <span className="text-slate-500 font-sans font-bold">Application ID:</span>
            <span className="font-black text-rose-700 text-base">{generatedApplication.applicationNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-sans font-bold block">Service:</span>
              <span className="font-bold text-slate-900">Master Plan Zoning NOC & Land Reclassification</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Proposed Land Use:</span>
              <span className="font-bold text-rose-800">{planningParams.proposedLandUse}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">ULPIN (Bhu-Aadhaar):</span>
              <span className="font-bold text-slate-900">{landDetails.ulpin}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Survey Number:</span>
              <span className="font-bold text-slate-900">{landDetails.surveyNumber} ({landDetails.subDivision})</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Reclassification:</span>
              <span className="font-bold text-slate-900">{reclassificationParams.currentClassification} → {reclassificationParams.proposedClassification}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Submission Date:</span>
              <span className="font-bold text-slate-900">{generatedApplication.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Statutory SLA:</span>
              <span className="font-bold text-rose-700">14 Days</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Current Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                <Clock className="w-3 h-3" /> Submitted
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
          >
            Return to Citizen Dashboard
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition active:scale-95"
          >
            Print Acknowledgement Receipt
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 2: REVIEW APPLICATION
  // ==========================================
  if (step === 'review') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Edit Application Details
          </button>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Step 2 of 2: Final Verification
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              Review Master Plan Zoning & Reclassification Application
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Carefully verify current zoning, proposed land use, development parameters, and statutory planning blueprints.
            </p>
          </div>

          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          {/* Review 1: Land Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              Target Cadastral Parcel & Planning Authority Record
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">ULPIN:</span>
                <span className="font-mono font-bold text-blue-700">{landDetails.ulpin}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Survey No:</span>
                <span className="font-mono font-bold text-slate-900">{landDetails.surveyNumber} ({landDetails.subDivision})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Location:</span>
                <span className="font-bold text-slate-900">{landDetails.village}, {landDetails.district}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Land Extent:</span>
                <span className="font-bold text-slate-900">{landDetails.landExtent}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Classification:</span>
                <span className="font-bold text-slate-900">{landDetails.currentLandClassification}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Existing Zoning:</span>
                <span className="font-bold text-rose-700">{landDetails.existingZoning}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Master Plan Zone:</span>
                <span className="font-bold text-slate-900">{landDetails.masterPlanZone}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Abutting Road:</span>
                <span className="font-bold text-slate-900">{landDetails.abuttingRoad}</span>
              </div>
            </div>
          </div>

          {/* Review 2: Planning & Proposed Use */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-600" />
              Planning & Development Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Current Land Use:</span>
                <span className="font-bold text-slate-800">{planningParams.currentLandUse}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Proposed Land Use:</span>
                <span className="font-bold text-rose-800 text-sm">{planningParams.proposedLandUse}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Abutting Road Width:</span>
                <span className="font-bold font-mono text-slate-900">{planningParams.abuttingRoadWidth}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Proposed Development Type:</span>
                <span className="font-bold text-slate-900">{planningParams.proposedDevelopmentType}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Development Purpose & Objectives:</span>
                <span className="font-medium text-slate-800">{planningParams.developmentPurpose}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Detailed Project Description:</span>
                <span className="font-medium text-slate-700 italic">{planningParams.proposedDevelopmentDescription}</span>
              </div>
            </div>
          </div>

          {/* Review 3: Reclassification Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-600" />
              Land-Use Reclassification Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Current Classification:</span>
                <span className="font-bold text-slate-800">{reclassificationParams.currentClassification}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Proposed Reclassified Category:</span>
                <span className="font-bold text-rose-900">{reclassificationParams.proposedClassification}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Area Under Reclassification:</span>
                <span className="font-bold text-slate-900">{reclassificationParams.developmentArea}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Proposed Economic Activity:</span>
                <span className="font-bold text-slate-900">{reclassificationParams.proposedActivity}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Justification / Reason for Reclassification:</span>
                <span className="font-medium text-slate-800">{reclassificationParams.reasonForReclassification}</span>
              </div>
            </div>
          </div>

          {/* Review 4: Attached Documents */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              Uploaded Planning Blueprints & Extracts ({uploadedDocuments.length})
            </h3>
            <div className="space-y-2">
              {uploadedDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">{doc.documentType}</span>
                    <span className="text-slate-500 font-mono">({doc.documentName})</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">{doc.fileSize}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Clearance will be technically evaluated against statutory Master Plan land-use zoning bylaws & Section 47A provisions.
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitApplication}
              className="w-full sm:w-auto px-8 py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-700/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Lodging Planning Application...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Zoning / Reclassification Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 1: FORM
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* SERVICE HEADER */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            Town & Country Planning / Local Planning Authority
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Master Plan Zoning NOC & Land Reclassification
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Planning clearance to determine compatibility with the applicable master plan and request land-use reclassification where applicable.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleProceedToReview} className="space-y-6">

        {/* SECTION 1: AUTOMATIC LAND DETAILS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Target Land Parcel Record
                </h3>
                <p className="text-[11px] text-slate-500">
                  Automatically populated from your searched land context.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              <Check className="w-3.5 h-3.5 text-emerald-600" /> ULPIN Synchronized
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ULPIN (Bhu-Aadhaar)</label>
              <input
                type="text"
                value={landDetails.ulpin}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Survey Number</label>
              <input
                type="text"
                value={landDetails.surveyNumber}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sub-Division</label>
              <input
                type="text"
                value={landDetails.subDivision}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Land Extent</label>
              <input
                type="text"
                value={landDetails.landExtent}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">District & Taluk</label>
              <input
                type="text"
                value={`${landDetails.taluk}, ${landDetails.district}`}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Village</label>
              <input
                type="text"
                value={landDetails.village}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Classification</label>
              <input
                type="text"
                value={landDetails.currentLandClassification}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Existing Zoning</label>
              <input
                type="text"
                value={landDetails.existingZoning}
                readOnly
                className="w-full px-3 py-2 bg-rose-50/60 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PLANNING PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Planning Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Master plan compatibility, zoning categories, and proposed land-use parameters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Planning Area / Master Plan Area
              </label>
              <input
                type="text"
                value={planningParams.planningArea}
                onChange={(e) => setPlanningParams({ ...planningParams, planningArea: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Existing Zoning
              </label>
              <input
                type="text"
                value={planningParams.existingZoning}
                readOnly
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-800 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Current Land Use
              </label>
              <input
                type="text"
                value={planningParams.currentLandUse}
                onChange={(e) => setPlanningParams({ ...planningParams, currentLandUse: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Land Use <span className="text-red-500">*</span>
              </label>
              <select
                value={planningParams.proposedLandUse}
                onChange={(e) => setPlanningParams({ ...planningParams, proposedLandUse: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-rose-300 rounded-xl text-xs font-bold text-rose-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Institutional">Institutional</option>
                <option value="Mixed Use">Mixed Use</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Abutting Road Access
              </label>
              <input
                type="text"
                value={planningParams.roadAccess}
                onChange={(e) => setPlanningParams({ ...planningParams, roadAccess: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Abutting Road Width <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={planningParams.abuttingRoadWidth}
                onChange={(e) => setPlanningParams({ ...planningParams, abuttingRoadWidth: e.target.value })}
                placeholder="e.g. 18 m (60 ft)"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition ${
                  validationErrors.abuttingRoadWidth ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.abuttingRoadWidth && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.abuttingRoadWidth}</p>
              )}
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Development Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={planningParams.proposedDevelopmentType}
                onChange={(e) => setPlanningParams({ ...planningParams, proposedDevelopmentType: e.target.value })}
                placeholder="e.g. Group Housing, Commercial Complex, IT Park, Institutional Campus"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition ${
                  validationErrors.proposedDevelopmentType ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.proposedDevelopmentType && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.proposedDevelopmentType}</p>
              )}
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Development Purpose <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={planningParams.developmentPurpose}
                onChange={(e) => setPlanningParams({ ...planningParams, developmentPurpose: e.target.value })}
                placeholder="Brief purpose and end-use of the development"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Development Description
              </label>
              <textarea
                rows={2}
                value={planningParams.proposedDevelopmentDescription}
                onChange={(e) => setPlanningParams({ ...planningParams, proposedDevelopmentDescription: e.target.value })}
                placeholder="Detailed description including planned built-up, FSI/FAR proposal, setbacks, and parking provisions"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: LAND RECLASSIFICATION PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Land Reclassification Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Statutory reclassification under Section 47A of Town & Country Planning Act.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Current Classification
              </label>
              <input
                type="text"
                value={reclassificationParams.currentClassification}
                readOnly
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Reclassification <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reclassificationParams.proposedClassification}
                onChange={(e) => setReclassificationParams({ ...reclassificationParams, proposedClassification: e.target.value })}
                placeholder="e.g. Commercial / Mixed Use (C2 Zone)"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition ${
                  validationErrors.proposedClassification ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.proposedClassification && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.proposedClassification}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Reclassification Extent / Area
              </label>
              <input
                type="text"
                value={reclassificationParams.developmentArea}
                onChange={(e) => setReclassificationParams({ ...reclassificationParams, developmentArea: e.target.value })}
                placeholder="Full Extent or specific acreage"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Activity / Development <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reclassificationParams.proposedActivity}
                onChange={(e) => setReclassificationParams({ ...reclassificationParams, proposedActivity: e.target.value })}
                placeholder="Specific economic or civic activity to be conducted"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Reason for Reclassification <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reclassificationParams.reasonForReclassification}
                onChange={(e) => setReclassificationParams({ ...reclassificationParams, reasonForReclassification: e.target.value })}
                placeholder="Elaborate reasons for requesting change in master plan zoning, abutting infrastructure capacity, and socio-economic benefit"
                className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-600 focus:outline-none transition ${
                  validationErrors.reasonForReclassification ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.reasonForReclassification && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.reasonForReclassification}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: ZONING / RECLASSIFICATION DOCUMENTS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Service-Specific Planning Documents
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload master plan zoning extracts, site sketches, and survey records.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-900 block">
              Required Documents for Master Plan Zoning NOC & Reclassification:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {suggestedDocs.map((s, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${s.required ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'}`}>
                    {s.required ? 'Mandatory' : 'Optional'}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">{s.type}</span>
                    <span className="text-[11px] text-slate-500">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div className="space-y-3">
            <label className="block p-6 border-2 border-dashed border-rose-200 hover:border-rose-500 rounded-2xl text-center cursor-pointer bg-rose-50/20 hover:bg-rose-50/40 transition">
              <Upload className="w-8 h-8 text-rose-600 mx-auto mb-2" />
              <span className="text-xs font-bold text-rose-900 block">
                Click to upload planning maps & blueprints or drag and drop
              </span>
              <span className="text-[11px] text-slate-500">
                Supported formats: PDF, JPG, PNG (Max 10MB per file)
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {documentError && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {documentError}
              </p>
            )}

            {validationErrors.documents && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {validationErrors.documents}
              </p>
            )}

            {/* Uploaded Documents List */}
            {uploadedDocuments.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Attached Planning Documents ({uploadedDocuments.length})
                </h4>
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-rose-600" />
                      <div>
                        <p className="font-bold text-slate-900">{doc.documentName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{doc.fileSize}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
          >
            Cancel & Return
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-700/20 transition flex items-center justify-center gap-2 active:scale-95"
          >
            Review Application Details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};

export default ZoningReclassificationWorkflow;
