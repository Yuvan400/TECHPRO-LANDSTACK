import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Car, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, Building2,
  FileText, Navigation, Ruler, Layers, AlertTriangle, Info,
  Compass, MapPin
} from 'lucide-react';
import api from '../services/api';

export const HighwayAccessSetbackWorkflow = ({
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
  // Retrieve real GIS road data from deptData.pwd if available, else 'GIS verification pending'
  const pwdParams = deptData?.pwd?.parameters || [];
  const roadNameParam = pwdParams.find(p => p.label?.toLowerCase().includes('road') || p.label?.toLowerCase().includes('canal'))?.value;
  const roadWidthParam = pwdParams.find(p => p.label?.toLowerCase().includes('road width'))?.value;
  const rowParam = pwdParams.find(p => p.label?.toLowerCase().includes('right of way'))?.value;
  const distParam = pwdParams.find(p => p.label?.toLowerCase().includes('distance'))?.value;

  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chengalpattu',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    landClassification: parcel?.landType === 'Commercial' ? 'Commercial / Urban' : 'Wet Land (Nanjai) / Urban Boundary',
    existingRoadAccess: roadNameParam ? 'Available via Public Road' : 'GIS verification pending',
    roadName: roadNameParam || 'GIS verification pending',
    roadType: roadNameParam ? 'State Highway Link Road' : 'GIS verification pending',
    existingFrontage: roadWidthParam ? `${roadWidthParam} Frontage Width` : 'GIS verification pending',
    nearestHighway: roadNameParam ? 'SH-48 / Grand Southern Trunk Corridor' : 'GIS verification pending'
  };

  // Section 1: Highway Access Parameters
  const [highwayParams, setHighwayParams] = useState({
    highwayType: 'State Highway', // National Highway | State Highway | Major District Road | Other
    highwayName: roadNameParam || 'SH-48 Vandalur-Kelambakkam Highway',
    roadNumber: 'SH-48',
    roadFrontageLength: '45.5 meters',
    distanceToCentreline: '22.0 meters',
    existingRowWidth: rowParam || '30.0 meters',
    availableRoadWidth: roadWidthParam || '18.0 meters',
    proposedAccessType: 'New Access', // Existing Access | New Access | Modified Access
    proposedAccessWidth: '7.5 meters',
    numberOfAccessPoints: '1 Point',
    proposedDevelopmentType: 'Commercial', // Residential | Commercial | Industrial | Institutional | Other
    purposeOfAccess: 'Direct vehicular ingress and egress for approved commercial premises with dedicated acceleration/deceleration lane compliance.',
    siteAccessDescription: 'Access aligned to the eastern boundary abutting the highway with 120° sight distance triangle unobstructed by permanent structures.'
  });

  // Conditional Commercial / Industrial Logistics Parameters
  const [logisticsParams, setLogisticsParams] = useState({
    expectedVehicleMovement: '45 Peak Passenger Cars / 8 Supply Commercial Vans per Hour',
    heavyVehicleAccessRequired: 'Yes', // 'Yes' | 'No'
    parkingLoadingAreaDetails: 'Designated 14-bay internal off-street parking, 2 dedicated loading/unloading bays conforming to IRC:SP:41 standards.'
  });

  // Section 2: Setback & Encroachment Parameters
  const [setbackParams, setSetbackParams] = useState({
    requiredHighwaySetback: '15.0 meters from highway RoW boundary (IRC Norms)',
    existingSetback: '16.5 meters',
    proposedSetback: '16.5 meters',
    distanceFromHighwayBoundary: '16.5 meters',
    distanceFromRoadCentreline: '31.5 meters',
    encroachment: 'No', // 'Yes' | 'No'
    encroachmentDescription: '',
    encroachmentArea: ''
  });

  // Section 3: Supporting Highway Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission & Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  // Suggested / Required Document Checklist
  const suggestedDocs = [
    { type: 'Georeferenced Road Frontage Survey', desc: 'DGPS georeferenced plan showing parcel boundary and road frontage edge', required: true },
    { type: 'Access Road Engineering Plan', desc: 'Geometric layout of proposed entry/exit with turning radii and sight triangle', required: true },
    { type: 'Patta / Ownership Record', desc: 'Certified computer patta or revenue record confirming title', required: true },
    { type: 'Registered Sale Deed / Title Document', desc: 'Registered document proving legal ownership of the parcel', required: true },
    { type: 'Site Plan', desc: 'Cadastral site plan detailing setbacks, RoW line, and building footprints', required: true },
    { type: 'Highway Location Plan', desc: 'Key plan showing road chainage and proximity to nearest junction', required: false },
    { type: 'Proposed Access Layout', desc: 'Detailed civil drawing of curb cuts, median opening, and culvert bridge', required: highwayParams.proposedAccessType !== 'Existing Access' },
    { type: 'Survey Sketch', desc: 'FMB / Village cadastral sketch extract showing survey boundary', required: false },
    { type: 'Building / Layout Plan', desc: 'Proposed architectural blueprint if applying for building permission', required: false },
    { type: 'Identity Proof', desc: 'Aadhaar Card / Voter ID / Passport of applicant / authorized signatory', required: true }
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

    if (!highwayParams.highwayType) {
      errs.highwayType = 'Please select the highway type.';
    }

    if (!highwayParams.roadFrontageLength || !highwayParams.roadFrontageLength.trim()) {
      errs.roadFrontageLength = 'Please enter the road frontage.';
    }

    if (!highwayParams.proposedAccessWidth || !highwayParams.proposedAccessWidth.trim()) {
      errs.proposedAccessWidth = 'Please enter the proposed access width.';
    }

    if (setbackParams.encroachment === 'Yes') {
      if (!setbackParams.encroachmentDescription?.trim()) {
        errs.encroachmentDescription = 'Please specify the encroachment description.';
      }
      if (!setbackParams.encroachmentArea?.trim()) {
        errs.encroachmentArea = 'Please enter the affected encroachment area.';
      }
    }

    if (uploadedDocuments.length === 0) {
      errs.documents = 'Please provide the required highway documents.';
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
      // Lookup service ID for SRV-HWY-10 (National & State Highway Access Setback NOC)
      let serviceId = 10;
      try {
        const servicesRes = await api.get('/api/services');
        const hwyService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-HWY-10' || s.serviceName?.toLowerCase().includes('highway') || s.serviceName?.toLowerCase().includes('setback')
        );
        if (hwyService) serviceId = hwyService.id;
      } catch (err) {
        console.warn('Could not lookup service id, defaulting to 10', err);
      }

      // Generate dynamic application ID format: HWY-2026-XXXXXXXX
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const dynamicAppId = `HWY-2026-${randomDigits}`;

      const remarksSummary = `[National & State Highway Access Setback NOC] Highway Type: ${highwayParams.highwayType} | Road: ${highwayParams.highwayName} (${highwayParams.roadNumber}) | Frontage: ${highwayParams.roadFrontageLength} | RoW: ${highwayParams.existingRowWidth} | Available Width: ${highwayParams.availableRoadWidth} | Access Type: ${highwayParams.proposedAccessType} | Access Width: ${highwayParams.proposedAccessWidth} | Access Points: ${highwayParams.numberOfAccessPoints} | Dev Type: ${highwayParams.proposedDevelopmentType} | Setback: ${setbackParams.proposedSetback} (Req: ${setbackParams.requiredHighwaySetback}) | Encroachment: ${setbackParams.encroachment}${setbackParams.encroachment === 'Yes' ? ` (${setbackParams.encroachmentArea}, ${setbackParams.encroachmentDescription})` : ''} | Purpose: ${highwayParams.purposeOfAccess}`;

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
        highwayType: highwayParams.highwayType,
        roadName: highwayParams.highwayName,
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
      setSubmitError(err.response?.data?.message || 'Failed to submit Highway Access Setback NOC application. Please try again.');
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
        <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-black uppercase tracking-wider">
            Highways / Roads & Infrastructure Department
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Highway Access Setback NOC Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your statutory application for ribbon development compliance and highway right-of-way (RoW) access clearance has been officially registered.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
            <span className="text-slate-500 font-sans font-bold">Application ID:</span>
            <span className="font-black text-amber-700 text-base">{generatedApplication.applicationNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-sans font-bold block">Service:</span>
              <span className="font-bold text-slate-900">National & State Highway Access Setback NOC</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Highway Classification:</span>
              <span className="font-bold text-amber-800">{highwayParams.highwayType} ({highwayParams.roadNumber})</span>
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
              <span className="text-slate-500 font-sans font-bold block">Road Frontage & Access:</span>
              <span className="font-bold text-slate-900">{highwayParams.roadFrontageLength} • {highwayParams.proposedAccessWidth} Width</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Submission Date:</span>
              <span className="font-bold text-slate-900">{generatedApplication.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Statutory SLA:</span>
              <span className="font-bold text-amber-800">10 Working Days</span>
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
                National & State Highway Access Setback NOC
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Statutory Fee</span>
            <span className="text-lg font-black text-amber-700">₹1,200</span>
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
            <MapPin className="w-4 h-4 text-amber-600" />
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

        {/* 2. Highway & Access Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Car className="w-4 h-4 text-amber-600" />
            2. Highway Specification & Access Layout
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Highway Classification:</span>
              <span className="font-bold text-slate-900">{highwayParams.highwayType}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Road Name & Number:</span>
              <span className="font-bold text-slate-900">{highwayParams.highwayName} ({highwayParams.roadNumber})</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Road Frontage Length:</span>
              <span className="font-bold text-amber-800">{highwayParams.roadFrontageLength}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Existing Right-of-Way (RoW):</span>
              <span className="font-bold text-slate-900">{highwayParams.existingRowWidth}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Available Carriageway Width:</span>
              <span className="font-bold text-slate-900">{highwayParams.availableRoadWidth}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Distance to Highway Centreline:</span>
              <span className="font-bold text-slate-900">{highwayParams.distanceToCentreline}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Access Type:</span>
              <span className="font-bold text-slate-900">{highwayParams.proposedAccessType}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Proposed Access Width:</span>
              <span className="font-bold text-amber-800">{highwayParams.proposedAccessWidth}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Number of Access Points:</span>
              <span className="font-bold text-slate-900">{highwayParams.numberOfAccessPoints}</span>
            </div>
          </div>
        </div>

        {/* 3. Setback & RoW Compliance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-amber-600" />
            3. Highway Setback & Encroachment Appraisal
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-bold block">Required Setback (IRC):</span>
              <span className="font-bold text-slate-900">{setbackParams.requiredHighwaySetback}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Proposed Setback:</span>
              <span className="font-bold text-emerald-700">{setbackParams.proposedSetback}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold block">Encroachment into RoW:</span>
              <span className={`font-bold ${setbackParams.encroachment === 'Yes' ? 'text-red-600' : 'text-emerald-700'}`}>
                {setbackParams.encroachment}
              </span>
            </div>
            {setbackParams.encroachment === 'Yes' && (
              <div className="col-span-2 sm:col-span-3 bg-red-50 p-3 rounded-xl border border-red-200">
                <span className="text-red-800 font-bold block">Encroachment Particulars:</span>
                <span className="text-slate-700">{setbackParams.encroachmentArea} — {setbackParams.encroachmentDescription}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Development & Vehicle Logistics */}
        {(highwayParams.proposedDevelopmentType === 'Commercial' || highwayParams.proposedDevelopmentType === 'Industrial') && (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              4. Commercial Logistics & Vehicular Movement
            </h3>
            <p><span className="font-bold text-slate-600">Peak Movements:</span> {logisticsParams.expectedVehicleMovement}</p>
            <p><span className="font-bold text-slate-600">Heavy Vehicle Access:</span> {logisticsParams.heavyVehicleAccessRequired}</p>
            <p><span className="font-bold text-slate-600">Parking & Loading Dock:</span> {logisticsParams.parkingLoadingAreaDetails}</p>
          </div>
        )}

        {/* 5. Documents Attached */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            5. Attached Technical Documents ({uploadedDocuments.length})
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
              I hereby declare that all particulars regarding highway right-of-way, road frontage, proposed setbacks, and ingress/egress points are true and comply with the Indian Roads Congress (IRC:73 / IRC:SP:84) ribbon development guidelines and State Highway regulations.
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
                Submitting Highway Access NOC...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Highway Access NOC
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
                SRV-HWY-10 • SLA: 10 Days • Fee: ₹1,200
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              National & State Highway Access Setback NOC
            </h1>
            <p className="text-xs text-slate-500">
              Highways / Roads & Infrastructure Statutory Clearance
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm">
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
        <div className="bg-gradient-to-r from-amber-50/50 via-slate-50 to-amber-50/50 rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                01
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Target Land Parcel & Road Interface (Read-Only)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pre-populated from identified Bhu-Aadhaar cadastre and GIS road networks.
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

          {/* GIS Road Network Read-Only Parameters */}
          <div className="pt-2 border-t border-amber-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-2">
              Retrieved Highway & Infrastructure Network Parameters:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Existing Road Access:</span>
                <span className="font-bold text-slate-900">{landDetails.existingRoadAccess}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Nearest Highway / Corridor:</span>
                <span className="font-bold text-slate-900">{landDetails.nearestHighway}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Existing Road Frontage:</span>
                <span className="font-bold text-slate-900">{landDetails.existingFrontage}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="text-slate-500 text-[10px] block font-sans font-bold">Right-of-Way (RoW) Width:</span>
                <span className="font-bold text-slate-900">{landDetails.roadType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: HIGHWAY ACCESS PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Highway Access & Geometry Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Specify highway classification, frontage measurements, and access points.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Highway Type <span className="text-red-500">*</span>
              </label>
              <select
                value={highwayParams.highwayType}
                onChange={(e) => setHighwayParams({ ...highwayParams, highwayType: e.target.value })}
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition ${
                  validationErrors.highwayType ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="National Highway">National Highway (NH)</option>
                <option value="State Highway">State Highway (SH)</option>
                <option value="Major District Road">Major District Road (MDR)</option>
                <option value="Other">Other PWD / Bypass Road</option>
              </select>
              {validationErrors.highwayType && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.highwayType}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Highway / Road Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={highwayParams.highwayName}
                onChange={(e) => setHighwayParams({ ...highwayParams, highwayName: e.target.value })}
                placeholder="e.g. NH-45 GST Road / SH-48"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Road Number
              </label>
              <input
                type="text"
                value={highwayParams.roadNumber}
                onChange={(e) => setHighwayParams({ ...highwayParams, roadNumber: e.target.value })}
                placeholder="e.g. NH-45 / SH-48"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Road Frontage Length <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={highwayParams.roadFrontageLength}
                onChange={(e) => setHighwayParams({ ...highwayParams, roadFrontageLength: e.target.value })}
                placeholder="e.g. 45.5 meters"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition ${
                  validationErrors.roadFrontageLength ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.roadFrontageLength && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.roadFrontageLength}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Distance to Highway Centreline
              </label>
              <input
                type="text"
                value={highwayParams.distanceToCentreline}
                onChange={(e) => setHighwayParams({ ...highwayParams, distanceToCentreline: e.target.value })}
                placeholder="e.g. 22.0 meters"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Existing Right-of-Way (RoW) Width
              </label>
              <input
                type="text"
                value={highwayParams.existingRowWidth}
                onChange={(e) => setHighwayParams({ ...highwayParams, existingRowWidth: e.target.value })}
                placeholder="e.g. 30.0 meters"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Available Road Width
              </label>
              <input
                type="text"
                value={highwayParams.availableRoadWidth}
                onChange={(e) => setHighwayParams({ ...highwayParams, availableRoadWidth: e.target.value })}
                placeholder="e.g. 18.0 meters"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Access Type <span className="text-red-500">*</span>
              </label>
              <select
                value={highwayParams.proposedAccessType}
                onChange={(e) => setHighwayParams({ ...highwayParams, proposedAccessType: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="Existing Access">Existing Access</option>
                <option value="New Access">New Access</option>
                <option value="Modified Access">Modified Access</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Access Width <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={highwayParams.proposedAccessWidth}
                onChange={(e) => setHighwayParams({ ...highwayParams, proposedAccessWidth: e.target.value })}
                placeholder="e.g. 7.5 meters"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition ${
                  validationErrors.proposedAccessWidth ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.proposedAccessWidth && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.proposedAccessWidth}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Number of Access Points
              </label>
              <select
                value={highwayParams.numberOfAccessPoints}
                onChange={(e) => setHighwayParams({ ...highwayParams, numberOfAccessPoints: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="1 Point">1 Access Point</option>
                <option value="2 Points">2 Access Points (Entry / Exit Split)</option>
                <option value="3+ Points">3+ Multiple Access Points</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Development Type
              </label>
              <select
                value={highwayParams.proposedDevelopmentType}
                onChange={(e) => setHighwayParams({ ...highwayParams, proposedDevelopmentType: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Institutional">Institutional</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Purpose of Highway Access
              </label>
              <input
                type="text"
                value={highwayParams.purposeOfAccess}
                onChange={(e) => setHighwayParams({ ...highwayParams, purposeOfAccess: e.target.value })}
                placeholder="State the objective for accessing the highway"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Site Access Description
              </label>
              <textarea
                rows={2}
                value={highwayParams.siteAccessDescription}
                onChange={(e) => setHighwayParams({ ...highwayParams, siteAccessDescription: e.target.value })}
                placeholder="Describe physical access orientation, sight distances, and culvert requirements"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* CONDITIONAL SECTION: COMMERCIAL / INDUSTRIAL LOGISTICS */}
          {(highwayParams.proposedDevelopmentType === 'Commercial' || highwayParams.proposedDevelopmentType === 'Industrial') && (
            <div className="pt-4 border-t border-slate-200 space-y-4 bg-amber-50/40 p-4 rounded-2xl border border-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Commercial & Industrial Vehicular Logistics (Conditional)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Expected Vehicle Movement
                  </label>
                  <input
                    type="text"
                    value={logisticsParams.expectedVehicleMovement}
                    onChange={(e) => setLogisticsParams({ ...logisticsParams, expectedVehicleMovement: e.target.value })}
                    placeholder="e.g. 50 Peak Vehicles / Hour"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Heavy Vehicle Access Required
                  </label>
                  <select
                    value={logisticsParams.heavyVehicleAccessRequired}
                    onChange={(e) => setLogisticsParams({ ...logisticsParams, heavyVehicleAccessRequired: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  >
                    <option value="Yes">Yes (Multi-Axle Trucks / Buses)</option>
                    <option value="No">No (Passenger & Light Commercial Only)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2 md:col-span-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Parking / Loading Area Details
                  </label>
                  <input
                    type="text"
                    value={logisticsParams.parkingLoadingAreaDetails}
                    onChange={(e) => setLogisticsParams({ ...logisticsParams, parkingLoadingAreaDetails: e.target.value })}
                    placeholder="Off-street parking capacity & loading bays"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: SETBACK & ENCROACHMENT PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Highway Setback & Encroachment Appraisal
              </h3>
              <p className="text-[11px] text-slate-500">
                Verify ribbon development clearance and building lines from the highway boundary.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Required Highway Setback
              </label>
              <input
                type="text"
                value={setbackParams.requiredHighwaySetback}
                onChange={(e) => setSetbackParams({ ...setbackParams, requiredHighwaySetback: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Existing Setback
              </label>
              <input
                type="text"
                value={setbackParams.existingSetback}
                onChange={(e) => setSetbackParams({ ...setbackParams, existingSetback: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Setback
              </label>
              <input
                type="text"
                value={setbackParams.proposedSetback}
                onChange={(e) => setSetbackParams({ ...setbackParams, proposedSetback: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Distance from Highway Boundary
              </label>
              <input
                type="text"
                value={setbackParams.distanceFromHighwayBoundary}
                onChange={(e) => setSetbackParams({ ...setbackParams, distanceFromHighwayBoundary: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Distance from Road Centreline
              </label>
              <input
                type="text"
                value={setbackParams.distanceFromRoadCentreline}
                onChange={(e) => setSetbackParams({ ...setbackParams, distanceFromRoadCentreline: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Encroachment into Highway RoW
              </label>
              <select
                value={setbackParams.encroachment}
                onChange={(e) => setSetbackParams({ ...setbackParams, encroachment: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
              >
                <option value="No">No Encroachment Detected</option>
                <option value="Yes">Yes (Encroachment Identified)</option>
              </select>
            </div>

            {/* CONDITIONAL: ENCROACHMENT DETAILS */}
            {setbackParams.encroachment === 'Yes' && (
              <div className="sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-2xl border border-red-200 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-red-900">
                    Encroachment Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={setbackParams.encroachmentDescription}
                    onChange={(e) => setSetbackParams({ ...setbackParams, encroachmentDescription: e.target.value })}
                    placeholder="Describe nature of existing structure / compound fence"
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
                    value={setbackParams.encroachmentArea}
                    onChange={(e) => setSetbackParams({ ...setbackParams, encroachmentArea: e.target.value })}
                    placeholder="e.g. 12.5 sq.m / 135 sq.ft."
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

        {/* SECTION 4: HIGHWAY DOCUMENTS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Highway-Related Supporting Documents
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload georeferenced frontage survey, engineering plans, and ownership records.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
              Required Documents for Highway Access Setback NOC:
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
            <label className="block p-6 border-2 border-dashed border-amber-300 hover:border-amber-600 rounded-2xl text-center cursor-pointer bg-amber-50/20 hover:bg-amber-50/40 transition">
              <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <span className="text-xs font-bold text-amber-900 block">
                Click to upload highway survey plans & documents or drag and drop
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
            className="w-full sm:w-auto px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2 active:scale-95"
          >
            Review Highway Dossier
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};

export default HighwayAccessSetbackWorkflow;
