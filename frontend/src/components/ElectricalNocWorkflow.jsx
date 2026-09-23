import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Zap, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, Building2,
  FileText, Activity, AlertTriangle, Info, MapPin, Gauge,
  Radio, Cpu
} from 'lucide-react';
import api from '../services/api';

export const ElectricalNocWorkflow = ({
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
  // Retrieve real GIS electricity data from deptData.electricity if available, else 'GIS verification pending'
  const elecParams = deptData?.electricity?.parameters || [];
  const powerLineParam = elecParams.find(p => p.label?.toLowerCase().includes('power line'))?.value;
  const voltageParam = elecParams.find(p => p.label?.toLowerCase().includes('voltage level'))?.value;
  const poleParam = elecParams.find(p => p.label?.toLowerCase().includes('pole id'))?.value;
  const distTransformerParam = elecParams.find(p => p.label?.toLowerCase().includes('transformer'))?.value;
  const corridorParam = elecParams.find(p => p.label?.toLowerCase().includes('corridor'))?.value;

  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chengalpattu',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    landClassification: parcel?.landType === 'Commercial' ? 'Commercial Zone' : 'Residential Layout',
    nearestTransmissionLine: powerLineParam ? `110 kV Corridor / ${powerLineParam} Distribution Feeder` : 'GIS verification pending',
    transmissionLineVoltage: voltageParam || 'GIS verification pending',
    transmissionCorridor: corridorParam ? 'State Transmission Utility (TANGEDCO / TANTRANSCO Grid)' : 'GIS verification pending',
    existingInfrastructure: poleParam ? `Pole / Tower ID: ${poleParam}` : 'GIS verification pending',
    distanceToTransmissionLine: distTransformerParam || 'GIS verification pending'
  };

  // Section 1: Electrical Parameters
  const [electricalParams, setElectricalParams] = useState({
    applicationType: 'High-Tension Corridor NOC', // High-Tension Corridor NOC | Power Substation Clearance | Transmission Line Clearance | Electrical Infrastructure Clearance
    proposedDevelopmentType: 'Commercial', // Residential | Commercial | Industrial | Institutional | Other
    connectedLoad: '45 kW',
    requestedPowerLoad: '150 kVA',
    voltageRequirement: '11 kV High Tension (HT)',
    nearestHtLine: landDetails.nearestTransmissionLine,
    voltageLevel: voltageParam || '110 kV',
    lineType: 'Overhead High Tension Double Circuit (DC)',
    towerPoleNumber: poleParam || 'Tower # T-42/B',
    distanceFromBoundaryToHtLine: '35.0 meters',
    distanceFromStructureToHtLine: '42.0 meters',
    proposedStructureHeight: '14.5 meters (G+3 Floors)',
    existingStructureHeight: '0.0 meters (Vacant Land)',
    substationRequired: 'No' // 'Yes' | 'No'
  });

  // Conditional Substation Parameters
  const [substationParams, setSubstationParams] = useState({
    proposedSubstationCapacity: '250 kVA Package Substation',
    substationType: 'Indoor Plinth Mounted Compact Substation (CSS)',
    substationLocation: 'North-West corner abutting 18m municipal access road',
    substationArea: '400 sq.ft. (20 ft x 20 ft Dedicated Enclosure)'
  });

  // Section 2: Electrical Safety & RoW Parameters
  const [safetyParams, setSafetyParams] = useState({
    requiredElectricalClearance: '5.2 meters horizontal / 4.6 meters vertical (CEA Safety Regulations, 2010)',
    availableElectricalClearance: '18.5 meters Horizontal Clearance',
    rowRequirement: '22.0 meters Total RoW Corridor',
    existingElectricalEasement: 'No', // 'Yes' | 'No'
    encroachmentIntoCorridor: 'No', // 'Yes' | 'No'
    encroachmentDescription: '',
    encroachmentArea: '',
    infrastructureType: 'Overhead' // 'Underground' | 'Overhead'
  });

  // Section 3: Supporting Electrical Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission & Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  // Suggested / Required Document Checklist
  const suggestedDocs = [
    { type: 'Site Electrical Layout', desc: 'Overlaid plot boundary with HT transmission corridor and safety distances', required: true },
    { type: 'Power Load Sanction Request', desc: 'Detailed load calculation sheet with diversity factor for sanctioned demand', required: true },
    { type: 'Cadastral FMB Sketch', desc: 'Field Measurement Book sketch showing parcel geometry and nearby electrical poles', required: true },
    { type: 'Survey Sketch', desc: 'Demarcation sketch indicating precise distances to nearest transmission towers', required: false },
    { type: 'Patta / Ownership Record', desc: 'Certified revenue Patta record validating legal title', required: true },
    { type: 'Registered Title Document', desc: 'Registered Sale Deed / Title deed confirming lawful ownership', required: true },
    { type: 'Site Plan', desc: 'Overall site plan showing proposed structures, setbacks, and electrical entries', required: true },
    { type: 'Proposed Building / Layout Plan', desc: 'Architectural blueprint showing building elevation and cross-sectional heights', required: true },
    { type: 'Electrical Single-Line Diagram', desc: 'SLD certified by Chartered Electrical Engineer / Licensed Contractor', required: electricalParams.requestedPowerLoad !== '' || electricalParams.substationRequired === 'Yes' },
    { type: 'Substation Layout', desc: 'Detailed civil layout of transformer yard/substation room with safety clearances', required: electricalParams.substationRequired === 'Yes' },
    { type: 'Identity Proof', desc: 'Aadhaar Card / Voter ID / Passport of applicant or authorized signatory', required: true }
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

    if (!electricalParams.applicationType) {
      errs.applicationType = 'Please select the application type.';
    }

    if (!electricalParams.proposedDevelopmentType) {
      errs.proposedDevelopmentType = 'Please enter the proposed development type.';
    }

    if (!electricalParams.requestedPowerLoad || !electricalParams.requestedPowerLoad.trim()) {
      errs.requestedPowerLoad = 'Please enter the required power load.';
    }

    if (safetyParams.encroachmentIntoCorridor === 'Yes') {
      if (!safetyParams.encroachmentDescription?.trim()) {
        errs.encroachmentDescription = 'Please specify the corridor encroachment description.';
      }
      if (!safetyParams.encroachmentArea?.trim()) {
        errs.encroachmentArea = 'Please enter the affected corridor area.';
      }
    }

    if (electricalParams.substationRequired === 'Yes') {
      if (!substationParams.proposedSubstationCapacity?.trim()) {
        errs.proposedSubstationCapacity = 'Please enter proposed substation capacity.';
      }
      if (!substationParams.substationArea?.trim()) {
        errs.substationArea = 'Please enter dedicated substation enclosure area.';
      }
    }

    if (uploadedDocuments.length === 0) {
      errs.documents = 'Please provide the required electrical documents.';
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
      // Lookup service ID for SRV-ELEC-12 (High-Tension Corridor NOC & Power Substation Clearance)
      let serviceId = 12;
      try {
        const servicesRes = await api.get('/api/services');
        const elecService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-ELEC-12' || s.serviceName?.toLowerCase().includes('high-tension') || s.serviceName?.toLowerCase().includes('substation') || s.serviceName?.toLowerCase().includes('corridor')
        );
        if (elecService) serviceId = elecService.id;
      } catch (err) {
        console.warn('Could not lookup service id, defaulting to 12', err);
      }

      // Generate dynamic application ID format: ELEC-2026-XXXXXXXX
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const dynamicAppId = `ELEC-2026-${randomDigits}`;

      const remarksSummary = `[High-Tension Corridor NOC & Power Substation Clearance] App Type: ${electricalParams.applicationType} | Dev Type: ${electricalParams.proposedDevelopmentType} | Load: Req ${electricalParams.requestedPowerLoad} (Conn: ${electricalParams.connectedLoad}, Volt: ${electricalParams.voltageRequirement}) | HT Line: ${electricalParams.nearestHtLine} (${electricalParams.voltageLevel}) | Dist to HT: Boundary ${electricalParams.distanceFromBoundaryToHtLine}, Structure ${electricalParams.distanceFromStructureToHtLine} | Height: Prop ${electricalParams.proposedStructureHeight} | Clearance: ${safetyParams.availableElectricalClearance} (Req: ${safetyParams.requiredElectricalClearance}) | Substation: ${electricalParams.substationRequired}${electricalParams.substationRequired === 'Yes' ? ` (${substationParams.proposedSubstationCapacity}, ${substationParams.substationArea}, ${substationParams.substationType})` : ''} | Encroachment: ${safetyParams.encroachmentIntoCorridor}`;

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
        applicationType: electricalParams.applicationType,
        requestedLoad: electricalParams.requestedPowerLoad,
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
      setSubmitError(err.response?.data?.message || 'Failed to submit Electrical NOC application. Please try again.');
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
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider">
            Electricity / Power Transmission Department
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Electrical NOC & Corridor Clearance Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your technical application for high-tension transmission clearance and substation right-of-way safety appraisal has been officially logged with the Chief Electrical Inspectorate.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
            <span className="text-slate-500 font-sans font-bold">Application ID:</span>
            <span className="font-black text-amber-600 text-base">{generatedApplication.applicationNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-sans font-bold block">Service:</span>
              <span className="font-bold text-slate-900">High-Tension Corridor NOC & Power Substation Clearance</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Application Type:</span>
              <span className="font-bold text-amber-800">{electricalParams.applicationType}</span>
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
              <span className="text-slate-500 font-sans font-bold block">Requested Load:</span>
              <span className="font-bold text-slate-900">{electricalParams.requestedPowerLoad} ({electricalParams.voltageRequirement})</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Submission Date:</span>
              <span className="font-bold text-slate-900">{generatedApplication.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Statutory SLA:</span>
              <span className="font-bold text-amber-700">7 Working Days</span>
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
            className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
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
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Review Statutory Dossier
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                High-Tension Corridor NOC & Power Substation Clearance
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Statutory Fee</span>
            <span className="text-lg font-black text-amber-600">₹750</span>
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
            <MapPin className="w-4 h-4 text-amber-500" />
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

        {/* 2. Electrical Parameters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            2. Electrical Demand & Transmission Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Application Type:</span>
              <span className="font-bold text-amber-800">{electricalParams.applicationType}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Development Type:</span>
              <span className="font-bold text-slate-900">{electricalParams.proposedDevelopmentType}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Requested Power Load:</span>
              <span className="font-bold text-amber-700">{electricalParams.requestedPowerLoad}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Connected Load:</span>
              <span className="font-bold text-slate-900">{electricalParams.connectedLoad}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Supply Voltage:</span>
              <span className="font-bold text-slate-900">{electricalParams.voltageRequirement}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Nearest HT Line:</span>
              <span className="font-bold text-slate-900">{electricalParams.nearestHtLine} ({electricalParams.voltageLevel})</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Distance Boundary to HT Line:</span>
              <span className="font-bold text-slate-900">{electricalParams.distanceFromBoundaryToHtLine}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Distance Structure to HT Line:</span>
              <span className="font-bold text-slate-900">{electricalParams.distanceFromStructureToHtLine}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Proposed Structure Height:</span>
              <span className="font-bold text-slate-900">{electricalParams.proposedStructureHeight}</span>
            </div>
          </div>
        </div>

        {/* 3. Safety Clearance & RoW */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-500" />
            3. Electrical Safety Clearance & Statutory RoW
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Statutory Clearance (CEA):</span>
              <span className="font-bold text-slate-900">{safetyParams.requiredElectricalClearance}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Available Clearance:</span>
              <span className="font-bold text-emerald-700">{safetyParams.availableElectricalClearance}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">RoW Corridor Requirement:</span>
              <span className="font-bold text-slate-900">{safetyParams.rowRequirement}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Corridor Encroachment:</span>
              <span className={`font-bold ${safetyParams.encroachmentIntoCorridor === 'Yes' ? 'text-red-600' : 'text-emerald-700'}`}>
                {safetyParams.encroachmentIntoCorridor}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Transmission Line Type:</span>
              <span className="font-bold text-slate-900">{safetyParams.infrastructureType}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Substation Required:</span>
              <span className="font-bold text-slate-900">{electricalParams.substationRequired}</span>
            </div>
          </div>
        </div>

        {/* 4. Substation Specifications (Conditional) */}
        {electricalParams.substationRequired === 'Yes' && (
          <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-2 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-600" />
              4. Dedicated Substation Parameters (Conditional)
            </h3>
            <p><span className="font-bold text-slate-600">Substation Capacity:</span> {substationParams.proposedSubstationCapacity}</p>
            <p><span className="font-bold text-slate-600">Substation Type:</span> {substationParams.substationType}</p>
            <p><span className="font-bold text-slate-600">Dedicated Area:</span> {substationParams.substationArea}</p>
            <p><span className="font-bold text-slate-600">Location:</span> {substationParams.substationLocation}</p>
          </div>
        )}

        {/* 5. Documents Attached */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            5. Attached Electrical Documents ({uploadedDocuments.length})
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
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              required
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-700 focus:ring-amber-500"
            />
            <span className="font-semibold leading-relaxed">
              I certify that all planned structures maintain the statutory horizontal and vertical clearances from high-tension transmission conductors as mandated under the Central Electricity Authority (Measures relating to Safety and Electric Supply) Regulations, 2010.
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
            className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Submitting Electrical NOC Application...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Electrical NOC Application
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
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                SRV-ELEC-12 • SLA: 7 Days • Fee: ₹750
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              High-Tension Corridor NOC & Power Substation Clearance
            </h1>
            <p className="text-xs text-slate-500">
              Electricity / Power Transmission Statutory Safety Clearance
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-sm">
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
        <div className="bg-gradient-to-r from-amber-50/40 via-slate-50 to-amber-50/40 rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm">
                01
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Target Land Parcel & Grid Infrastructure (Read-Only)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pre-populated from identified Bhu-Aadhaar cadastre and GIS grid infrastructure layers.
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

          {/* GIS Electrical Read-Only Parameters */}
          <div className="pt-2 border-t border-amber-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-2">
              Retrieved Power Transmission & Utility Corridor Parameters:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Nearest HT Line:</span>
                <span className="font-bold text-slate-900">{landDetails.nearestTransmissionLine}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Grid Corridor:</span>
                <span className="font-bold text-slate-900">{landDetails.transmissionCorridor}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Transmission Voltage:</span>
                <span className="font-bold text-amber-700">{landDetails.transmissionLineVoltage}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Existing Infrastructure:</span>
                <span className="font-bold text-slate-900">{landDetails.existingInfrastructure}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Distance to Transmission Line:</span>
                <span className="font-bold text-slate-900">{landDetails.distanceToTransmissionLine}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Land Classification:</span>
                <span className="font-bold text-slate-900">{landDetails.landClassification}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ELECTRICAL DEMAND & TRANSMISSION PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Electrical Demand & HT Corridor Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Specify load requirements, HT corridor proximities, and building heights.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Application Type <span className="text-red-500">*</span>
              </label>
              <select
                value={electricalParams.applicationType}
                onChange={(e) => setElectricalParams({ ...electricalParams, applicationType: e.target.value })}
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition ${
                  validationErrors.applicationType ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="High-Tension Corridor NOC">High-Tension Corridor NOC</option>
                <option value="Power Substation Clearance">Power Substation Clearance</option>
                <option value="Transmission Line Clearance">Transmission Line Clearance</option>
                <option value="Electrical Infrastructure Clearance">Electrical Infrastructure Clearance</option>
              </select>
              {validationErrors.applicationType && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.applicationType}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Development Type <span className="text-red-500">*</span>
              </label>
              <select
                value={electricalParams.proposedDevelopmentType}
                onChange={(e) => setElectricalParams({ ...electricalParams, proposedDevelopmentType: e.target.value })}
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition ${
                  validationErrors.proposedDevelopmentType ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Institutional">Institutional</option>
                <option value="Other">Other</option>
              </select>
              {validationErrors.proposedDevelopmentType && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.proposedDevelopmentType}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Requested Power Load <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={electricalParams.requestedPowerLoad}
                onChange={(e) => setElectricalParams({ ...electricalParams, requestedPowerLoad: e.target.value })}
                placeholder="e.g. 150 kVA"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition ${
                  validationErrors.requestedPowerLoad ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.requestedPowerLoad && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.requestedPowerLoad}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Connected Load
              </label>
              <input
                type="text"
                value={electricalParams.connectedLoad}
                onChange={(e) => setElectricalParams({ ...electricalParams, connectedLoad: e.target.value })}
                placeholder="e.g. 45 kW"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Voltage Requirement
              </label>
              <select
                value={electricalParams.voltageRequirement}
                onChange={(e) => setElectricalParams({ ...electricalParams, voltageRequirement: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="415 V Low Tension (LT)">415 V Low Tension (LT Three-Phase)</option>
                <option value="11 kV High Tension (HT)">11 kV High Tension (HT Dedicated Feeder)</option>
                <option value="22 kV / 33 kV Extra High Tension">22 kV / 33 kV Extra High Tension (EHT)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Nearest HT Line
              </label>
              <input
                type="text"
                value={electricalParams.nearestHtLine}
                onChange={(e) => setElectricalParams({ ...electricalParams, nearestHtLine: e.target.value })}
                placeholder="Transmission Corridor Name"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Voltage Level
              </label>
              <input
                type="text"
                value={electricalParams.voltageLevel}
                onChange={(e) => setElectricalParams({ ...electricalParams, voltageLevel: e.target.value })}
                placeholder="e.g. 110 kV / 230 kV"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Transmission Line Type
              </label>
              <input
                type="text"
                value={electricalParams.lineType}
                onChange={(e) => setElectricalParams({ ...electricalParams, lineType: e.target.value })}
                placeholder="e.g. Overhead Double Circuit Lattice Tower"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Tower / Pole Number
              </label>
              <input
                type="text"
                value={electricalParams.towerPoleNumber}
                onChange={(e) => setElectricalParams({ ...electricalParams, towerPoleNumber: e.target.value })}
                placeholder="e.g. Tower # T-42/B"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Distance Property Boundary to HT Line
              </label>
              <input
                type="text"
                value={electricalParams.distanceFromBoundaryToHtLine}
                onChange={(e) => setElectricalParams({ ...electricalParams, distanceFromBoundaryToHtLine: e.target.value })}
                placeholder="e.g. 35.0 meters"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Distance Structure to HT Line
              </label>
              <input
                type="text"
                value={electricalParams.distanceFromStructureToHtLine}
                onChange={(e) => setElectricalParams({ ...electricalParams, distanceFromStructureToHtLine: e.target.value })}
                placeholder="e.g. 42.0 meters"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Structure Height
              </label>
              <input
                type="text"
                value={electricalParams.proposedStructureHeight}
                onChange={(e) => setElectricalParams({ ...electricalParams, proposedStructureHeight: e.target.value })}
                placeholder="e.g. 14.5 meters (G+3 Floors)"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Substation Required
              </label>
              <select
                value={electricalParams.substationRequired}
                onChange={(e) => setElectricalParams({ ...electricalParams, substationRequired: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="No">No (Fed via existing distribution network)</option>
                <option value="Yes">Yes (Dedicated Substation Planned)</option>
              </select>
            </div>
          </div>

          {/* CONDITIONAL: SUBSTATION PARAMETERS */}
          {electricalParams.substationRequired === 'Yes' && (
            <div className="pt-4 border-t border-slate-200 space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Dedicated Substation Parameters (Conditional)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Substation Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={substationParams.proposedSubstationCapacity}
                    onChange={(e) => setSubstationParams({ ...substationParams, proposedSubstationCapacity: e.target.value })}
                    placeholder="e.g. 250 kVA"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                  {validationErrors.proposedSubstationCapacity && (
                    <p className="text-[11px] text-red-600 font-semibold">{validationErrors.proposedSubstationCapacity}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Substation Type
                  </label>
                  <input
                    type="text"
                    value={substationParams.substationType}
                    onChange={(e) => setSubstationParams({ ...substationParams, substationType: e.target.value })}
                    placeholder="e.g. Indoor Plinth Mounted"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Substation Dedicated Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={substationParams.substationArea}
                    onChange={(e) => setSubstationParams({ ...substationParams, substationArea: e.target.value })}
                    placeholder="e.g. 400 sq.ft."
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                  {validationErrors.substationArea && (
                    <p className="text-[11px] text-red-600 font-semibold">{validationErrors.substationArea}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Substation Location
                  </label>
                  <input
                    type="text"
                    value={substationParams.substationLocation}
                    onChange={(e) => setSubstationParams({ ...substationParams, substationLocation: e.target.value })}
                    placeholder="Corner / Plot Entry Point"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: ELECTRICAL SAFETY & ROW PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Electrical Safety Clearance & Corridor Encroachment
              </h3>
              <p className="text-[11px] text-slate-500">
                Verification against Central Electricity Authority (CEA) Safety Regulations, 2010.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Required Electrical Clearance
              </label>
              <input
                type="text"
                value={safetyParams.requiredElectricalClearance}
                onChange={(e) => setSafetyParams({ ...safetyParams, requiredElectricalClearance: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Available Electrical Clearance
              </label>
              <input
                type="text"
                value={safetyParams.availableElectricalClearance}
                onChange={(e) => setSafetyParams({ ...safetyParams, availableElectricalClearance: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Right-of-Way (RoW) Requirement
              </label>
              <input
                type="text"
                value={safetyParams.rowRequirement}
                onChange={(e) => setSafetyParams({ ...safetyParams, rowRequirement: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Existing Electrical Easement
              </label>
              <select
                value={safetyParams.existingElectricalEasement}
                onChange={(e) => setSafetyParams({ ...safetyParams, existingElectricalEasement: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="No">No Easement Registered</option>
                <option value="Yes">Yes (Easement on Record)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Encroachment into Electrical Corridor
              </label>
              <select
                value={safetyParams.encroachmentIntoCorridor}
                onChange={(e) => setSafetyParams({ ...safetyParams, encroachmentIntoCorridor: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="No">No Encroachment</option>
                <option value="Yes">Yes (Structure in Corridor)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Infrastructure Mode
              </label>
              <select
                value={safetyParams.infrastructureType}
                onChange={(e) => setSafetyParams({ ...safetyParams, infrastructureType: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="Overhead">Overhead High Tension Line</option>
                <option value="Underground">Underground Cable Corridor</option>
              </select>
            </div>

            {/* CONDITIONAL: CORRIDOR ENCROACHMENT DETAILS */}
            {safetyParams.encroachmentIntoCorridor === 'Yes' && (
              <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-2xl border border-red-200 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-red-900">
                    Encroachment Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={safetyParams.encroachmentDescription}
                    onChange={(e) => setSafetyParams({ ...safetyParams, encroachmentDescription: e.target.value })}
                    placeholder="Describe shed / fence / structure within RoW"
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                  />
                  {validationErrors.encroachmentDescription && (
                    <p className="text-[11px] text-red-600 font-semibold">{validationErrors.encroachmentDescription}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-red-900">
                    Encroachment Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={safetyParams.encroachmentArea}
                    onChange={(e) => setSafetyParams({ ...safetyParams, encroachmentArea: e.target.value })}
                    placeholder="e.g. 15 sq.m / 160 sq.ft."
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
                  />
                  {validationErrors.encroachmentArea && (
                    <p className="text-[11px] text-red-600 font-semibold">{validationErrors.encroachmentArea}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: ELECTRICAL DOCUMENTS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Electrical & Technical Supporting Documents
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload electrical layouts, load sanction request, FMB sketches, and single-line diagrams.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
              Required Documents for Electrical NOC & Clearance:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {suggestedDocs.map((s, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${s.required ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-600'}`}>
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
            <label className="block p-6 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-2xl text-center cursor-pointer bg-amber-50/20 hover:bg-amber-50/40 transition">
              <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <span className="text-xs font-bold text-amber-900 block">
                Click to upload electrical diagrams, sketches & plans or drag and drop
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
                      <FileText className="w-4 h-4 text-amber-600" />
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
            className="w-full sm:w-auto px-8 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-2 active:scale-95"
          >
            Review Electrical Dossier
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};

export default ElectricalNocWorkflow;
