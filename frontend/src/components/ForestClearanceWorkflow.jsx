import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Trees, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, Building2,
  FileText, Leaf, AlertTriangle, Info, MapPin, Compass,
  Layers, Flower2
} from 'lucide-react';
import api from '../services/api';

export const ForestClearanceWorkflow = ({
  parcel,
  deptData,
  user,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Workflow steps: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Automatic Land Details (Inherited & locked from searched parcel context)
  // Retrieve real GIS forest data from deptData.environment if available, else 'GIS verification pending'
  const envParams = deptData?.environment?.parameters || [];
  const forestDistParam = envParams.find(p => p.label?.toLowerCase().includes('forest buffer') || p.label?.toLowerCase().includes('distance'))?.value;
  const eszParam = envParams.find(p => p.label?.toLowerCase().includes('eco-sensitive') || p.label?.toLowerCase().includes('esz'))?.value;
  const envZoneParam = envParams.find(p => p.label?.toLowerCase().includes('environmental zone'))?.value;

  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chengalpattu',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    landClassification: parcel?.landType === 'Wet' ? 'Wet Agricultural (Nanjai)' : 'Dry Land (Punjai) / Urban Buffer',
    forestClassification: 'Reserved Forest Fringe Buffer',
    nearbyProtectedArea: 'Nanmangalam Forest Reserve / Vandalur Protected Perimeter',
    ecoSensitiveZone: eszParam ? (eszParam === 'No' ? 'Outside Declared ESZ' : eszParam) : 'GIS verification pending',
    bufferZone: forestDistParam ? `1.0 km Declared Statutory Buffer Zone` : 'GIS verification pending',
    distanceToProtectedArea: forestDistParam || 'GIS verification pending',
    existingLandUse: parcel?.landUse || 'Agricultural / Vacant Plot'
  };

  // Section 1: Ecological Parameters
  const [ecoParams, setEcoParams] = useState({
    applicationType: 'Eco-Sensitive Zone Clearance', // Eco-Sensitive Zone Clearance | Reserve Forest Clearance | Protected Area Buffer Clearance | Forest Boundary Verification | Other
    currentLandUse: parcel?.landUse === 'Residential' ? 'Residential' : 'Agricultural', // Agricultural | Residential | Commercial | Industrial | Institutional | Forest | Other
    proposedLandUse: 'Eco-Friendly Low-Impact Institutional / Residential Campus',
    proposedActivity: 'Construction of single-storey green dwelling units with zero discharge effluent management',
    developmentArea: '1.20 Acres',
    totalProjectArea: landDetails.landExtent,
    treeCoverPresent: 'Yes', // 'Yes' | 'No'
    numberOfExistingTrees: '14 Native Shade Trees (Neem, Tamarind, Banyan)',
    treeRemovalProposed: 'No', // 'Yes' | 'No'
    numberOfTreesProposedForRemoval: '0',
    reasonForTreeRemoval: '',
    nearestForestArea: 'Nanmangalam Reserve Forest Margin',
    nearestEcoSensitiveZone: 'Nanmangalam Bird Sanctuary ESZ Buffer',
    distanceFromProtectedArea: landDetails.distanceToProtectedArea,
    distanceFromForestBoundary: landDetails.distanceToProtectedArea,
    environmentalImpactDescription: 'Zero tree felling proposed. Rainwater percolation pits and decentralized bio-digester planned to prevent runoff into reserve forest aquifer.'
  });

  // Section 2: Forest & Buffer Parameters (GIS status)
  const [bufferParams, setBufferParams] = useState({
    forestBoundaryStatus: 'Outside Forest Boundary', // Outside Forest Boundary | Adjacent to Forest Boundary | Within Declared Buffer | Requires Verification
    ecoSensitiveZoneStatus: 'Within ESZ', // Outside ESZ | Within ESZ | Requires Verification
    protectedAreaStatus: 'Within Buffer', // Outside Protected Area | Within Buffer | Requires Verification
    eszGuidelinesAcknowledged: true,
    mitigationPlanSummary: 'No ground water over-extraction; strict adherence to MoEFCC Gazette Notification for Eco-Sensitive Zones.'
  });

  // Section 3: Supporting Forest Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission & Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  // Suggested / Required Document Checklist
  const suggestedDocs = [
    { type: 'Cadastral Map with GPS Boundary', desc: 'DGPS survey map overlaid with cadastral boundaries and GPS polygon', required: true },
    { type: 'Survey Sketch / FMB', desc: 'Field Measurement Book (FMB) sketch verified by Taluk Surveyor', required: true },
    { type: 'Patta / Land Record', desc: 'Computerized patta record or revenue extract establishing title', required: true },
    { type: 'Registered Title Document', desc: 'Registered Sale Deed / Title conveyance document', required: true },
    { type: 'Site Plan', desc: 'Demarcated layout highlighting forest boundary clearance margin and setbacks', required: true },
    { type: 'Topographical Map', desc: 'Contours and natural drainage channels in relation to forest perimeters', required: false },
    { type: 'Tree Census / Tree Inventory', desc: 'Enumeration of existing trees and botanical species on site', required: ecoParams.treeCoverPresent === 'Yes' },
    { type: 'Proposed Development Plan', desc: 'Architectural site plan indicating proposed built-up and open green cover', required: true },
    { type: 'Environmental / Site Report', desc: 'Preliminary Environmental Impact Assessment (EIA) / Soil percolation report', required: false },
    { type: 'Identity Proof', desc: 'Aadhaar Card / Voter ID / Passport of applicant', required: true }
  ];

  // Document Upload Handlers
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setDocumentError('');
    const newDocs = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setDocumentError(`File "${file.name}" exceeds the 10MB limit.`);
        continue;
      }

      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setDocumentError(`File "${file.name}" is not a valid format. Please upload PDF, JPG, or PNG.`);
        continue;
      }

      newDocs.push({
        id: Date.now() + Math.random(),
        documentType: file.name.replace(/\.[^/.]+$/, ''),
        documentName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileObj: file,
        uploadedAt: new Date().toISOString()
      });
    }

    setUploadedDocuments(prev => [...prev, ...newDocs]);
    e.target.value = '';
  };

  const handleRemoveDoc = (id) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};

    if (!ecoParams.applicationType) {
      errs.applicationType = 'Please select the application type.';
    }

    if (!ecoParams.currentLandUse) {
      errs.currentLandUse = 'Please select the current land use.';
    }

    if (!ecoParams.proposedActivity || !ecoParams.proposedActivity.trim()) {
      errs.proposedActivity = 'Please enter the proposed activity.';
    }

    if (ecoParams.treeRemovalProposed === 'Yes') {
      if (!ecoParams.numberOfTreesProposedForRemoval || ecoParams.numberOfTreesProposedForRemoval === '0') {
        errs.numberOfTreesProposedForRemoval = 'Please state the number of trees proposed for removal.';
      }
      if (!ecoParams.reasonForTreeRemoval?.trim()) {
        errs.reasonForTreeRemoval = 'Please specify the rationale for proposed tree felling.';
      }
    }

    if (uploadedDocuments.length === 0) {
      errs.documents = 'Please provide the required forest/environment documents.';
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
      // Lookup service ID for SRV-FOR-11 (Eco-Sensitive Buffer & Reserve Forest Clearance)
      let serviceId = 11;
      try {
        const servicesRes = await api.get('/api/services');
        const forService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-FOR-11' || s.serviceName?.toLowerCase().includes('forest') || s.serviceName?.toLowerCase().includes('eco-sensitive')
        );
        if (forService) serviceId = forService.id;
      } catch (err) {
        console.warn('Could not lookup service id, defaulting to 11', err);
      }

      // Generate dynamic application ID format: FOR-2026-XXXXXXXX
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const dynamicAppId = `FOR-2026-${randomDigits}`;

      const remarksSummary = `[Eco-Sensitive Buffer & Reserve Forest Clearance] App Type: ${ecoParams.applicationType} | Current Use: ${ecoParams.currentLandUse} | Proposed Use: ${ecoParams.proposedLandUse} | Activity: ${ecoParams.proposedActivity} | Dev Area: ${ecoParams.developmentArea} | Forest Boundary Status: ${bufferParams.forestBoundaryStatus} | ESZ Status: ${bufferParams.ecoSensitiveZoneStatus} | Protected Area Status: ${bufferParams.protectedAreaStatus} | Trees: ${ecoParams.treeCoverPresent} (${ecoParams.numberOfExistingTrees}) | Tree Removal: ${ecoParams.treeRemovalProposed}${ecoParams.treeRemovalProposed === 'Yes' ? ` (${ecoParams.numberOfTreesProposedForRemoval} trees, ${ecoParams.reasonForTreeRemoval})` : ''} | Nearest Forest: ${ecoParams.nearestForestArea} (${ecoParams.distanceFromForestBoundary})`;

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
        applicationType: ecoParams.applicationType,
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
      setSubmitError(err.response?.data?.message || 'Failed to submit Forest Clearance application. Please try again.');
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
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
            Forest & Environment Department
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Forest & ESZ Clearance Application Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your statutory dossier for ecological compliance verification and reserve forest boundary clearance has been successfully forwarded to the Divisional Forest Officer (DFO).
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
            <span className="text-slate-500 font-sans font-bold">Application ID:</span>
            <span className="font-black text-emerald-700 text-base">{generatedApplication.applicationNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-sans font-bold block">Service:</span>
              <span className="font-bold text-slate-900">Eco-Sensitive Buffer & Reserve Forest Clearance</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Application Type:</span>
              <span className="font-bold text-emerald-800">{ecoParams.applicationType}</span>
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
              <span className="text-slate-500 font-sans font-bold block">Boundary Status:</span>
              <span className="font-bold text-slate-900">{bufferParams.forestBoundaryStatus} • {bufferParams.ecoSensitiveZoneStatus}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Submission Date:</span>
              <span className="font-bold text-slate-900">{generatedApplication.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Statutory SLA:</span>
              <span className="font-bold text-emerald-800">21 Working Days</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Current Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
                <Clock className="w-3 h-3" /> Submitted
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => navigate('/applications')}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Track in Application History
          </button>
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
          >
            Return to Citizen Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 2: REVIEW & DECLARATION
  // ==========================================
  if (step === 'review') {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl max-w-4xl mx-auto space-y-6 animate-in fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
              title="Edit Form"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Review Statutory Dossier
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Eco-Sensitive Buffer & Reserve Forest Clearance
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Statutory Fee</span>
            <span className="text-lg font-black text-emerald-700">₹1,000</span>
          </div>
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 1. Cadastral Land Reference */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            1. Target Land Parcel Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-bold block">ULPIN:</span>
              <span className="font-mono font-bold text-slate-900">{landDetails.ulpin}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Survey / Sub-Div:</span>
              <span className="font-mono font-bold text-slate-900">{landDetails.surveyNumber} / {landDetails.subDivision}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Village & Taluk:</span>
              <span className="font-bold text-slate-900">{landDetails.village}, {landDetails.taluk}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">District & Extent:</span>
              <span className="font-bold text-slate-900">{landDetails.district} ({landDetails.landExtent})</span>
            </div>
          </div>
        </div>

        {/* 2. Ecological & Project Parameters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            2. Ecological Classification & Proposed Activity
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Application Type:</span>
              <span className="font-bold text-emerald-800">{ecoParams.applicationType}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Current Land Use:</span>
              <span className="font-bold text-slate-900">{ecoParams.currentLandUse}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Proposed Land Use:</span>
              <span className="font-bold text-slate-900">{ecoParams.proposedLandUse}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Development Area:</span>
              <span className="font-bold text-slate-900">{ecoParams.developmentArea}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Total Project Area:</span>
              <span className="font-bold text-slate-900">{ecoParams.totalProjectArea}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Nearest Protected Area:</span>
              <span className="font-bold text-slate-900">{ecoParams.nearestForestArea}</span>
            </div>
            <div className="col-span-2 sm:col-span-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-bold block">Proposed Activity:</span>
              <span className="font-medium text-slate-900">{ecoParams.proposedActivity}</span>
            </div>
          </div>
        </div>

        {/* 3. Forest & ESZ Parameters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Trees className="w-4 h-4 text-emerald-600" />
            3. Forest Boundary, ESZ & Protected Area Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Forest Boundary Status:</span>
              <span className="font-bold text-emerald-700">{bufferParams.forestBoundaryStatus}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Eco-Sensitive Zone (ESZ):</span>
              <span className="font-bold text-emerald-700">{bufferParams.ecoSensitiveZoneStatus}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Protected Area Buffer:</span>
              <span className="font-bold text-slate-900">{bufferParams.protectedAreaStatus}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Distance to Forest Boundary:</span>
              <span className="font-bold text-slate-900">{ecoParams.distanceFromForestBoundary}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Distance to Protected Area:</span>
              <span className="font-bold text-slate-900">{ecoParams.distanceFromProtectedArea}</span>
            </div>
          </div>
        </div>

        {/* 4. Tree Inventory & Felling Particulars */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Flower2 className="w-4 h-4 text-emerald-600" />
            4. Tree Inventory & Preservation Particulars
          </h3>
          <p><span className="font-bold text-slate-600">Tree Cover Present:</span> {ecoParams.treeCoverPresent} ({ecoParams.numberOfExistingTrees})</p>
          <p><span className="font-bold text-slate-600">Tree Removal Proposed:</span> {ecoParams.treeRemovalProposed}</p>
          {ecoParams.treeRemovalProposed === 'Yes' && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950">
              <span className="font-bold block">Felling Details:</span>
              <span>{ecoParams.numberOfTreesProposedForRemoval} trees to be felled. Reason: {ecoParams.reasonForTreeRemoval}</span>
            </div>
          )}
          <p><span className="font-bold text-slate-600">Environmental Safeguards:</span> {ecoParams.environmentalImpactDescription}</p>
        </div>

        {/* 5. Documents Attached */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            5. Attached Environmental Documents ({uploadedDocuments.length})
          </h3>
          <div className="space-y-1.5">
            {uploadedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800">{doc.documentName}</span>
                <span className="font-mono text-slate-500">{doc.fileSize}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Citizen Declaration */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              required
              className="mt-0.5 w-4 h-4 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-500"
            />
            <span className="font-semibold leading-relaxed">
              I solemnly affirm that the subject land does not encroach upon notified Reserve Forest, Wildlife Sanctuary, or Protected Area lands. I undertake to adhere to all statutory ESZ guidelines issued under the Environment (Protection) Act, 1986 and Forest Conservation Act, 1980.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition"
          >
            Modify Application
          </button>

          <button
            type="button"
            onClick={handleSubmitApplication}
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-700/30 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Submitting Forest Clearance Application...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Forest Clearance Application
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 1: DEDICATED APPLICATION FORM
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      {/* Workflow Navigation Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                SRV-FOR-11 • SLA: 21 Days • Fee: ₹1,000
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              Eco-Sensitive Buffer & Reserve Forest Clearance
            </h1>
            <p className="text-xs text-slate-500">
              Forest & Environment Statutory Boundary & Ecological Appraisal
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm">
            Step 1: Application Form
          </span>
          <span className="text-slate-300">→</span>
          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl">
            Step 2: Review & Submit
          </span>
        </div>
      </div>

      <form onSubmit={handleProceedToReview} className="space-y-6">

        {/* SECTION 1: AUTOMATIC LAND CONTEXT (Pre-populated from searched parcel) */}
        <div className="bg-gradient-to-r from-emerald-50/50 via-slate-50 to-emerald-50/50 rounded-3xl p-6 sm:p-7 border border-emerald-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                01
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Target Land Parcel & Ecological Setting (Read-Only)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pre-populated from identified Bhu-Aadhaar cadastre and GIS forest buffer polygons.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" /> Cadastre Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">ULPIN (Bhu-Aadhaar)</span>
              <input
                type="text"
                value={landDetails.ulpin}
                readOnly
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Survey / Sub-Division</span>
              <input
                type="text"
                value={`${landDetails.surveyNumber} / ${landDetails.subDivision}`}
                readOnly
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">District & Taluk</span>
              <input
                type="text"
                value={`${landDetails.district}, ${landDetails.taluk}`}
                readOnly
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Village & Land Extent</span>
              <input
                type="text"
                value={`${landDetails.village} • ${landDetails.landExtent}`}
                readOnly
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
          </div>

          {/* GIS Ecological Read-Only Parameters */}
          <div className="pt-2 border-t border-emerald-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-2">
              Retrieved Forest & Environmental GIS Parameters:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Forest Classification:</span>
                <span className="font-bold text-slate-900">{landDetails.forestClassification}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Nearby Protected Area:</span>
                <span className="font-bold text-slate-900">{landDetails.nearbyProtectedArea}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Eco-Sensitive Zone (ESZ):</span>
                <span className="font-bold text-emerald-800">{landDetails.ecoSensitiveZone}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Statutory Buffer Zone:</span>
                <span className="font-bold text-slate-900">{landDetails.bufferZone}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Distance to Protected Area:</span>
                <span className="font-bold text-slate-900">{landDetails.distanceToProtectedArea}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Existing Land Classification:</span>
                <span className="font-bold text-slate-900">{landDetails.landClassification}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ECOLOGICAL & DEVELOPMENT PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Ecological & Development Activity Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Specify application classification, land use change, and project footprint.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Application Type <span className="text-red-500">*</span>
              </label>
              <select
                value={ecoParams.applicationType}
                onChange={(e) => setEcoParams({ ...ecoParams, applicationType: e.target.value })}
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition ${
                  validationErrors.applicationType ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="Eco-Sensitive Zone Clearance">Eco-Sensitive Zone Clearance</option>
                <option value="Reserve Forest Clearance">Reserve Forest Clearance</option>
                <option value="Protected Area Buffer Clearance">Protected Area Buffer Clearance</option>
                <option value="Forest Boundary Verification">Forest Boundary Verification</option>
                <option value="Other">Other Ecological Clearance</option>
              </select>
              {validationErrors.applicationType && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.applicationType}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Current Land Use <span className="text-red-500">*</span>
              </label>
              <select
                value={ecoParams.currentLandUse}
                onChange={(e) => setEcoParams({ ...ecoParams, currentLandUse: e.target.value })}
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition ${
                  validationErrors.currentLandUse ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="Agricultural">Agricultural</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Institutional">Institutional</option>
                <option value="Forest">Forest</option>
                <option value="Other">Other</option>
              </select>
              {validationErrors.currentLandUse && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.currentLandUse}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Land Use
              </label>
              <input
                type="text"
                value={ecoParams.proposedLandUse}
                onChange={(e) => setEcoParams({ ...ecoParams, proposedLandUse: e.target.value })}
                placeholder="e.g. Eco-friendly Residential"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Development / Activity <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ecoParams.proposedActivity}
                onChange={(e) => setEcoParams({ ...ecoParams, proposedActivity: e.target.value })}
                placeholder="Nature of construction, excavation or commercial operation"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition ${
                  validationErrors.proposedActivity ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.proposedActivity && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.proposedActivity}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Development Area
              </label>
              <input
                type="text"
                value={ecoParams.developmentArea}
                onChange={(e) => setEcoParams({ ...ecoParams, developmentArea: e.target.value })}
                placeholder="e.g. 1.20 Acres"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Total Project Area
              </label>
              <input
                type="text"
                value={ecoParams.totalProjectArea}
                readOnly
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Tree Cover Present on Site
              </label>
              <select
                value={ecoParams.treeCoverPresent}
                onChange={(e) => setEcoParams({ ...ecoParams, treeCoverPresent: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              >
                <option value="Yes">Yes (Trees Identified)</option>
                <option value="No">No (Barren / Cleared Land)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Number of Existing Trees
              </label>
              <input
                type="text"
                value={ecoParams.numberOfExistingTrees}
                onChange={(e) => setEcoParams({ ...ecoParams, numberOfExistingTrees: e.target.value })}
                placeholder="e.g. 14 Trees"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Tree Removal Proposed
              </label>
              <select
                value={ecoParams.treeRemovalProposed}
                onChange={(e) => setEcoParams({ ...ecoParams, treeRemovalProposed: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              >
                <option value="No">No (Zero Tree Felling)</option>
                <option value="Yes">Yes (Tree Felling Proposed)</option>
              </select>
            </div>

            {/* CONDITIONAL: TREE REMOVAL PARTICULARS */}
            {ecoParams.treeRemovalProposed === 'Yes' && (
              <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-950">
                    Number of Trees Proposed for Removal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ecoParams.numberOfTreesProposedForRemoval}
                    onChange={(e) => setEcoParams({ ...ecoParams, numberOfTreesProposedForRemoval: e.target.value })}
                    placeholder="e.g. 3 Trees"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                  {validationErrors.numberOfTreesProposedForRemoval && (
                    <p className="text-[11px] text-red-600 font-semibold">{validationErrors.numberOfTreesProposedForRemoval}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-950">
                    Reason for Tree Removal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ecoParams.reasonForTreeRemoval}
                    onChange={(e) => setEcoParams({ ...ecoParams, reasonForTreeRemoval: e.target.value })}
                    placeholder="e.g. Falls within building driveway footprint"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                  {validationErrors.reasonForTreeRemoval && (
                    <p className="text-[11px] text-red-600 font-semibold">{validationErrors.reasonForTreeRemoval}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Environmental Impact & Mitigation Description
              </label>
              <textarea
                rows={2}
                value={ecoParams.environmentalImpactDescription}
                onChange={(e) => setEcoParams({ ...ecoParams, environmentalImpactDescription: e.target.value })}
                placeholder="Explain environmental safeguards, rainwater harvesting, and pollution abatement measures"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: FOREST & BUFFER PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Forest Boundary & Protected Area Zoning Status
              </h3>
              <p className="text-[11px] text-slate-500">
                Ecological zone status verified against official Gazette notifications.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Forest Boundary Status
              </label>
              <select
                value={bufferParams.forestBoundaryStatus}
                onChange={(e) => setBufferParams({ ...bufferParams, forestBoundaryStatus: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              >
                <option value="Outside Forest Boundary">Outside Forest Boundary</option>
                <option value="Adjacent to Forest Boundary">Adjacent to Forest Boundary</option>
                <option value="Within Declared Buffer">Within Declared Buffer</option>
                <option value="Requires Verification">Requires Verification</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Eco-Sensitive Zone Status
              </label>
              <select
                value={bufferParams.ecoSensitiveZoneStatus}
                onChange={(e) => setBufferParams({ ...bufferParams, ecoSensitiveZoneStatus: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              >
                <option value="Outside ESZ">Outside ESZ</option>
                <option value="Within ESZ">Within ESZ</option>
                <option value="Requires Verification">Requires Verification</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Protected Area Status
              </label>
              <select
                value={bufferParams.protectedAreaStatus}
                onChange={(e) => setBufferParams({ ...bufferParams, protectedAreaStatus: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none transition"
              >
                <option value="Outside Protected Area">Outside Protected Area</option>
                <option value="Within Buffer">Within Buffer</option>
                <option value="Requires Verification">Requires Verification</option>
              </select>
            </div>
          </div>

          {/* CONDITIONAL: ESZ / PROTECTED AREA VERIFICATION SECTION */}
          {(bufferParams.ecoSensitiveZoneStatus === 'Within ESZ' || ecoParams.applicationType === 'Eco-Sensitive Zone Clearance') && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Eco-Sensitive Zone (ESZ) Proximity Safeguards
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                As per Ministry of Environment, Forest and Climate Change (MoEFCC) guidelines, activities within the Eco-Sensitive Zone are classified into Prohibited, Regulated, and Permitted categories. Non-polluting domestic development is permissible subject to statutory DFO scrutiny.
              </p>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  ESZ Mitigation & Effluent Management Plan
                </label>
                <input
                  type="text"
                  value={bufferParams.mitigationPlanSummary}
                  onChange={(e) => setBufferParams({ ...bufferParams, mitigationPlanSummary: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: FOREST DOCUMENTS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Forest & Environmental Supporting Documents
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload cadastral map with GPS boundaries, tree census, and site plans.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block">
              Required Documents for Forest & ESZ Clearance:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {suggestedDocs.map((s, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${s.required ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
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
            <label className="block p-6 border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-2xl text-center cursor-pointer bg-emerald-50/20 hover:bg-emerald-50/40 transition">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <span className="text-xs font-bold text-emerald-900 block">
                Click to upload environmental & forest survey blueprints or drag and drop
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
                  Attached Technical Documents ({uploadedDocuments.length})
                </h4>
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="font-bold text-slate-900">{doc.documentName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{doc.fileSize} • Uploaded</p>
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
            className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-700/30 transition flex items-center justify-center gap-2 active:scale-95"
          >
            Review Forest Dossier
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};

export default ForestClearanceWorkflow;
