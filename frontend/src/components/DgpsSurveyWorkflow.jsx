import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  MapPin, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, Compass, FileText, AlertTriangle, Navigation
} from 'lucide-react';
import api from '../services/api';

export const DgpsSurveyWorkflow = ({
  parcel,
  deptData,
  user,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Workflow steps: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Section 1: Land Details (Auto-populated from searched record)
  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chennai',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    pattaNumber: parcel?.pattaNumber || 'PATTA-2024-9912',
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    landClassification: parcel?.landType || 'Dry Land / Punja'
  };

  // Section 2: Applicant Details
  const [applicant, setApplicant] = useState({
    fullName: user?.fullName || 'Karthik Subramanian',
    mobileNumber: '9840123456',
    email: user?.email || 'karthik@landstack.demo',
    address: 'No. 12, Rajendra Prasad Road, Selaiyur, Chennai - 600073'
  });

  // Section 3: Survey Request Parameters
  const [surveyType, setSurveyType] = useState('Boundary Demarcation'); // Boundary Demarcation, DGPS Survey, Boundary Dispute Resolution, Resurvey, Sub-Division Survey, Other
  const [surveyPurpose, setSurveyPurpose] = useState('Physical boundary pegging and fencing verification.');
  const [requestedSurveyArea, setRequestedSurveyArea] = useState(landDetails.landExtent);
  const [previousSurveyRef, setPreviousSurveyRef] = useState('FMB-SRV-2018-0912');
  const [requestedSurveyDate, setRequestedSurveyDate] = useState('2026-03-10');

  // Section 4: Boundary & Neighbor Information
  const [boundaries, setBoundaries] = useState({
    northBoundary: 'Survey No. 141 (Agricultural Land)',
    southBoundary: '40 Feet Village Panchayat Road',
    eastBoundary: 'Survey No. 142/4B (P. Sundaram Land)',
    westBoundary: 'Survey No. 143 (Drainage Canal Buffer)'
  });

  const [neighbors, setNeighbors] = useState({
    northNeighbor: 'P. Ramanathan (Survey No. 141)',
    southNeighbor: 'Public Panchayat Road Corridor',
    eastNeighbor: 'Sundaram & Sons (Survey No. 142/4B)',
    westNeighbor: 'State PWD Canal Boundary (Survey No. 143)'
  });

  // Boundary Dispute Section
  const [hasDispute, setHasDispute] = useState('No'); // 'Yes' | 'No'
  const [disputeDetails, setDisputeDetails] = useState({
    disputeDescription: 'Encroachment claim on eastern boundary peg line by neighbor.',
    neighborInDispute: 'Sundaram (Survey No. 142/4B)',
    courtOrPoliceRefNo: 'OS-2024/991 (Sub Court, Tambaram)'
  });

  // Section 5: Supporting Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  const getSuggestedDocuments = (type, dispute) => {
    const list = [
      { type: 'Field Measurement Book (FMB) Extract', desc: 'Certified FMB sketch from Survey & Land Records portal', required: true },
      { type: 'Revenue Patta / Chitta Extract', desc: 'Current ownership patta confirming registered extents', required: true },
      { type: 'Registered Conveyance / Title Deed', desc: 'Parent registered sale deed / partition deed', required: true },
      { type: 'Identity Proof of Landowner', desc: 'Aadhaar / Voter ID / Passport', required: true }
    ];

    if (type === 'DGPS Survey') {
      list.push({ type: 'Cadastral Geodetic Reference Map', desc: 'Previous cadastral survey or topography drawing', required: false });
    }

    if (dispute === 'Yes' || type === 'Boundary Dispute Resolution') {
      list.push({ type: 'Boundary Dispute / Court Order Copy', desc: 'Court decree, petition, or police complaint acknowledgement', required: true });
      list.push({ type: 'Neighbor Notice Acknowledgement', desc: 'Statutory intimation notice served to adjoining owners', required: false });
    }

    return list;
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
    if (!surveyPurpose.trim()) return 'Please enter the survey purpose.';
    if (!boundaries.northBoundary.trim() || !boundaries.southBoundary.trim() || !boundaries.eastBoundary.trim() || !boundaries.westBoundary.trim()) {
      return 'Please specify all four boundary demarcations.';
    }

    if (hasDispute === 'Yes') {
      if (!disputeDetails.disputeDescription.trim()) return 'Please describe the boundary dispute.';
      if (!disputeDetails.neighborInDispute.trim()) return 'Please provide neighbor details involved in dispute.';
    }

    if (uploadedDocuments.length === 0) {
      return 'Please upload at least one required survey document (e.g. FMB Extract or Patta Copy).';
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
      // Find serviceId for SRV-SURV-06 (default 6)
      let serviceId = 6;
      try {
        const servicesRes = await api.get('/api/services');
        const survService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-SURV-06' || s.serviceName?.toLowerCase().includes('demarcation') || s.serviceName?.toLowerCase().includes('dgps')
        );
        if (survService) serviceId = survService.id;
      } catch (err) {
        console.warn('Could not lookup service id, fallback to 6', err);
      }

      const remarksSummary = `[Cadastral Boundary Demarcation & DGPS Survey] Type: ${surveyType} | Purpose: ${surveyPurpose} | Extent: ${requestedSurveyArea} | Boundaries: [N: ${boundaries.northBoundary}, S: ${boundaries.southBoundary}, E: ${boundaries.eastBoundary}, W: ${boundaries.westBoundary}] | Neighbors: [N: ${neighbors.northNeighbor}, E: ${neighbors.eastNeighbor}] | Dispute: ${hasDispute}${hasDispute === 'Yes' ? ` (Details: ${disputeDetails.disputeDescription} | Ref: ${disputeDetails.courtOrPoliceRefNo})` : ''} | Preferred Date: ${requestedSurveyDate}`;

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

      const generatedNum = res.data?.applicationNumber || `SUR-2026-${Math.floor(10000000 + Math.random() * 90000000)}`;

      setGeneratedApplication({
        ...res.data,
        applicationNumber: generatedNum,
        surveyType: surveyType,
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
      setSubmitError(err.response?.data?.message || 'Failed to submit Cadastral Survey application. Please try again.');
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
        <div className="w-20 h-20 bg-indigo-100 text-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-black uppercase tracking-wider">
            Cadastral Survey & DGPS Requisition
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Survey Demarcation Request Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your application for {surveyType} has been officially recorded in the State Cadastral Survey Register. A licensed government surveyor will be deployed for physical DGPS pegging.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
            <span className="text-slate-500 font-sans font-bold">Application ID:</span>
            <span className="font-black text-indigo-700 text-base">{generatedApplication.applicationNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-sans font-bold block">Service:</span>
              <span className="font-bold text-slate-900">Cadastral Boundary Demarcation & DGPS Survey</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Survey Type:</span>
              <span className="font-bold text-indigo-800">{surveyType}</span>
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
              <span className="font-bold text-indigo-700">10 Days</span>
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
            className="w-full sm:w-auto px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
          >
            Return to Citizen Dashboard
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition active:scale-95"
          >
            Print Survey Order Receipt
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
            Edit Survey Parameters
          </button>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Step 2 of 2: Demarcation Verification
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              Review Cadastral & DGPS Survey Requisition
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify all boundary information, neighboring survey parcel tags, and uploaded FMB documents before deployment of survey team.
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
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Target Land Parcel Record (Pre-Synchronized)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">ULPIN:</span>
                <span className="font-mono font-bold text-indigo-700">{landDetails.ulpin}</span>
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
                <span className="text-slate-500 block">Patta Number:</span>
                <span className="font-mono font-bold text-slate-900">{landDetails.pattaNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Demarcation Extent:</span>
                <span className="font-bold text-slate-900">{requestedSurveyArea}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Classification:</span>
                <span className="font-bold text-slate-900">{landDetails.landClassification}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Applicant:</span>
                <span className="font-bold text-slate-900">{applicant.fullName}</span>
              </div>
            </div>
          </div>

          {/* Review Section 2: Survey Request Parameters */}
          <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-600" />
              Demarcation & Survey Requirements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Survey Type:</span>
                <span className="font-black text-indigo-800 uppercase tracking-wide bg-indigo-100 px-2 py-0.5 rounded inline-block mt-0.5">
                  {surveyType}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Statutory Fee / SLA:</span>
                <span className="font-bold text-emerald-700">₹800 | 10 Days</span>
              </div>
              <div>
                <span className="text-slate-500 block">Requested Date:</span>
                <span className="font-bold text-slate-900">{requestedSurveyDate}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Survey Purpose:</span>
                <span className="font-medium text-slate-800">{surveyPurpose}</span>
              </div>
            </div>
          </div>

          {/* Review Section 3: Boundary & Neighbor Information */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              Boundary Demarcation & Neighbor Matrix
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-indigo-800 font-bold block mb-1">North Boundary:</span>
                <span className="text-slate-800">{boundaries.northBoundary}</span>
                <span className="text-slate-400 block text-[11px] mt-0.5">Neighbor: {neighbors.northNeighbor}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-indigo-800 font-bold block mb-1">South Boundary:</span>
                <span className="text-slate-800">{boundaries.southBoundary}</span>
                <span className="text-slate-400 block text-[11px] mt-0.5">Neighbor: {neighbors.southNeighbor}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-indigo-800 font-bold block mb-1">East Boundary:</span>
                <span className="text-slate-800">{boundaries.eastBoundary}</span>
                <span className="text-slate-400 block text-[11px] mt-0.5">Neighbor: {neighbors.eastNeighbor}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-indigo-800 font-bold block mb-1">West Boundary:</span>
                <span className="text-slate-800">{boundaries.westBoundary}</span>
                <span className="text-slate-400 block text-[11px] mt-0.5">Neighbor: {neighbors.westNeighbor}</span>
              </div>
            </div>

            {hasDispute === 'Yes' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Active Boundary Dispute Indicated
                </span>
                <p className="text-red-700"><strong>Description:</strong> {disputeDetails.disputeDescription}</p>
                <p className="text-red-700"><strong>Disputing Neighbor:</strong> {disputeDetails.neighborInDispute} | <strong>Court/Police Ref:</strong> {disputeDetails.courtOrPoliceRefNo}</p>
              </div>
            )}
          </div>

          {/* Review Section 4: Supporting Documents */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Attached FMB & Cadastral Records ({uploadedDocuments.length})
              </span>
            </h3>
            <div className="divide-y divide-slate-200">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">{doc.documentName}</span>
                    <span className="text-slate-400">({doc.fileSize})</span>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold uppercase">
                    Ready for Surveyor
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
              Back to Edit Form
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitApplication}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-700/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering Survey Requisition...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Survey Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 1: SURVEY REQUISITION FORM
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
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-black uppercase tracking-wider">
            Survey & Land Records
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            SLA: 10 Days
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold">
            Fee: ₹800
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Cadastral Boundary Demarcation & DGPS Survey
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Request official physical boundary identification, stone pegging, and differential GPS (DGPS) survey of the selected land parcel.
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
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Target Land Parcel (Retrieved from Cadastral Database)
              </h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
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
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-indigo-700 select-all"
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
                <span className="text-slate-500 block text-[11px] font-medium">Patta Number:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.pattaNumber}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
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
            </div>
          </div>

          {/* SECTION 2: SURVEY REQUEST PARAMETERS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-600" />
              Survey Request Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Survey Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={surveyType}
                  onChange={(e) => setSurveyType(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                >
                  <option value="Boundary Demarcation">Boundary Demarcation (Physical Pegging)</option>
                  <option value="DGPS Survey">DGPS Survey (Sub-Centimeter Geodetic)</option>
                  <option value="Boundary Dispute Resolution">Boundary Dispute Resolution</option>
                  <option value="Resurvey">Resurvey of Disputed Extents</option>
                  <option value="Sub-Division Survey">Sub-Division Survey (Pattadhar Split)</option>
                  <option value="Other">Other Supported Survey Type</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Requested Survey Area / Extent <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={requestedSurveyArea}
                  onChange={(e) => setRequestedSurveyArea(e.target.value)}
                  placeholder="e.g. 2.45 Acres"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Preferred Date for On-site Survey
                </label>
                <input
                  type="date"
                  value={requestedSurveyDate}
                  onChange={(e) => setRequestedSurveyDate(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Existing Survey Number (Read-only)
                </label>
                <input
                  type="text"
                  readOnly
                  value={landDetails.surveyNumber}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-mono font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Sub-Division Number (Read-only)
                </label>
                <input
                  type="text"
                  readOnly
                  value={landDetails.subDivision}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Previous Survey Reference / FMB Ref
                </label>
                <input
                  type="text"
                  value={previousSurveyRef}
                  onChange={(e) => setPreviousSurveyRef(e.target.value)}
                  placeholder="e.g. FMB-SRV-2018-0912"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-700 block text-[11px] font-bold">
                  Survey Purpose & Specific Demarcation Requirements <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={surveyPurpose}
                  onChange={(e) => setSurveyPurpose(e.target.value)}
                  placeholder="Describe purpose: e.g. Boundary dispute resolution with eastern neighbor, or physical corner stone pegging prior to boundary wall construction."
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs"
                ></textarea>
              </div>
            </div>
          </div>

          {/* SECTION 3: BOUNDARY & NEIGHBOR INFORMATION */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              Four-Side Boundary & Neighbor Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  North Boundary Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={boundaries.northBoundary}
                  onChange={(e) => setBoundaries({ ...boundaries, northBoundary: e.target.value })}
                  placeholder="e.g. Survey No. 141 or River Canal"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  North Neighbor / Neighboring Survey No.
                </label>
                <input
                  type="text"
                  value={neighbors.northNeighbor}
                  onChange={(e) => setNeighbors({ ...neighbors, northNeighbor: e.target.value })}
                  placeholder="e.g. P. Ramanathan (Survey No. 141)"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  South Boundary Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={boundaries.southBoundary}
                  onChange={(e) => setBoundaries({ ...boundaries, southBoundary: e.target.value })}
                  placeholder="e.g. 40 Feet Village Panchayat Road"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  South Neighbor / Neighboring Survey No.
                </label>
                <input
                  type="text"
                  value={neighbors.southNeighbor}
                  onChange={(e) => setNeighbors({ ...neighbors, southNeighbor: e.target.value })}
                  placeholder="e.g. Panchayat Road corridor"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  East Boundary Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={boundaries.eastBoundary}
                  onChange={(e) => setBoundaries({ ...boundaries, eastBoundary: e.target.value })}
                  placeholder="e.g. Survey No. 142/4B"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  East Neighbor / Neighboring Survey No.
                </label>
                <input
                  type="text"
                  value={neighbors.eastNeighbor}
                  onChange={(e) => setNeighbors({ ...neighbors, eastNeighbor: e.target.value })}
                  placeholder="e.g. Sundaram & Sons (Survey No. 142/4B)"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  West Boundary Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={boundaries.westBoundary}
                  onChange={(e) => setBoundaries({ ...boundaries, westBoundary: e.target.value })}
                  placeholder="e.g. Survey No. 143 (Canal Buffer)"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  West Neighbor / Neighboring Survey No.
                </label>
                <input
                  type="text"
                  value={neighbors.westNeighbor}
                  onChange={(e) => setNeighbors({ ...neighbors, westNeighbor: e.target.value })}
                  placeholder="e.g. State PWD Canal corridor"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {/* BOUNDARY DISPUTE SELECTOR */}
            <div className="pt-3 border-t border-slate-100">
              <label className="text-slate-700 block text-[11px] font-bold mb-2">
                Is there an active boundary dispute with any neighboring parcel? <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="hasDispute"
                    value="No"
                    checked={hasDispute === 'No'}
                    onChange={() => setHasDispute('No')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  No, clear undisputed boundary
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
                  <input
                    type="radio"
                    name="hasDispute"
                    value="Yes"
                    checked={hasDispute === 'Yes'}
                    onChange={() => setHasDispute('Yes')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  Yes, active boundary overlap / dispute
                </label>
              </div>

              {hasDispute === 'Yes' && (
                <div className="mt-3 p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-3 text-xs animate-in fade-in">
                  <span className="font-black text-red-900 block flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Boundary Dispute Details (Required for Surveyor Coordination)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-red-800 font-bold block text-[11px]">Neighbor Involved in Dispute:</label>
                      <input
                        type="text"
                        value={disputeDetails.neighborInDispute}
                        onChange={(e) => setDisputeDetails({ ...disputeDetails, neighborInDispute: e.target.value })}
                        placeholder="Name of neighbor and survey number"
                        className="w-full mt-1 px-3 py-2 bg-white border border-red-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-red-800 font-bold block text-[11px]">Court / Police Reference Number (if any):</label>
                      <input
                        type="text"
                        value={disputeDetails.courtOrPoliceRefNo}
                        onChange={(e) => setDisputeDetails({ ...disputeDetails, courtOrPoliceRefNo: e.target.value })}
                        placeholder="e.g. OS-2024/991 or CSR-88/2025"
                        className="w-full mt-1 px-3 py-2 bg-white border border-red-300 rounded-xl font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-red-800 font-bold block text-[11px]">Dispute Description:</label>
                      <textarea
                        rows={2}
                        value={disputeDetails.disputeDescription}
                        onChange={(e) => setDisputeDetails({ ...disputeDetails, disputeDescription: e.target.value })}
                        placeholder="Provide details regarding the boundary discrepancy..."
                        className="w-full mt-1 px-3 py-2 bg-white border border-red-300 rounded-xl text-xs"
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: SURVEY & DGPS DOCUMENTS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Cadastral Documents & FMB Dossier
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload FMB extracts, Patta copy, or boundary dispute papers (PDF, JPG, PNG up to 10MB each). Starts clean.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition shadow-sm self-start sm:self-auto">
                <Upload className="w-4 h-4" />
                Upload Documents
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
                Required Survey Checklist for {surveyType}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getSuggestedDocuments(surveyType, hasDispute).map((item, idx) => (
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
                <p className="text-xs font-bold text-slate-600">No survey records uploaded yet</p>
                <p className="text-[11px] text-slate-400">
                  Please upload Field Measurement Book (FMB) extract, Patta copy, or registered deed.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-indigo-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
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
                      title="Remove record"
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
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-700/20 transition flex items-center justify-center gap-2 active:scale-95"
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

export default DgpsSurveyWorkflow;
