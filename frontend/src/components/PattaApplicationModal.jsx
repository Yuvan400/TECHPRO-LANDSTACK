import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  X, Trash2, ArrowLeft, ArrowRight, Building2, User, FileCheck,
  Clock, Check, MapPin, Eye
} from 'lucide-react';
import api from '../services/api';

export const PattaApplicationModal = ({
  parcel,
  deptData,
  user,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Multi-step modal state: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Existing patta number from revenue parameters if available
  const existingPatta = deptData?.revenue?.parameters?.find(p => p.label === 'Patta Number')?.value || 'PT-384912';

  // Section A: Land Details (Pre-populated from searched record)
  const [landDetails] = useState({
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chennai',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    pattaNumber: existingPatta,
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    landClassification: parcel?.landType || 'Residential / Natham'
  });

  // Section B: Applicant Details
  const [applicant, setApplicant] = useState({
    fullName: user?.fullName || 'Karthik Subramanian',
    guardianName: 'S. Subramanian',
    mobileNumber: '9840123456',
    email: user?.email || 'citizen@landstack.demo',
    residentialAddress: 'No. 14, Gandhi Road, Selaiyur, Tambaram, Chennai - 600073'
  });

  // Section C: Application Details
  const [applicationType, setApplicationType] = useState('New Patta');
  const [purpose, setPurpose] = useState('Request for official statutory digital Land Ownership Certificate (Patta) with synchronized cadastral boundary validation.');

  // Section D: Documents Upload
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Registered_Sale_Deed_Doc884.pdf',
      type: 'PDF',
      size: '2.4 MB',
      documentType: 'Registered Sale Deed'
    },
    {
      id: 2,
      name: 'Encumbrance_Certificate_2026.pdf',
      type: 'PDF',
      size: '1.1 MB',
      documentType: 'Encumbrance Certificate'
    },
    {
      id: 3,
      name: 'Property_Tax_Receipt_Latest.pdf',
      type: 'PDF',
      size: '0.8 MB',
      documentType: 'Latest Property Tax Receipt'
    },
    {
      id: 4,
      name: 'Aadhaar_Masked_Verified.pdf',
      type: 'PDF',
      size: '0.9 MB',
      documentType: 'Identity Proof'
    }
  ]);

  // Form errors & upload errors
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdApplication, setCreatedApplication] = useState(null);

  // Mobile number input handler: accepts only digits up to 10 chars
  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setApplicant(prev => ({ ...prev, mobileNumber: val }));
    if (errors.mobileNumber) {
      setErrors(prev => ({ ...prev, mobileNumber: '' }));
    }
  };

  // Document File Upload Handler
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

      // Add valid file
      const newDoc = {
        id: Date.now() + Math.random(),
        name: file.name,
        type: ext.toUpperCase(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        documentType: 'Supporting Document'
      };

      setDocuments(prev => [...prev, newDoc]);
    }

    // Reset input
    e.target.value = null;
  };

  // Remove document
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

    // Indian mobile number validation (10 digits, starts with 6-9)
    if (!applicant.mobileNumber || !/^[6-9]\d{9}$/.test(applicant.mobileNumber)) {
      errs.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }

    // Email validation
    if (applicant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!applicant.residentialAddress.trim()) {
      errs.residentialAddress = 'Please enter residential address.';
    }

    if (!applicationType) {
      errs.applicationType = 'Please select an application type.';
    }

    if (!purpose.trim()) {
      errs.purpose = 'Please enter the reason for requesting the Patta service.';
    }

    if (documents.length === 0) {
      errs.documents = 'Please upload at least one supporting document.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Proceed to review
  const handleProceedToReview = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
    }
  };

  // Final Confirmation & Submission
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      // Find service ID for Patta (default 1)
      let serviceId = 1;
      try {
        const srvRes = await api.get('/api/services');
        const pattaSrv = srvRes.data?.find(s =>
          s.serviceName?.toLowerCase().includes('patta') || s.serviceCode === 'SRV-LOC-01'
        );
        if (pattaSrv) serviceId = pattaSrv.id;
      } catch (_) {}

      const remarksSummary = `[${applicationType}] Applicant: ${applicant.fullName} | Guardian: ${applicant.guardianName} | Mobile: ${applicant.mobileNumber} | Address: ${applicant.residentialAddress} | Purpose: ${purpose} | Existing Patta: ${landDetails.pattaNumber}`;

      const payload = {
        ulpin: parcel.ulpin,
        serviceId: serviceId,
        citizenRemarks: remarksSummary.slice(0, 990),
        documents: documents.map(d => ({
          documentType: d.documentType || 'Supporting Document',
          documentName: d.name,
          documentUrl: `/documents/${d.name}`,
          fileSize: d.size
        }))
      };

      const res = await api.post('/api/applications', payload);
      setCreatedApplication(res.data);
      setStep('success');

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}

      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      console.error('Failed to submit application:', err);
      setSubmitError(err.response?.data?.message || 'Failed to submit Patta application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start pt-10 sm:pt-14 pb-10 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-0">

        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase">
                  Revenue Dept • Service SRV-LOC-01
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Land Ownership Certificate (Patta)
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Statutory land title certificate and Jamabandi ownership transfer application.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 font-semibold">
            <span className={`flex items-center gap-1.5 ${step === 'form' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'form' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                1
              </span>
              Application Form
            </span>
            <span className="text-slate-300">›</span>
            <span className={`flex items-center gap-1.5 ${step === 'review' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'review' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                2
              </span>
              Review & Verification
            </span>
            <span className="text-slate-300">›</span>
            <span className={`flex items-center gap-1.5 ${step === 'success' ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                3
              </span>
              Confirmation
            </span>
          </div>

          <span className="text-xs font-mono text-slate-500 hidden sm:inline">
            Target ULPIN: <strong className="text-blue-700">{parcel?.ulpin}</strong>
          </span>
        </div>

        {/* MODAL CONTENT: STEP 1 - FORM */}
        {step === 'form' && (
          <form onSubmit={handleProceedToReview} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">

            {/* SECTION A — LAND DETAILS (Pre-populated from searched record) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Section A — Land Details
                  </h3>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Land details retrieved from your selected land record.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">ULPIN (Bhu-Aadhaar)</span>
                  <span className="font-mono font-black text-blue-700 text-sm mt-0.5 block">{landDetails.ulpin}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Survey Number</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.surveyNumber}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Sub-Division Number</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.subDivision}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">District</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.district}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Taluk</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.taluk}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Village</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.village}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Existing Patta Number</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.pattaNumber}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Land Extent</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.landExtent}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Land Classification</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{landDetails.landClassification}</span>
                </div>
              </div>
            </div>

            {/* SECTION B — APPLICANT DETAILS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Section B — Applicant Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
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

                {/* Father / Husband / Guardian Name */}
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

                {/* Mobile Number */}
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

                {/* Email Address */}
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

                {/* Residential Address */}
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

            {/* SECTION C — APPLICATION DETAILS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Section C — Application Details
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* Application Type */}
                <div>
                  <label className="block text-slate-700 font-bold mb-2">
                    Application Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['New Patta', 'Patta Transfer', 'Correction / Modification', 'Duplicate / Certified Copy'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setApplicationType(type)}
                        className={`p-3 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                          applicationType === type
                            ? 'bg-blue-50 border-blue-600 text-blue-800 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{type}</span>
                        {applicationType === type && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                  {errors.applicationType && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.applicationType}</p>}
                </div>

                {/* Purpose / Reason */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Purpose / Reason for Requesting Patta <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={purpose}
                    onChange={(e) => {
                      setPurpose(e.target.value);
                      if (errors.purpose) setErrors({ ...errors, purpose: '' });
                    }}
                    placeholder="Enter the reason for requesting the Patta service"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
                  />
                  {errors.purpose && <p className="text-red-600 text-[11px] mt-1 font-semibold">{errors.purpose}</p>}
                </div>
              </div>
            </div>

            {/* SECTION D — SUPPORTING DOCUMENTS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Supporting Documents
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Accepted formats: <strong>PDF, JPG, JPEG, PNG</strong> (Max: 10MB per file)
                </span>
              </div>

              {/* Requirements Banner */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                <strong>Statutory Patta Checklist:</strong> Registered Sale Deed, Encumbrance Certificate (EC), Latest Property Tax Receipt, Identity Proof (Aadhaar / Voter ID).
              </div>

              {/* Upload Input */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="patta-file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="patta-file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-blue-700 hover:underline">
                    Click to browse files to attach
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Upload your Registered Sale Deed, Tax receipts or ID Proof
                  </span>
                </label>
              </div>

              {fileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Document List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Attached Documents ({documents.length})
                </span>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                        {doc.type}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{doc.name}</span>
                        <span className="text-[10px] text-slate-500">{doc.documentType} • {doc.size}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {errors.documents && (
                  <p className="text-red-600 text-[11px] font-semibold">{errors.documents}</p>
                )}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-700/30 transition flex items-center gap-2 active:scale-95"
              >
                Review Application
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        )}

        {/* MODAL CONTENT: STEP 2 - REVIEW */}
        {step === 'review' && (
          <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 animate-in fade-in">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Review Application Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all land, applicant, and document parameters before official statutory submission.
              </p>
            </div>

            {/* Land Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Land Record Reference</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div><span className="text-slate-500">ULPIN:</span> <strong className="font-mono text-blue-700 block">{landDetails.ulpin}</strong></div>
                <div><span className="text-slate-500">Survey No:</span> <strong className="font-mono text-slate-900 block">{landDetails.surveyNumber}/{landDetails.subDivision}</strong></div>
                <div><span className="text-slate-500">Location:</span> <strong className="text-slate-900 block">{landDetails.village}, {landDetails.taluk}</strong></div>
                <div><span className="text-slate-500">Existing Patta:</span> <strong className="font-mono text-slate-900 block">{landDetails.pattaNumber}</strong></div>
                <div><span className="text-slate-500">Area Extent:</span> <strong className="text-slate-900 block">{landDetails.landExtent}</strong></div>
                <div><span className="text-slate-500">Classification:</span> <strong className="text-slate-900 block">{landDetails.landClassification}</strong></div>
              </div>
            </div>

            {/* Applicant Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Applicant Details</span>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">Full Name:</span> <strong className="text-slate-900 block">{applicant.fullName}</strong></div>
                <div><span className="text-slate-500">Guardian Name:</span> <strong className="text-slate-900 block">{applicant.guardianName}</strong></div>
                <div><span className="text-slate-500">Mobile Number:</span> <strong className="font-mono text-slate-900 block">+91 {applicant.mobileNumber}</strong></div>
                <div><span className="text-slate-500">Email:</span> <strong className="text-slate-900 block">{applicant.email || 'N/A'}</strong></div>
                <div className="col-span-2"><span className="text-slate-500">Residential Address:</span> <strong className="text-slate-900 block">{applicant.residentialAddress}</strong></div>
              </div>
            </div>

            {/* Service & Purpose */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Service Details</span>
              <div><span className="text-slate-500">Application Type:</span> <strong className="text-blue-700 block text-sm">{applicationType}</strong></div>
              <div><span className="text-slate-500">Purpose / Reason:</span> <p className="text-slate-800 mt-0.5">{purpose}</p></div>
            </div>

            {/* Attached Documents */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Attached Documents ({documents.length})</span>
              <ul className="divide-y divide-slate-200">
                {documents.map(d => (
                  <li key={d.id} className="py-1.5 flex items-center justify-between">
                    <span className="font-medium text-slate-800">{d.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{d.size}</span>
                  </li>
                ))}
              </ul>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit Form
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm & Submit
              </button>
            </div>

          </div>
        )}

        {/* MODAL CONTENT: STEP 3 - SUCCESS CONFIRMATION */}
        {step === 'success' && createdApplication && (
          <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-2xl font-black text-slate-900">
                Application Submitted Successfully
              </h3>
              <p className="text-xs text-slate-500">
                Your Patta service request has been officially recorded in the State LandStack Cadastral Registry.
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
                <span className="font-mono font-bold text-slate-800">
                  {parcel?.ulpin}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Status</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Submitted
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Submitted Date</span>
                <span className="font-mono text-slate-700 font-bold">
                  {new Date().toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/applications/${createdApplication.id}`);
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-700/30 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <Clock className="w-4 h-4" />
                Track Application
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 active:scale-95"
              >
                Back to Citizen Dashboard
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default PattaApplicationModal;
