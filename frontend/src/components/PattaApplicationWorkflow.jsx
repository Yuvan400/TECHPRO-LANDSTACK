import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, Landmark
} from 'lucide-react';
import api from '../services/api';

export const PattaApplicationWorkflow = ({
  parcel,
  deptData,
  user,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Workflow steps: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Existing patta number from revenue parameters if available
  const existingPatta = deptData?.revenue?.parameters?.find(p => p.label === 'Patta Number')?.value || 'PT-384912';

  // Section 1: Land Details (Auto-populated from the searched land record)
  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chennai',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    pattaNumber: existingPatta,
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    landClassification: parcel?.landType || 'Residential / Natham'
  };

  // Section 2: Applicant Details
  const [applicant, setApplicant] = useState({
    fullName: user?.fullName || 'Karthik Subramanian',
    guardianName: '',
    mobileNumber: '',
    email: user?.email || '',
    residentialAddress: ''
  });

  // Section 3: Patta Request Type
  const [requestType, setRequestType] = useState('New Patta');

  // Section 4: Application Reason
  const [reason, setReason] = useState('');

  // Section 5: Supporting Documents (Starts EMPTY per requirements - NO pre-attached documents)
  const [documents, setDocuments] = useState([]);

  // Errors & UI states
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdApplication, setCreatedApplication] = useState(null);

  // Dynamic document requirements based on selected Patta request type
  const getDocumentRequirements = () => {
    switch (requestType) {
      case 'New Patta':
        return [
          { name: 'Registered Sale Deed / Title Deed', required: true },
          { name: 'Latest Property Tax Receipt', required: true },
          { name: 'Identity Proof (Aadhaar / Voter ID)', required: true },
          { name: 'Encumbrance Certificate (EC)', required: false }
        ];
      case 'Patta Transfer':
        return [
          { name: 'Registered Transfer / Sale Deed', required: true },
          { name: 'Existing Patta Copy', required: true },
          { name: 'Legal Heirship Certificate (if inheritance)', required: false },
          { name: 'No-Objection Consent / Death Certificate', required: false }
        ];
      case 'Patta Correction':
        return [
          { name: 'Existing Error Patta Copy', required: true },
          { name: 'Field Measurement Book (FMB) Sketch', required: true },
          { name: 'Registered Title Deed with Correct Boundary', required: true },
          { name: 'Surveyor Field Report', required: false }
        ];
      case 'Duplicate / Certified Copy':
        return [
          { name: 'Police Non-Traceable Certificate / Affidavit', required: true },
          { name: 'Identity Proof of Land Owner', required: true },
          { name: 'Previous Patta Reference / Number Extract', required: true }
        ];
      default:
        return [
          { name: 'Title Deed Document', required: true },
          { name: 'Identity Proof', required: true }
        ];
    }
  };

  // Mobile number input handler (10 digits strictly, non-digits blocked)
  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setApplicant(prev => ({ ...prev, mobileNumber: val }));
    if (errors.mobileNumber) {
      setErrors(prev => ({ ...prev, mobileNumber: '' }));
    }
  };

  // File Upload Handler (No pre-attached files, validates file type & size)
  const handleFileUpload = (e) => {
    setFileError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setFileError('Unsupported file format. Please upload PDF, JPG, JPEG, or PNG files.');
        return;
      }

      if (file.size > maxSizeBytes) {
        setFileError(`File "${file.name}" exceeds maximum allowed size of 10MB.`);
        return;
      }

      const newDoc = {
        id: Date.now() + Math.random(),
        name: file.name,
        type: ext.toUpperCase(),
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        documentType: 'Supporting Document'
      };

      setDocuments(prev => [...prev, newDoc]);
    }

    // Reset file input
    e.target.value = null;
    if (errors.documents) {
      setErrors(prev => ({ ...prev, documents: '' }));
    }
  };

  // Remove document handler
  const handleRemoveDoc = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};

    if (!applicant.fullName.trim()) {
      errs.fullName = 'Please enter your name.';
    }

    if (!applicant.guardianName.trim()) {
      errs.guardianName = 'Please enter Father / Husband / Guardian Name.';
    }

    if (!applicant.mobileNumber || !/^[6-9]\d{9}$/.test(applicant.mobileNumber)) {
      errs.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    if (applicant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!applicant.residentialAddress.trim()) {
      errs.residentialAddress = 'Please enter your residential address.';
    }

    if (!requestType) {
      errs.requestType = 'Please select a Patta request type.';
    }

    if (!reason.trim()) {
      errs.reason = 'Please enter the reason for requesting the Patta service.';
    }

    if (documents.length === 0) {
      errs.documents = 'Please upload the required supporting document(s).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Proceed to review
  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit Patta Application to Backend API
  const handleSubmitPatta = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      // Fetch Patta service ID from backend (Service SRV-LOC-01 / ID 1)
      let serviceId = 1;
      try {
        const srvRes = await api.get('/api/services');
        const pattaSrv = srvRes.data?.find(s =>
          s.serviceName?.toLowerCase().includes('patta') || s.serviceCode === 'SRV-LOC-01'
        );
        if (pattaSrv) serviceId = pattaSrv.id;
      } catch (_) {}

      const remarksPayload = `[Patta Request: ${requestType}] Applicant: ${applicant.fullName} | Guardian: ${applicant.guardianName} | Mobile: ${applicant.mobileNumber} | Email: ${applicant.email || 'N/A'} | Address: ${applicant.residentialAddress} | Reason: ${reason} | Existing Patta: ${landDetails.pattaNumber}`;

      const payload = {
        ulpin: parcel.ulpin,
        serviceId: serviceId,
        citizenRemarks: remarksPayload.slice(0, 990),
        documents: documents.map(d => ({
          documentType: d.documentType || 'Patta Supporting Document',
          documentName: d.name,
          documentUrl: `/documents/${d.name}`,
          fileSize: d.size
        }))
      };

      const res = await api.post('/api/applications', payload);
      setCreatedApplication(res.data);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}

      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      console.error('Failed to submit Patta application:', err);
      setSubmitError(err.response?.data?.message || 'Failed to submit Patta application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* DEDICATED HEADER: Land Ownership Certificate (Patta) - Revenue Department */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              Revenue Department
            </span>
            <span className="text-xs text-slate-400 font-mono">Service SRV-LOC-01</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Land Ownership Certificate (Patta)
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Apply for a Land Ownership Certificate (Patta) for your selected land parcel.
          </p>
        </div>

        {onBack && step !== 'success' && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 backdrop-blur-sm transition flex items-center gap-1.5 self-start md:self-auto active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Land Records
          </button>
        )}
      </div>

      {/* STEP 1: DEDICATED PATTA APPLICATION FORM */}
      {step === 'form' && (
        <form onSubmit={handleProceedToReview} className="space-y-6">

          {/* SECTION A — LAND DETAILS (Retrieved from selected land record) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Section A — Land Details
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Land details are retrieved from your selected land record.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">ULPIN (Bhu-Aadhaar)</span>
                <span className="font-mono font-black text-blue-700 text-sm mt-0.5 block">{landDetails.ulpin}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Survey Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.surveyNumber}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Sub-Division Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.subDivision}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">District</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.district}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Taluk</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.taluk}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Village</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.village}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Existing Patta Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.pattaNumber}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Land Extent</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.landExtent}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Land Classification</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.landClassification}</span>
              </div>
            </div>
          </div>

          {/* SECTION B — APPLICANT DETAILS */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Section B — Applicant Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={applicant.fullName}
                  onChange={(e) => {
                    setApplicant({ ...applicant, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  placeholder="Enter full legal name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
                {errors.fullName && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Father / Husband / Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={applicant.guardianName}
                  onChange={(e) => {
                    setApplicant({ ...applicant, guardianName: e.target.value });
                    if (errors.guardianName) setErrors({ ...errors, guardianName: '' });
                  }}
                  placeholder="Enter guardian name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
                {errors.guardianName && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.guardianName}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mobile Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold font-mono text-xs">+91</span>
                  <input
                    type="text"
                    value={applicant.mobileNumber}
                    onChange={handleMobileChange}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                {errors.mobileNumber && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.mobileNumber}</p>}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={applicant.email}
                  onChange={(e) => {
                    setApplicant({ ...applicant, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
                {errors.email && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.email}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  Residential Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={applicant.residentialAddress}
                  onChange={(e) => {
                    setApplicant({ ...applicant, residentialAddress: e.target.value });
                    if (errors.residentialAddress) setErrors({ ...errors, residentialAddress: '' });
                  }}
                  placeholder="Enter complete permanent residential address"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                />
                {errors.residentialAddress && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.residentialAddress}</p>}
              </div>
            </div>
          </div>

          {/* SECTION C — PATTA REQUEST TYPE */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Section C — Patta Request Type
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                { id: 'New Patta', desc: 'Fresh Patta issuance for uncertified land' },
                { id: 'Patta Transfer', desc: 'Ownership title transfer after sale or inheritance' },
                { id: 'Patta Correction', desc: 'Correcting spelling, survey or boundary errors' },
                { id: 'Duplicate / Certified Copy', desc: 'Replacing damaged or misplaced Patta' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRequestType(opt.id)}
                  className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    requestType === opt.id
                      ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-sm ring-2 ring-blue-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm">{opt.id}</span>
                    {requestType === opt.id && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-2 block leading-relaxed">{opt.desc}</span>
                </button>
              ))}
            </div>
            {errors.requestType && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.requestType}</p>}
          </div>

          {/* SECTION D — REASON FOR APPLICATION */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Section D — Reason for Application
              </h3>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-bold mb-1">
                Reason for Application <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) setErrors({ ...errors, reason: '' });
                }}
                placeholder="Enter the reason for requesting the Patta service"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
              />
              {errors.reason && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.reason}</p>}
            </div>
          </div>

          {/* SECTION E — SUPPORTING DOCUMENTS (Citizen uploads where required - NO pre-attached documents) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Supporting Documents
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Formats: <strong>PDF, JPG, JPEG, PNG</strong> (Max: 10MB per file)
              </span>
            </div>

            {/* Dynamic Checklist based on selected Request Type */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-1.5">
              <span className="font-bold text-blue-900 block">
                Required / Recommended Documents for {requestType}:
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {getDocumentRequirements().map((req, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                      req.required
                        ? 'bg-blue-100/70 border-blue-300 text-blue-900 font-semibold'
                        : 'bg-white/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    {req.name} {req.required && <strong className="text-red-500">*</strong>}
                  </span>
                ))}
              </div>
            </div>

            {/* Upload Box */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="patta-workflow-upload"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="patta-workflow-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-blue-700 hover:underline">
                  Click to upload supporting documents
                </span>
                <span className="text-xs text-slate-500">
                  Upload your Sale Deed, ID Proof or Tax Receipts
                </span>
              </label>
            </div>

            {fileError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Uploaded List (Starts Empty, populated by citizen) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Uploaded Documents ({documents.length})
              </span>

              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No documents uploaded yet. Please click the upload area above to attach documents.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                          {doc.type}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{doc.name}</span>
                          <span className="text-[10px] text-slate-500">{doc.size}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.documents && (
                <p className="text-red-600 text-xs font-semibold">{errors.documents}</p>
              )}
            </div>
          </div>

          {/* Form Action Bar */}
          <div className="pt-2 flex items-center justify-between">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
            ) : <div></div>}

            <button
              type="submit"
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-700/30 transition flex items-center gap-2 active:scale-95"
            >
              Review Application
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      )}

      {/* STEP 2: PATTA APPLICATION REVIEW */}
      {step === 'review' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              Patta Application Review
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              Review Patta Application
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify all statutory details and documents before final submission.
            </p>
          </div>

          {/* Land Details Summary */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Land Details
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><span className="text-slate-500 block">ULPIN:</span> <strong className="font-mono text-blue-700 block text-sm">{landDetails.ulpin}</strong></div>
              <div><span className="text-slate-500 block">Survey Number:</span> <strong className="font-mono text-slate-900 block text-sm">{landDetails.surveyNumber}</strong></div>
              <div><span className="text-slate-500 block">Sub-Division:</span> <strong className="font-mono text-slate-900 block">{landDetails.subDivision}</strong></div>
              <div><span className="text-slate-500 block">Location:</span> <strong className="text-slate-900 block">{landDetails.village}, {landDetails.taluk}, {landDetails.district}</strong></div>
              <div><span className="text-slate-500 block">Existing Patta No:</span> <strong className="font-mono text-slate-900 block">{landDetails.pattaNumber}</strong></div>
              <div><span className="text-slate-500 block">Land Extent:</span> <strong className="text-slate-900 block">{landDetails.landExtent}</strong></div>
              <div><span className="text-slate-500 block">Classification:</span> <strong className="text-slate-900 block">{landDetails.landClassification}</strong></div>
            </div>
          </div>

          {/* Applicant Details Summary */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Applicant Details
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500 block">Full Name:</span> <strong className="text-slate-900 block text-sm">{applicant.fullName}</strong></div>
              <div><span className="text-slate-500 block">Guardian Name:</span> <strong className="text-slate-900 block">{applicant.guardianName}</strong></div>
              <div><span className="text-slate-500 block">Mobile Number:</span> <strong className="font-mono text-slate-900 block">+91 {applicant.mobileNumber}</strong></div>
              <div><span className="text-slate-500 block">Email Address:</span> <strong className="text-slate-900 block">{applicant.email || 'N/A'}</strong></div>
              <div className="col-span-2"><span className="text-slate-500 block">Residential Address:</span> <strong className="text-slate-900 block">{applicant.residentialAddress}</strong></div>
            </div>
          </div>

          {/* Request Type & Reason */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Application Details
            </span>
            <div><span className="text-slate-500 block">Patta Request Type:</span> <strong className="text-blue-700 text-sm block">{requestType}</strong></div>
            <div><span className="text-slate-500 block">Reason for Application:</span> <p className="text-slate-900 mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">{reason}</p></div>
          </div>

          {/* Uploaded Documents Summary */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Uploaded Documents ({documents.length})
            </span>
            <ul className="divide-y divide-slate-200">
              {documents.map(d => (
                <li key={d.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium text-slate-900">{d.name}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{d.size}</span>
                </li>
              ))}
            </ul>
          </div>

          {submitError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Edit
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitPatta}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Check className="w-4 h-4" />
              )}
              Submit Patta Application
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: APPLICATION SUCCESS PAGE */}
      {step === 'success' && createdApplication && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-slate-900">
              Patta Application Submitted Successfully
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your Land Ownership Certificate (Patta) application has been officially recorded in the State Land Registry.
            </p>
          </div>

          {/* Success Dossier Card */}
          <div className="bg-slate-50 max-w-md mx-auto rounded-2xl p-5 border border-slate-200 text-left space-y-3 text-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Application ID</span>
              <span className="font-mono font-black text-blue-700 text-sm">
                {createdApplication.applicationNumber || `PATTA-${createdApplication.id}`}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Service</span>
              <span className="font-bold text-slate-900">
                Land Ownership Certificate (Patta)
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-bold uppercase text-[10px]">ULPIN</span>
              <span className="font-mono font-bold text-blue-700">
                {parcel?.ulpin}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Survey Number</span>
              <span className="font-mono font-bold text-slate-900">
                {parcel?.surveyNumber}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Status</span>
              <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-blue-100 text-blue-800 border border-blue-200">
                Submitted
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Submission Date</span>
              <span className="font-mono text-slate-700 font-bold">
                {new Date().toLocaleDateString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/applications/${createdApplication.id}`)}
              className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-700/30 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Clock className="w-4 h-4" />
              Track Application
            </button>

            <button
              type="button"
              onClick={() => {
                if (onBack) onBack();
                else navigate('/dashboard');
              }}
              className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 active:scale-95"
            >
              Back to Citizen Dashboard
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default PattaApplicationWorkflow;
