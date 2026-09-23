import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Droplets, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, UserCheck, Building2,
  FileText, Activity, Wrench, Waves, MapPin, Gauge
} from 'lucide-react';
import api from '../services/api';

export const WaterSewerageNocWorkflow = ({
  parcel,
  deptData,
  user,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Workflow steps: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Automatic Land Details (Pre-populated from searched parcel context)
  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chennai',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    ward: deptData?.municipal?.parameters?.find(p => p.label?.toLowerCase().includes('ward'))?.value || 'Ward 42',
    propertyAddress: `${parcel?.surveyNumber ? `Survey No. ${parcel.surveyNumber}, ` : ''}${parcel?.village || 'Selaiyur'}, ${parcel?.taluk || 'Tambaram'}, ${parcel?.district || 'Chennai'} - 600073`,
    propertyType: parcel?.landType === 'Commercial' ? 'Commercial' : 'Residential',
    landArea: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    builtupArea: '3,200 sq.ft.',
    waterConnectionStatus: deptData?.municipal?.parameters?.find(p => p.label?.toLowerCase().includes('water'))?.value || 'Available / Active',
    sewerageConnectionStatus: deptData?.municipal?.parameters?.find(p => p.label?.toLowerCase().includes('sewerage'))?.value || 'Available / Active'
  };

  // Section 1: Applicant Details
  const [applicant, setApplicant] = useState({
    fullName: user?.fullName || 'Karthik Subramanian',
    guardianName: 'Subramanian Iyer',
    mobileNumber: user?.mobile || '9444123890',
    email: user?.email || 'citizen@landstack.demo',
    address: 'Plot 14, 2nd Main Road, Selaiyur, Tambaram, Chennai - 600073'
  });

  // Section 2: Building Parameters
  const [buildingParams, setBuildingParams] = useState({
    propertyType: landDetails.propertyType,
    numberOfFloors: 'G + 2 Floors',
    builtupArea: landDetails.builtupArea,
    numberOfOccupants: '14 Occupants',
    numberOfUnits: '4 Residential Units',
    buildingUsage: 'Residential Dwelling'
  });

  // Section 3: Water Connection Parameters
  const [waterConnection, setWaterConnection] = useState({
    connectionType: 'New Water Connection', // 'New Water Connection' | 'Existing Connection Modification'
    existingWaterConnectionNo: '',
    requiredPipeSize: '0.75 inch (20mm) High-Flow',
    estimatedWaterRequirement: '2,500 Liters/Day (LPD)',
    proposedConnectionPoint: 'Municipal Distribution Main Line - East Boundary Road',
    waterUsage: 'Domestic' // Domestic, Commercial, Industrial, Institutional, Other
  });

  // Section 4: Sewerage Parameters
  const [sewerageConnection, setSewerageConnection] = useState({
    sewerConnectionType: 'New Sewer Connection', // 'New Sewer Connection' | 'Existing Sewer Connection Modification'
    existingSewerConnectionNo: '',
    proposedSewerPoint: 'Municipal Trunk Drainage Line - Manhole No. MH-42B',
    wastewaterRequirement: '2,000 Liters/Day (LPD) Estimated Effluent Discharge',
    purposeDescription: 'Direct connection of domestic greywater and blackwater to municipal centralized underground sewerage network (UGD).'
  });

  // Section 5: Supporting Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission & Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  // Dynamic suggested document list
  const suggestedDocs = [
    { type: 'Plumbing Layout Plan', desc: 'Internal water supply and drainage sanitary schematic drawing', required: true },
    { type: 'Approved / Sanctioned Building Plan', desc: 'Municipality / Local Planning Authority sanctioned blueprint', required: true },
    { type: 'Latest Property Tax Receipt', desc: 'Current municipal tax paid challan confirming no arrears', required: true },
    { type: 'Patta / Ownership Document', desc: 'Patta copy or registered title deed proving title ownership', required: true },
    { type: 'Site Plan', desc: 'Cadastral site plan indicating proposed municipal road tapping points', required: true },
    { type: 'Identity Proof', desc: 'Aadhaar Card / Voter ID / Passport of applicant', required: true },
    { type: 'Address Proof', desc: 'Valid government proof of residence / electric connection', required: false },
    { type: 'Building Completion Certificate', desc: 'CC issued by municipal engineer / corporation', required: false },
    ...(waterConnection.connectionType.includes('Modification') || sewerageConnection.sewerConnectionType.includes('Modification') ? [
      { type: 'Existing Utility Connection Card / Bill', desc: 'Previous water/sewer consumer card showing connection number', required: true }
    ] : [])
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

    if (!applicant.fullName?.trim()) {
      errs.fullName = 'Please enter the applicant name.';
    }
    if (!applicant.guardianName?.trim()) {
      errs.guardianName = 'Please enter Father / Husband / Guardian Name.';
    }
    if (!applicant.mobileNumber || !/^[6-9]\d{9}$/.test(applicant.mobileNumber.replace(/\D/g, ''))) {
      errs.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }
    if (!buildingParams.propertyType) {
      errs.propertyType = 'Please select the property type.';
    }
    if (!buildingParams.builtupArea?.trim()) {
      errs.builtupArea = 'Please enter the built-up area.';
    }
    if (!buildingParams.numberOfOccupants?.trim()) {
      errs.numberOfOccupants = 'Please enter the number of occupants.';
    }
    if (!waterConnection.connectionType) {
      errs.waterConnectionType = 'Please select the water connection type.';
    }
    if (!waterConnection.requiredPipeSize?.trim()) {
      errs.requiredPipeSize = 'Please specify required connection size.';
    }
    if (!waterConnection.estimatedWaterRequirement?.trim()) {
      errs.estimatedWaterRequirement = 'Please enter the estimated water requirement (LPD).';
    }
    if (!sewerageConnection.sewerConnectionType) {
      errs.sewerConnectionType = 'Please select the sewer connection type.';
    }
    if (!sewerageConnection.proposedSewerPoint?.trim()) {
      errs.proposedSewerPoint = 'Please indicate the proposed sewer connection point.';
    }

    // Existing connection validations if modification is selected
    if (waterConnection.connectionType.includes('Modification') && !waterConnection.existingWaterConnectionNo?.trim()) {
      errs.existingWaterConnectionNo = 'Please provide existing water connection number for modification.';
    }
    if (sewerageConnection.sewerConnectionType.includes('Modification') && !sewerageConnection.existingSewerConnectionNo?.trim()) {
      errs.existingSewerConnectionNo = 'Please provide existing sewer connection number for modification.';
    }

    // Documents check
    if (uploadedDocuments.length === 0) {
      errs.documents = 'Please upload at least one required document (e.g. Plumbing Layout, Building Sanction Plan).';
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
      // Lookup service ID for SRV-UTIL-08 (Water & Sewerage Network NOC)
      let serviceId = 8;
      try {
        const servicesRes = await api.get('/api/services');
        const utilService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-UTIL-08' || s.serviceName?.toLowerCase().includes('water') || s.serviceName?.toLowerCase().includes('sewerage')
        );
        if (utilService) serviceId = utilService.id;
      } catch (err) {
        console.warn('Could not lookup service id, defaulting to 8', err);
      }

      // Generate dynamic application ID format: WSN-2026-XXXXXXXX
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const dynamicAppId = `WSN-2026-${randomDigits}`;

      const remarksSummary = `[Water & Sewerage Network NOC] Water: ${waterConnection.connectionType} (${waterConnection.requiredPipeSize}) | Demand: ${waterConnection.estimatedWaterRequirement} | Sewer: ${sewerageConnection.sewerConnectionType} | Effluent: ${sewerageConnection.wastewaterRequirement} | Built-up: ${buildingParams.builtupArea} | Floors: ${buildingParams.numberOfFloors} | Units: ${buildingParams.numberOfUnits} | Occupants: ${buildingParams.numberOfOccupants} | Applicant: ${applicant.fullName} | Mobile: ${applicant.mobileNumber} | Connection Point: ${waterConnection.proposedConnectionPoint} | Sewer Point: ${sewerageConnection.proposedSewerPoint}`;

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
        connectionType: waterConnection.connectionType,
        applicantName: applicant.fullName,
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
      setSubmitError(err.response?.data?.message || 'Failed to submit Water & Sewerage NOC application. Please try again.');
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
        <div className="w-20 h-20 bg-teal-100 text-teal-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-black uppercase tracking-wider">
            Water & Sewerage / Municipal Utility
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Water & Sewerage NOC Application Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your application for municipal water pipeline tapping and sewerage network connection clearance has been registered.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
            <span className="text-slate-500 font-sans font-bold">Application ID:</span>
            <span className="font-black text-teal-700 text-base">{generatedApplication.applicationNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-sans font-bold block">Service:</span>
              <span className="font-bold text-slate-900">Water & Sewerage Network NOC</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Connection Type:</span>
              <span className="font-bold text-teal-800">{waterConnection.connectionType}</span>
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
              <span className="text-slate-500 font-sans font-bold block">Applicant:</span>
              <span className="font-bold text-slate-900">{applicant.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Submission Date:</span>
              <span className="font-bold text-slate-900">{generatedApplication.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Statutory SLA:</span>
              <span className="font-bold text-teal-700">7 Days</span>
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
            className="w-full sm:w-auto px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
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
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Step 2 of 2: Final Verification
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              Review Water & Sewerage Network NOC Application
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify your water requirements, pipe dimension, sewer outfall point, and attached technical blueprints.
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
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Target Land Parcel Record (Automatic Context)
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
                <span className="text-slate-500 block">Village / Ward:</span>
                <span className="font-bold text-slate-900">{landDetails.village}, {landDetails.ward}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Taluk & District:</span>
                <span className="font-bold text-slate-900">{landDetails.taluk}, {landDetails.district}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Property Type:</span>
                <span className="font-bold text-slate-900">{landDetails.propertyType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Land Area:</span>
                <span className="font-bold text-slate-900">{landDetails.landArea}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Built-up Area:</span>
                <span className="font-bold text-slate-900">{buildingParams.builtupArea}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Network Availability:</span>
                <span className="font-bold text-emerald-700">Centralized Grid Active</span>
              </div>
            </div>
          </div>

          {/* Review 2: Applicant Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600" />
              Applicant Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Applicant Name:</span>
                <span className="font-bold text-slate-900">{applicant.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Father / Guardian:</span>
                <span className="font-bold text-slate-900">{applicant.guardianName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Info:</span>
                <span className="font-bold text-slate-900">{applicant.mobileNumber} | {applicant.email}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Premises Address:</span>
                <span className="font-bold text-slate-900">{applicant.address}</span>
              </div>
            </div>
          </div>

          {/* Review 3: Building Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              Building & Occupancy Parameters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Property Type:</span>
                <span className="font-bold text-slate-900">{buildingParams.propertyType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Number of Floors:</span>
                <span className="font-bold text-slate-900">{buildingParams.numberOfFloors}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Built-up:</span>
                <span className="font-bold text-slate-900">{buildingParams.builtupArea}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Number of Units:</span>
                <span className="font-bold text-slate-900">{buildingParams.numberOfUnits}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Number of Occupants:</span>
                <span className="font-bold text-slate-900">{buildingParams.numberOfOccupants}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Building Usage:</span>
                <span className="font-bold text-slate-900">{buildingParams.buildingUsage}</span>
              </div>
            </div>
          </div>

          {/* Review 4: Water & Sewerage Connection Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-teal-600" />
              Utility Network Connection Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-black text-teal-800 text-[11px] uppercase tracking-wider block">
                  Water Supply Connection
                </span>
                <div className="space-y-1">
                  <div><span className="text-slate-500">Connection: </span><span className="font-bold">{waterConnection.connectionType}</span></div>
                  <div><span className="text-slate-500">Required Pipe Size: </span><span className="font-bold font-mono">{waterConnection.requiredPipeSize}</span></div>
                  <div><span className="text-slate-500">Daily Demand: </span><span className="font-bold">{waterConnection.estimatedWaterRequirement}</span></div>
                  <div><span className="text-slate-500">Usage Type: </span><span className="font-bold">{waterConnection.waterUsage}</span></div>
                  <div><span className="text-slate-500">Connection Point: </span><span className="font-bold">{waterConnection.proposedConnectionPoint}</span></div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="font-black text-teal-800 text-[11px] uppercase tracking-wider block">
                  Sewerage & Effluent Discharge
                </span>
                <div className="space-y-1">
                  <div><span className="text-slate-500">Connection: </span><span className="font-bold">{sewerageConnection.sewerConnectionType}</span></div>
                  <div><span className="text-slate-500">Proposed Outfall Point: </span><span className="font-bold">{sewerageConnection.proposedSewerPoint}</span></div>
                  <div><span className="text-slate-500">Discharge Volume: </span><span className="font-bold">{sewerageConnection.wastewaterRequirement}</span></div>
                  <div className="text-[11px] text-slate-600 italic">{sewerageConnection.purposeDescription}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Review 5: Supporting Documents */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Attached Technical Documents ({uploadedDocuments.length})
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
              Clearance will be technically evaluated by the Municipal Utility Hydraulic & Sanitation Engineering wing.
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitApplication}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-700/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting Utility Application...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Water & Sewerage NOC Application
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
      <div className="bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <Droplets className="w-3.5 h-3.5 text-teal-400" />
            Water & Sewerage / Municipal Utility
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Water & Sewerage Network NOC
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Obtain clearance for connecting the selected property to the municipal water supply and sewerage network.
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
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Property Type</label>
              <input
                type="text"
                value={landDetails.propertyType}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">District</label>
              <input
                type="text"
                value={landDetails.district}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Taluk</label>
              <input
                type="text"
                value={landDetails.taluk}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Village / Ward</label>
              <input
                type="text"
                value={`${landDetails.village} (${landDetails.ward})`}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Land Area</label>
              <input
                type="text"
                value={landDetails.landArea}
                readOnly
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: APPLICANT DETAILS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Applicant Details
              </h3>
              <p className="text-[11px] text-slate-500">
                Authorized property owner or developer requesting utility network connection.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Applicant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={applicant.fullName}
                onChange={(e) => setApplicant({ ...applicant, fullName: e.target.value })}
                placeholder="Full Name"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition ${
                  validationErrors.fullName ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.fullName && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Father / Husband / Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={applicant.guardianName}
                onChange={(e) => setApplicant({ ...applicant, guardianName: e.target.value })}
                placeholder="Guardian / Father's Name"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition ${
                  validationErrors.guardianName ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.guardianName && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.guardianName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={applicant.mobileNumber}
                onChange={(e) => setApplicant({ ...applicant, mobileNumber: e.target.value })}
                placeholder="10-digit Mobile"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition ${
                  validationErrors.mobileNumber ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.mobileNumber && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.mobileNumber}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                value={applicant.email}
                onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                placeholder="citizen@example.com"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Premises Address
              </label>
              <input
                type="text"
                value={applicant.address}
                onChange={(e) => setApplicant({ ...applicant, address: e.target.value })}
                placeholder="Site / Premises Address"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BUILDING PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Building & Structural Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Physical layout dimensions determining water load and sewage handling capacity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                value={buildingParams.propertyType}
                onChange={(e) => setBuildingParams({ ...buildingParams, propertyType: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Institutional">Institutional</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Number of Floors
              </label>
              <input
                type="text"
                value={buildingParams.numberOfFloors}
                onChange={(e) => setBuildingParams({ ...buildingParams, numberOfFloors: e.target.value })}
                placeholder="e.g. Ground Floor, G+2"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Built-up Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buildingParams.builtupArea}
                onChange={(e) => setBuildingParams({ ...buildingParams, builtupArea: e.target.value })}
                placeholder="e.g. 3,200 sq.ft."
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition ${
                  validationErrors.builtupArea ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.builtupArea && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.builtupArea}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Number of Occupants <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buildingParams.numberOfOccupants}
                onChange={(e) => setBuildingParams({ ...buildingParams, numberOfOccupants: e.target.value })}
                placeholder="e.g. 14 Occupants"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition ${
                  validationErrors.numberOfOccupants ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.numberOfOccupants && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.numberOfOccupants}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Number of Units (Apartments/Offices)
              </label>
              <input
                type="text"
                value={buildingParams.numberOfUnits}
                onChange={(e) => setBuildingParams({ ...buildingParams, numberOfUnits: e.target.value })}
                placeholder="e.g. 4 Units"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Building Usage
              </label>
              <input
                type="text"
                value={buildingParams.buildingUsage}
                onChange={(e) => setBuildingParams({ ...buildingParams, buildingUsage: e.target.value })}
                placeholder="e.g. Residential Dwelling / Commercial Retail"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: WATER CONNECTION PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Water Connection Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Specification for municipal water pipeline tapping and pipe size.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Connection Type <span className="text-red-500">*</span>
              </label>
              <select
                value={waterConnection.connectionType}
                onChange={(e) => setWaterConnection({ ...waterConnection, connectionType: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-teal-300 rounded-xl text-xs font-bold text-teal-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              >
                <option value="New Water Connection">New Water Connection</option>
                <option value="Existing Connection Modification">Existing Connection Modification</option>
              </select>
            </div>

            {waterConnection.connectionType.includes('Modification') && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Existing Water Connection No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={waterConnection.existingWaterConnectionNo}
                  onChange={(e) => setWaterConnection({ ...waterConnection, existingWaterConnectionNo: e.target.value })}
                  placeholder="e.g. WTR-2023-90812"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
                {validationErrors.existingWaterConnectionNo && (
                  <p className="text-[11px] text-red-600 font-semibold">{validationErrors.existingWaterConnectionNo}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Required Connection Size <span className="text-red-500">*</span>
              </label>
              <select
                value={waterConnection.requiredPipeSize}
                onChange={(e) => setWaterConnection({ ...waterConnection, requiredPipeSize: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              >
                <option value="0.5 inch (15mm) Standard">0.5 inch (15mm) Standard</option>
                <option value="0.75 inch (20mm) High-Flow">0.75 inch (20mm) High-Flow</option>
                <option value="1.0 inch (25mm) Commercial / Multi-Unit">1.0 inch (25mm) Commercial / Multi-Unit</option>
                <option value="2.0 inch (50mm) Bulk Supply">2.0 inch (50mm) Bulk Supply</option>
                <option value="3.0 inch+ (75mm+) Industrial">3.0 inch+ (75mm+) Industrial</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Estimated Water Requirement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={waterConnection.estimatedWaterRequirement}
                onChange={(e) => setWaterConnection({ ...waterConnection, estimatedWaterRequirement: e.target.value })}
                placeholder="e.g. 2,500 Liters/Day (LPD)"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
              {validationErrors.estimatedWaterRequirement && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.estimatedWaterRequirement}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Water Usage
              </label>
              <select
                value={waterConnection.waterUsage}
                onChange={(e) => setWaterConnection({ ...waterConnection, waterUsage: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              >
                <option value="Domestic">Domestic</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Institutional">Institutional</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Connection Point
              </label>
              <input
                type="text"
                value={waterConnection.proposedConnectionPoint}
                onChange={(e) => setWaterConnection({ ...waterConnection, proposedConnectionPoint: e.target.value })}
                placeholder="e.g. Municipal Distribution Main Line on Eastern Boundary Road"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: SEWERAGE PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Sewerage Network Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Clearance for connecting sanitary plumbing to municipal sewer / underground drainage (UGD).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Sewer Connection Type <span className="text-red-500">*</span>
              </label>
              <select
                value={sewerageConnection.sewerConnectionType}
                onChange={(e) => setSewerageConnection({ ...sewerageConnection, sewerConnectionType: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-teal-300 rounded-xl text-xs font-bold text-teal-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              >
                <option value="New Sewer Connection">New Sewer Connection</option>
                <option value="Existing Sewer Connection Modification">Existing Connection Modification</option>
              </select>
            </div>

            {sewerageConnection.sewerConnectionType.includes('Modification') && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Existing Sewer Connection No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sewerageConnection.existingSewerConnectionNo}
                  onChange={(e) => setSewerageConnection({ ...sewerageConnection, existingSewerConnectionNo: e.target.value })}
                  placeholder="e.g. SWR-2023-4512"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                />
                {validationErrors.existingSewerConnectionNo && (
                  <p className="text-[11px] text-red-600 font-semibold">{validationErrors.existingSewerConnectionNo}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Proposed Sewer Connection Point <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sewerageConnection.proposedSewerPoint}
                onChange={(e) => setSewerageConnection({ ...sewerageConnection, proposedSewerPoint: e.target.value })}
                placeholder="e.g. Municipal Trunk Manhole MH-42B"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Wastewater / Sewerage Requirement
              </label>
              <input
                type="text"
                value={sewerageConnection.wastewaterRequirement}
                onChange={(e) => setSewerageConnection({ ...sewerageConnection, wastewaterRequirement: e.target.value })}
                placeholder="e.g. 2,000 Liters/Day"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Purpose / Description
              </label>
              <textarea
                rows={2}
                value={sewerageConnection.purposeDescription}
                onChange={(e) => setSewerageConnection({ ...sewerageConnection, purposeDescription: e.target.value })}
                placeholder="Detailed notes regarding internal septic chambers, grease traps, or direct municipal main line hookup"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: WATER & SEWERAGE DOCUMENTS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Service-Specific Technical Documents
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload plumbing diagrams, sanctioned building approval, and ownership records.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-900 block">
              Required Documents for Water & Sewerage NOC:
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
            <label className="block p-6 border-2 border-dashed border-teal-200 hover:border-teal-500 rounded-2xl text-center cursor-pointer bg-teal-50/20 hover:bg-teal-50/40 transition">
              <Upload className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <span className="text-xs font-bold text-teal-900 block">
                Click to upload technical blueprints or drag and drop
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
                  Attached Technical Files ({uploadedDocuments.length})
                </h4>
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-teal-600" />
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
            className="w-full sm:w-auto px-8 py-3 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-700/20 transition flex items-center justify-center gap-2 active:scale-95"
          >
            Review Application Details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};

export default WaterSewerageNocWorkflow;
