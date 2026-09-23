import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Building2, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, Compass, FileText, Ruler
} from 'lucide-react';
import api from '../services/api';

export const BuildingPermissionWorkflow = ({
  parcel,
  deptData,
  user,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Workflow steps: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Section 1: Land Details (Auto-populated from previously searched record)
  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chennai',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    landClassification: parcel?.landType || 'Residential / Commercial Approved'
  };

  // Section 2: Applicant / Developer Details
  const [applicant, setApplicant] = useState({
    fullName: user?.fullName || 'Karthik Subramanian',
    applicantRole: 'Land Owner & Developer',
    mobileNumber: '9840123456',
    email: user?.email || 'karthik@landstack.demo',
    licensedSurveyorName: 'Er. R. Sundaram (Lic. No: CMDA/SE/2024/091)'
  });

  // Section 3: Application Type: 'Building Permission' | 'Layout Approval'
  const [applicationType, setApplicationType] = useState('Building Permission');

  // Building Permission Parameters
  const [buildingParams, setBuildingParams] = useState({
    buildingType: 'Residential', // Residential, Commercial, Industrial, Institutional, Other
    numberOfFloors: 'G + 2 Floors (Stilt + 3)',
    totalBuiltupArea: '4,850 sq.ft.',
    groundCoverage: '1,720 sq.ft.',
    plotArea: '3,200 sq.ft.',
    buildingHeight: '11.5 meters',
    numberOfUnits: '6 Apartments',
    numberOfParkingSpaces: '6 Four-Wheelers, 10 Two-Wheelers',
    proposedConstructionDesc: 'Stilt + 3-floor residential apartment structure with rainwater harvesting and solar rooftop provisions.',
    // Technical parameters
    setbackFront: '3.5 meters',
    setbackRear: '2.0 meters',
    setbackLeft: '1.8 meters',
    setbackRight: '1.8 meters',
    structuralType: 'RCC Framed Structure (IS 456 Compliant)'
  });

  // Layout Approval Parameters
  const [layoutParams, setLayoutParams] = useState({
    layoutName: 'Sri Balaji Smart City Layout',
    totalSiteArea: '2.45 Acres (1,06,722 sq.ft.)',
    numberOfPlots: '28 Residential Plots',
    roadArea: '32,016 sq.ft. (30%)',
    openSpaceArea: '10,672 sq.ft. (OSR 10%)',
    roadWidth: '40 feet (12 meters) Trunk Roads, 30 feet Internal Roads',
    proposedUse: 'Residential / Mixed Use',
    proposedDevelopmentDesc: 'Integrated plotted layout development with underground stormwater drains, street LED lighting, and public park area.'
  });

  // Section 4: Supporting Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  const getSuggestedDocuments = (type) => {
    if (type === 'Building Permission') {
      return [
        { type: 'Approved / Proposed Site Plan', desc: 'Detailed site layout showing setbacks, road access and north orientation', required: true },
        { type: 'Building Plan / Architectural Drawings', desc: 'Floor plans, elevations, and sections signed by Registered Architect', required: true },
        { type: 'Structural Drawings & Certificate', desc: 'Structural engineer safety certificate and foundation blueprint', required: true },
        { type: 'Ownership / Patta Document', desc: 'Valid revenue Patta and registered conveyance title deed', required: true },
        { type: 'Soil Investigation Report', desc: 'Geotechnical soil load bearing capacity test report', required: false },
        { type: 'Identity Proof of Applicant', desc: 'Aadhaar / Voter ID / Passport of applicant', required: true }
      ];
    } else {
      return [
        { type: 'Comprehensive Layout Master Plan', desc: 'Plotted layout blueprint showing roads, OSR, and parcel demarcations', required: true },
        { type: 'Topographical Contour & Drainage Plan', desc: 'Site contours and stormwater drainage gradient scheme', required: true },
        { type: 'Town Planning & Zoning NOC', desc: 'Master development plan zoning clearance extract', required: true },
        { type: 'Ownership Patta & Title Deeds', desc: 'Parent documents and revenue Patta confirming clear title', required: true },
        { type: 'Road Widening / Access NOC', desc: 'Highways / Local body road access clearance', required: false },
        { type: 'Identity Proof', desc: 'Government photo ID of developer / owner', required: true }
      ];
    }
  };

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
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        file
      });
    }

    setUploadedDocuments(prev => [...prev, ...validFiles]);
  };

  const handleRemoveDocument = (docId) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const validateForm = () => {
    if (!applicant.fullName.trim()) return 'Please enter applicant name.';
    if (!applicant.mobileNumber.trim() || applicant.mobileNumber.length < 10) return 'Please enter a valid mobile number.';

    if (applicationType === 'Building Permission') {
      if (!buildingParams.totalBuiltupArea.trim()) return 'Please enter the total built-up area.';
      if (!buildingParams.groundCoverage.trim()) return 'Please enter the ground coverage area.';
      if (!buildingParams.buildingHeight.trim()) return 'Please enter the building height.';
    } else {
      if (!layoutParams.layoutName.trim()) return 'Please enter the proposed layout name.';
      if (!layoutParams.numberOfPlots.trim()) return 'Please enter the proposed number of plots.';
      if (!layoutParams.roadWidth.trim()) return 'Please enter the proposed road width.';
    }

    if (uploadedDocuments.length === 0) {
      return 'Please upload at least one required technical document (e.g. Architectural Site Plan or Layout Master Plan).';
    }

    return null;
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setDocumentError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setDocumentError('');
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      // Find serviceId for SRV-BLD-05 (default 5)
      let serviceId = 5;
      try {
        const servicesRes = await api.get('/api/services');
        const bldService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-BLD-05' || s.serviceName?.toLowerCase().includes('building')
        );
        if (bldService) serviceId = bldService.id;
      } catch (err) {
        console.warn('Could not lookup service id, fallback to 5', err);
      }

      let summaryDetails = '';
      if (applicationType === 'Building Permission') {
        summaryDetails = `Type: ${buildingParams.buildingType} | Floors: ${buildingParams.numberOfFloors} | Built-up: ${buildingParams.totalBuiltupArea} | Height: ${buildingParams.buildingHeight} | Setbacks: F:${buildingParams.setbackFront}, R:${buildingParams.setbackRear}, L:${buildingParams.setbackLeft}, R:${buildingParams.setbackRight} | Structure: ${buildingParams.structuralType} | Units: ${buildingParams.numberOfUnits}`;
      } else {
        summaryDetails = `Layout: ${layoutParams.layoutName} | Plots: ${layoutParams.numberOfPlots} | Roads: ${layoutParams.roadArea} (${layoutParams.roadWidth}) | OSR: ${layoutParams.openSpaceArea} | Use: ${layoutParams.proposedUse}`;
      }

      const remarksSummary = `[Building Permission & Layout Sanction] App Type: ${applicationType} | Applicant: ${applicant.fullName} | Mobile: ${applicant.mobileNumber} | Surveyor: ${applicant.licensedSurveyorName} | ${summaryDetails}`;

      const payload = {
        ulpin: landDetails.ulpin,
        serviceId: serviceId,
        citizenRemarks: remarksSummary,
        documents: uploadedDocuments.map(d => ({
          documentType: d.documentType,
          documentName: d.documentName,
          documentUrl: '/uploads/' + d.documentName,
          fileSize: d.fileSize
        }))
      };

      const res = await api.post('/api/applications', payload);

      const generatedNum = res.data?.applicationNumber || `BLD-2026-${Math.floor(10000000 + Math.random() * 90000000)}`;

      setGeneratedApplication({
        ...res.data,
        applicationNumber: generatedNum,
        applicationType: applicationType,
        applicantName: applicant.fullName,
        submissionDate: new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        })
      });

      setStep('success');

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if confetti fails
      }

      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit Building Permission application. Please try again.');
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
            Municipal & Planning Sanction Submission
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {applicationType} Application Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your application for {applicationType} has been successfully recorded and assigned to the Municipal Town Planning & Structural Engineering wing for bylaw scrutiny.
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
              <span className="font-bold text-slate-900">Building Permission & Layout Sanction</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Application Type:</span>
              <span className="font-bold text-teal-800">{applicationType}</span>
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
              <span className="text-slate-500 font-sans font-bold block">Applicant / Developer:</span>
              <span className="font-bold text-slate-900">{applicant.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Submission Date:</span>
              <span className="font-bold text-slate-900">{generatedApplication.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Statutory SLA:</span>
              <span className="font-bold text-teal-700">15 Days</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Current Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
            Print Sanction Token Receipt
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
            Edit Technical Parameters
          </button>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Step 2 of 2: Blueprint & Technical Verification
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              Review {applicationType} Application
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify planning bylaws compliance, setback geometry, built-up areas, and technical drawings prior to submission.
            </p>
          </div>

          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}

          {/* Review Section 1: Land Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Target Land Parcel Record (Pre-Synchronized)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">ULPIN:</span>
                <span className="font-mono font-bold text-teal-700">{landDetails.ulpin}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Survey No:</span>
                <span className="font-mono font-bold text-slate-900">{landDetails.surveyNumber} ({landDetails.subDivision})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Village / Taluk:</span>
                <span className="font-bold text-slate-900">{landDetails.village}, {landDetails.taluk}</span>
              </div>
              <div>
                <span className="text-slate-500 block">District:</span>
                <span className="font-bold text-slate-900">{landDetails.district}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Site Extent:</span>
                <span className="font-bold text-slate-900">{landDetails.landExtent}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Land Classification:</span>
                <span className="font-bold text-slate-900">{landDetails.landClassification}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Applicant:</span>
                <span className="font-bold text-slate-900">{applicant.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Licensed Surveyor:</span>
                <span className="font-bold text-slate-900 truncate block">{applicant.licensedSurveyorName}</span>
              </div>
            </div>
          </div>

          {/* Review Section 2: Building or Layout Parameters */}
          <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-200 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                Technical Parameters for {applicationType}
              </h3>
              <span className="px-2.5 py-0.5 bg-teal-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                {applicationType}
              </span>
            </div>

            {applicationType === 'Building Permission' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Building Category:</span>
                  <span className="font-bold text-slate-900">{buildingParams.buildingType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Number of Floors:</span>
                  <span className="font-bold text-slate-900">{buildingParams.numberOfFloors}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Built-up Area:</span>
                  <span className="font-bold text-teal-800">{buildingParams.totalBuiltupArea}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ground Coverage:</span>
                  <span className="font-bold text-slate-900">{buildingParams.groundCoverage}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Building Height:</span>
                  <span className="font-bold text-slate-900">{buildingParams.buildingHeight}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Number of Units:</span>
                  <span className="font-bold text-slate-900">{buildingParams.numberOfUnits}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Parking Allocation:</span>
                  <span className="font-bold text-slate-900">{buildingParams.numberOfParkingSpaces}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Structural Blueprint:</span>
                  <span className="font-bold text-slate-900">{buildingParams.structuralType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mandatory Setbacks:</span>
                  <span className="font-mono font-bold text-slate-900">
                    F: {buildingParams.setbackFront} | R: {buildingParams.setbackRear} | L: {buildingParams.setbackLeft} | R: {buildingParams.setbackRight}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-500 block">Construction Description:</span>
                  <span className="font-medium text-slate-800">{buildingParams.proposedConstructionDesc}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Layout Scheme Name:</span>
                  <span className="font-bold text-teal-900">{layoutParams.layoutName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Site Area:</span>
                  <span className="font-bold text-slate-900">{layoutParams.totalSiteArea}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Proposed Plots:</span>
                  <span className="font-bold text-slate-900">{layoutParams.numberOfPlots}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Road Circulation Area:</span>
                  <span className="font-bold text-slate-900">{layoutParams.roadArea}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Open Space (OSR):</span>
                  <span className="font-bold text-slate-900">{layoutParams.openSpaceArea}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Road Width:</span>
                  <span className="font-bold text-slate-900">{layoutParams.roadWidth}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-500 block">Development Details:</span>
                  <span className="font-medium text-slate-800">{layoutParams.proposedDevelopmentDesc}</span>
                </div>
              </div>
            )}
          </div>

          {/* Review Section 3: Supporting Documents */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Attached Architectural & Technical Dossier ({uploadedDocuments.length})
              </span>
            </h3>
            <div className="divide-y divide-slate-200">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-slate-900">{doc.documentName}</span>
                    <span className="text-slate-400">({doc.fileSize})</span>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-[10px] font-bold uppercase">
                    Scrutiny Ready
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Back to Technical Form
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitApplication}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-700/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting for Sanction Appraisal...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Building Permission Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 1: TECHNICAL APPLICATION FORM
  // ==========================================
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Citizen Dashboard
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-black uppercase tracking-wider">
            Building & Planning Department
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            SLA: 15 Days
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold">
            Fee: ₹4,500
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Building Permission & Layout Sanction
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit building or layout proposals for technical review and statutory approval adhering to municipal building bylaws.
          </p>
        </div>

        {documentError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {documentError}
          </div>
        )}

        <form onSubmit={handleProceedToReview} className="space-y-6">

          {/* SECTION 1: LAND DETAILS (READ-ONLY PRE-POPULATED) */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/40 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Target Land Parcel (Retrieved from Cadastral Database)
              </h3>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded border border-teal-200">
                Verified ULPIN
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">ULPIN (Bhu-Aadhaar):</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.ulpin}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-teal-700 select-all"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Survey Number:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.surveyNumber}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Sub-Division:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.subDivision}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">District:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.district}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Taluk:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.taluk}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Village:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.village}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Land Extent:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.landExtent}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Land Classification:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.landClassification}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: APPLICATION TYPE SELECTOR */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              Select Application Category
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setApplicationType('Building Permission')}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${applicationType === 'Building Permission' ? 'bg-teal-50 border-teal-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
              >
                <input
                  type="radio"
                  name="appType"
                  checked={applicationType === 'Building Permission'}
                  onChange={() => setApplicationType('Building Permission')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="font-black text-slate-900 block text-sm">Building Permission</span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    For individual residential homes, multi-story apartments, commercial complexes, or industrial structures.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setApplicationType('Layout Approval')}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${applicationType === 'Layout Approval' ? 'bg-teal-50 border-teal-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
              >
                <input
                  type="radio"
                  name="appType"
                  checked={applicationType === 'Layout Approval'}
                  onChange={() => setApplicationType('Layout Approval')}
                  className="mt-1 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="font-black text-slate-900 block text-sm">Layout Approval</span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    For land sub-division layouts, residential townships, plotted developments, roads, and open space reservations (OSR).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 3A: BUILDING PERMISSION PARAMETERS */}
          {applicationType === 'Building Permission' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  Building Permission & Technical Parameters
                </h3>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  IS / NBC 2016 Compliant
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Building Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={buildingParams.buildingType}
                    onChange={(e) => setBuildingParams({ ...buildingParams, buildingType: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-teal-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  >
                    <option value="Residential">Residential (Apartment / House)</option>
                    <option value="Commercial">Commercial (Office / Retail / Mall)</option>
                    <option value="Industrial">Industrial (Factory / Warehouse)</option>
                    <option value="Institutional">Institutional (School / Hospital)</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Number of Floors <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={buildingParams.numberOfFloors}
                    onChange={(e) => setBuildingParams({ ...buildingParams, numberOfFloors: e.target.value })}
                    placeholder="e.g. G + 2 Floors"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Total Built-up Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={buildingParams.totalBuiltupArea}
                    onChange={(e) => setBuildingParams({ ...buildingParams, totalBuiltupArea: e.target.value })}
                    placeholder="e.g. 4,850 sq.ft."
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-teal-800 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Ground Coverage Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={buildingParams.groundCoverage}
                    onChange={(e) => setBuildingParams({ ...buildingParams, groundCoverage: e.target.value })}
                    placeholder="e.g. 1,720 sq.ft."
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Plot Area
                  </label>
                  <input
                    type="text"
                    value={buildingParams.plotArea}
                    onChange={(e) => setBuildingParams({ ...buildingParams, plotArea: e.target.value })}
                    placeholder="e.g. 3,200 sq.ft."
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Building Height <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={buildingParams.buildingHeight}
                    onChange={(e) => setBuildingParams({ ...buildingParams, buildingHeight: e.target.value })}
                    placeholder="e.g. 11.5 meters"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Number of Units / Flats
                  </label>
                  <input
                    type="text"
                    value={buildingParams.numberOfUnits}
                    onChange={(e) => setBuildingParams({ ...buildingParams, numberOfUnits: e.target.value })}
                    placeholder="e.g. 6 Apartments"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Parking Spaces Provided
                  </label>
                  <input
                    type="text"
                    value={buildingParams.numberOfParkingSpaces}
                    onChange={(e) => setBuildingParams({ ...buildingParams, numberOfParkingSpaces: e.target.value })}
                    placeholder="e.g. 6 Cars, 10 Two-Wheelers"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Structural Blueprint Type
                  </label>
                  <input
                    type="text"
                    value={buildingParams.structuralType}
                    onChange={(e) => setBuildingParams({ ...buildingParams, structuralType: e.target.value })}
                    placeholder="e.g. RCC Framed Structure"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                {/* Technical Setbacks */}
                <div className="sm:col-span-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-teal-600" />
                    Mandatory Setback Clearances (Meters):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Front Setback:</span>
                      <input
                        type="text"
                        value={buildingParams.setbackFront}
                        onChange={(e) => setBuildingParams({ ...buildingParams, setbackFront: e.target.value })}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Rear Setback:</span>
                      <input
                        type="text"
                        value={buildingParams.setbackRear}
                        onChange={(e) => setBuildingParams({ ...buildingParams, setbackRear: e.target.value })}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Left Side Setback:</span>
                      <input
                        type="text"
                        value={buildingParams.setbackLeft}
                        onChange={(e) => setBuildingParams({ ...buildingParams, setbackLeft: e.target.value })}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Right Side Setback:</span>
                      <input
                        type="text"
                        value={buildingParams.setbackRight}
                        onChange={(e) => setBuildingParams({ ...buildingParams, setbackRight: e.target.value })}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Proposed Construction Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={buildingParams.proposedConstructionDesc}
                    onChange={(e) => setBuildingParams({ ...buildingParams, proposedConstructionDesc: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white text-xs"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3B: LAYOUT APPROVAL PARAMETERS */}
          {applicationType === 'Layout Approval' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-teal-600" />
                  Layout Sanction & Plotted Development Parameters
                </h3>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Town Planning Matrix
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Proposed Layout / Scheme Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={layoutParams.layoutName}
                    onChange={(e) => setLayoutParams({ ...layoutParams, layoutName: e.target.value })}
                    placeholder="e.g. Green Valley Plotted Layout"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-teal-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Total Site Area under Layout <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={layoutParams.totalSiteArea}
                    onChange={(e) => setLayoutParams({ ...layoutParams, totalSiteArea: e.target.value })}
                    placeholder="e.g. 2.45 Acres"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Total Number of Plots <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={layoutParams.numberOfPlots}
                    onChange={(e) => setLayoutParams({ ...layoutParams, numberOfPlots: e.target.value })}
                    placeholder="e.g. 28 Plots"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Road Circulation Area
                  </label>
                  <input
                    type="text"
                    value={layoutParams.roadArea}
                    onChange={(e) => setLayoutParams({ ...layoutParams, roadArea: e.target.value })}
                    placeholder="e.g. 32,016 sq.ft. (30%)"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Open Space Reservation (OSR Area)
                  </label>
                  <input
                    type="text"
                    value={layoutParams.openSpaceArea}
                    onChange={(e) => setLayoutParams({ ...layoutParams, openSpaceArea: e.target.value })}
                    placeholder="e.g. 10,672 sq.ft. (10%)"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Minimum Road Width <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={layoutParams.roadWidth}
                    onChange={(e) => setLayoutParams({ ...layoutParams, roadWidth: e.target.value })}
                    placeholder="e.g. 40 feet (12 meters)"
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Proposed Layout Development Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={layoutParams.proposedDevelopmentDesc}
                    onChange={(e) => setLayoutParams({ ...layoutParams, proposedDevelopmentDesc: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-teal-600 focus:bg-white text-xs"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: BUILDING & TECHNICAL DOCUMENTS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Technical Blueprint & Document Dossier
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload architectural blueprints, structural drawings, or site plans (PDF, JPG, PNG up to 10MB each).
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 transition shadow-sm self-start sm:self-auto">
                <Upload className="w-4 h-4" />
                Upload Blueprints
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Checklist */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-2">
                Mandatory Scrutiny Checklist for {applicationType}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getSuggestedDocuments(applicationType).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-600">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.required ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                    <div>
                      <span className="font-semibold text-slate-800">{item.type}</span>
                      {item.required && <span className="text-red-500 font-bold text-[10px] ml-1">*Required</span>}
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocuments.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <Upload className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No blueprints uploaded yet</p>
                <p className="text-[11px] text-slate-400">
                  Please upload architectural site plans, structural engineer certificates, or layout drawings.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-teal-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{doc.documentName}</span>
                        <span className="text-[10px] text-slate-500">{doc.fileSize} • Uploaded</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Remove blueprint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-700/20 transition flex items-center justify-center gap-2 active:scale-95"
            >
              Review Application Details
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuildingPermissionWorkflow;
