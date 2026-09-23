import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, UserCheck, Scale, Users
} from 'lucide-react';
import api from '../services/api';

export const PropertyMutationWorkflow = ({
  parcel,
  deptData,
  user,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Workflow steps: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Section 1: Land Details (Auto-populated & read-only from searched record)
  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chennai',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    existingPattaNumber: parcel?.pattaNumber || 'PATTA-2024-9912',
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    currentClassification: parcel?.landType || 'Agricultural / Natham'
  };

  // Section 2A: Current Ownership Details
  const [currentOwnership] = useState({
    currentOwnerName: parcel?.ownerName || 'Karthik Subramanian',
    currentPattaNumber: parcel?.pattaNumber || 'PATTA-2024-9912',
    ownershipType: 'Individual Freehold',
    landExtent: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres'
  });

  // Section 2B: New Owner / Transferee Details
  const [newOwner, setNewOwner] = useState({
    fullName: user?.fullName || 'Venkatesh Raman',
    guardianName: 'Ramanathan Iyer',
    mobileNumber: '9840123456',
    email: user?.email || 'venkatesh.raman@gmail.com',
    address: 'Flat 4B, Shanti Enclave, 1st Cross Street, Selaiyur, Chennai - 600073'
  });

  // Section 2C: Transfer Details
  const [mutationType, setMutationType] = useState('Sale'); // Sale, Inheritance, Gift, Partition, Settlement, Court Order, Other
  const [transferDetails, setTransferDetails] = useState({
    documentNumber: 'DOC/SRO-TB/2026/8841',
    documentDate: '2026-02-15',
    registrationOffice: 'Sub-Registrar Office, Tambaram',
    registrationNumber: 'REG-TN-2026-00452',
    transferReason: 'Full title conveyancing via registered absolute sale deed.'
  });

  // Section 2D: Inheritance-specific fields (only if mutationType === 'Inheritance')
  const [inheritanceDetails, setInheritanceDetails] = useState({
    deceasedOwnerName: 'Late S. Ramanathan',
    dateOfDeath: '2025-08-10',
    relationshipWithApplicant: 'Son / Legal Heir',
    legalHeirCount: '2',
    legalHeirCertificateNo: 'LHC-REV-2025-78129',
    legalHeirSummary: 'Applicant (Son) and Radha Ramanathan (Spouse), all NOC affidavits obtained.'
  });

  // Section 3: Supporting Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  // Dynamic suggested document list based on Mutation Type
  const getSuggestedDocuments = (type) => {
    switch (type) {
      case 'Inheritance':
        return [
          { type: 'Death Certificate', desc: 'Official death certificate of the deceased registered owner', required: true },
          { type: 'Legal Heir Certificate', desc: 'Statutory certificate issued by Tahsildar / Revenue Department', required: true },
          { type: 'Registered Title Deed / Previous Patta', desc: 'Parent title deed or existing Patta extract', required: true },
          { type: 'No-Objection Affidavit from Other Heirs', desc: 'Notarized consent or relinquishment deed if applicable', required: false },
          { type: 'Identity Proof of Transferee', desc: 'Aadhaar Card / Voter ID / PAN of new owner', required: true }
        ];
      case 'Sale':
        return [
          { type: 'Registered Sale Deed', desc: 'Duly registered conveyance deed from Sub-Registrar Office', required: true },
          { type: 'Encumbrance Certificate (EC)', desc: 'Recent EC showing nil encumbrance post-registration', required: true },
          { type: 'Existing Patta Copy', desc: 'Previous owner Patta / Chitta extract', required: true },
          { type: 'Identity Proof of Buyer', desc: 'Aadhaar Card / Voter ID / Passport', required: true },
          { type: 'Property Tax Receipt', desc: 'Latest municipal / panchayat tax paid receipt', required: false }
        ];
      case 'Gift':
      case 'Settlement':
        return [
          { type: 'Registered Gift / Settlement Deed', desc: 'Registered settlement deed with family relationship proof', required: true },
          { type: 'Identity Proof of Donor & Donee', desc: 'Government photo IDs of both parties', required: true },
          { type: 'Existing Patta / Chitta', desc: 'Current revenue record extract', required: true },
          { type: 'Encumbrance Certificate', desc: 'Registration certificate confirming deed entry', required: false }
        ];
      case 'Partition':
        return [
          { type: 'Registered Partition Deed / Decree', desc: 'Family partition deed or preliminary/final decree', required: true },
          { type: 'Cadastral Sub-Division Sketch', desc: 'Demarcated share sketch for mutation entry', required: true },
          { type: 'Parent Document & Patta', desc: 'Joint ancestral title documents', required: true },
          { type: 'Identity Proof', desc: 'Aadhaar / Voter ID of applicant', required: true }
        ];
      case 'Court Order':
        return [
          { type: 'Certified Court Decree / Order', desc: 'Final judgment and decree copy with court seal', required: true },
          { type: 'Execution Petition / Revenue Order', desc: 'Revenue compliance order from competent court', required: true },
          { type: 'Existing Revenue Records', desc: 'Patta / Survey sketch extract', required: true },
          { type: 'Identity Proof', desc: 'Aadhaar / Passport of decreed owner', required: true }
        ];
      default:
        return [
          { type: 'Registered Transfer Document', desc: 'Official registered instrument confirming transfer', required: true },
          { type: 'Existing Patta Copy', desc: 'Current revenue record extract', required: true },
          { type: 'Identity Proof', desc: 'Government photo ID of applicant', required: true }
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
    if (!newOwner.fullName.trim()) return 'Please enter the new owner / applicant name.';
    if (!newOwner.mobileNumber.trim() || newOwner.mobileNumber.length < 10) return 'Please enter a valid 10-digit mobile number.';
    if (!newOwner.address.trim()) return 'Please enter the residential address.';
    if (!transferDetails.documentNumber.trim()) return 'Please enter the registration or document number.';
    if (!transferDetails.registrationOffice.trim()) return 'Please enter the registration Sub-Registrar Office.';

    if (mutationType === 'Inheritance') {
      if (!inheritanceDetails.deceasedOwnerName.trim()) return 'Please enter the deceased owner name.';
      if (!inheritanceDetails.dateOfDeath) return 'Please enter the date of death.';
      if (!inheritanceDetails.legalHeirCertificateNo.trim()) return 'Please enter the Legal Heir Certificate Number.';
    }

    if (uploadedDocuments.length === 0) {
      return 'Please upload at least one required supporting document (e.g. Registered Sale Deed, Death Certificate, or Legal Heir Certificate).';
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
      // Find serviceId for SRV-MUT-04 (default 4)
      let serviceId = 4;
      try {
        const servicesRes = await api.get('/api/services');
        const mutService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-MUT-04' || s.serviceName?.toLowerCase().includes('mutation')
        );
        if (mutService) serviceId = mutService.id;
      } catch (err) {
        console.warn('Could not lookup service id, fallback to 4', err);
      }

      const remarksSummary = `[Property Mutation & Jamabandi Entry] Type: ${mutationType} | Document No: ${transferDetails.documentNumber} | SRO: ${transferDetails.registrationOffice} | Transferee: ${newOwner.fullName} | Mobile: ${newOwner.mobileNumber}${mutationType === 'Inheritance' ? ` | Deceased: ${inheritanceDetails.deceasedOwnerName} (DOD: ${inheritanceDetails.dateOfDeath}) | LHC No: ${inheritanceDetails.legalHeirCertificateNo}` : ''} | Reason: ${transferDetails.transferReason}`;

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

      const generatedNum = res.data?.applicationNumber || `MUT-2026-${Math.floor(10000000 + Math.random() * 90000000)}`;

      setGeneratedApplication({
        ...res.data,
        applicationNumber: generatedNum,
        mutationType: mutationType,
        newOwnerName: newOwner.fullName,
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
      setSubmitError(err.response?.data?.message || 'Failed to submit Property Mutation application. Please try again.');
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
        <div className="w-20 h-20 bg-blue-100 text-blue-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-black uppercase tracking-wider">
            Statutory Jamabandi Registry Submission
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Property Mutation Application Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your request for Property Mutation & Jamabandi Entry has been officially received and routed to the Revenue Divisional Officer / Tahsildar for verification.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
            <span className="text-slate-500 font-sans font-bold">Application ID:</span>
            <span className="font-black text-blue-700 text-base">{generatedApplication.applicationNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-sans font-bold block">Service:</span>
              <span className="font-bold text-slate-900">Property Mutation & Jamabandi Entry</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Mutation Type:</span>
              <span className="font-bold text-blue-800">{mutationType}</span>
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
              <span className="text-slate-500 font-sans font-bold block">Transferee / New Owner:</span>
              <span className="font-bold text-slate-900">{newOwner.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Submission Date:</span>
              <span className="font-bold text-slate-900">{generatedApplication.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Statutory SLA:</span>
              <span className="font-bold text-blue-700">14 Days</span>
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
            className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
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
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Step 2 of 2: Final Verification
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              Review Property Mutation & Jamabandi Application
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Please thoroughly verify all transfer details, registered deeds, and legal heir declarations prior to official submission.
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
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Target Land Parcel Record (Verified via Cadastre)
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
                <span className="text-slate-500 block">Village / Taluk:</span>
                <span className="font-bold text-slate-900">{landDetails.village}, {landDetails.taluk}</span>
              </div>
              <div>
                <span className="text-slate-500 block">District:</span>
                <span className="font-bold text-slate-900">{landDetails.district}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Patta No:</span>
                <span className="font-mono font-bold text-slate-900">{landDetails.existingPattaNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Land Extent:</span>
                <span className="font-bold text-slate-900">{landDetails.landExtent}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Classification:</span>
                <span className="font-bold text-slate-900">{landDetails.currentClassification}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Registered Owner:</span>
                <span className="font-bold text-slate-900">{currentOwnership.currentOwnerName}</span>
              </div>
            </div>
          </div>

          {/* Review Section 2: Transferee / New Owner */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              New Owner / Transferee Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">New Owner Name:</span>
                <span className="font-bold text-slate-900">{newOwner.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Guardian / Father's Name:</span>
                <span className="font-bold text-slate-900">{newOwner.guardianName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile & Email:</span>
                <span className="font-bold text-slate-900">{newOwner.mobileNumber} | {newOwner.email}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Residential Address:</span>
                <span className="font-bold text-slate-900">{newOwner.address}</span>
              </div>
            </div>
          </div>

          {/* Review Section 3: Transfer & Mutation Parameters */}
          <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              Transfer Instrument & Mutation Parameters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Mutation Type:</span>
                <span className="font-black text-blue-800 uppercase tracking-wide bg-blue-100 px-2 py-0.5 rounded inline-block mt-0.5">
                  {mutationType}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Document / Deed Number:</span>
                <span className="font-mono font-bold text-slate-900">{transferDetails.documentNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registration Office (SRO):</span>
                <span className="font-bold text-slate-900">{transferDetails.registrationOffice}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Document Date:</span>
                <span className="font-bold text-slate-900">{transferDetails.documentDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registration Number:</span>
                <span className="font-mono font-bold text-slate-900">{transferDetails.registrationNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Statutory Fee / SLA:</span>
                <span className="font-bold text-emerald-700">₹300 | 14 Days</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Transfer / Mutation Reason:</span>
                <span className="font-medium text-slate-800">{transferDetails.transferReason}</span>
              </div>
            </div>

            {mutationType === 'Inheritance' && (
              <div className="mt-3 pt-3 border-t border-blue-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Deceased Owner Name:</span>
                  <span className="font-bold text-red-900">{inheritanceDetails.deceasedOwnerName} (DOD: {inheritanceDetails.dateOfDeath})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Relationship / Legal Heir Cert:</span>
                  <span className="font-bold text-slate-900">{inheritanceDetails.relationshipWithApplicant} | Cert No: {inheritanceDetails.legalHeirCertificateNo}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Legal Heirs Summary:</span>
                  <span className="font-medium text-slate-800">{inheritanceDetails.legalHeirSummary}</span>
                </div>
              </div>
            )}
          </div>

          {/* Review Section 4: Supporting Documents */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Attached Supporting Documents ({uploadedDocuments.length})
              </span>
            </h3>
            <div className="divide-y divide-slate-200">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900">{doc.documentName}</span>
                    <span className="text-slate-400">({doc.fileSize})</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase">
                    Ready for Ingestion
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
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-700/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting to Revenue Jamabandi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Mutation Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 1: APPLICATION FORM
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
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-black uppercase tracking-wider">
            Revenue Department
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            SLA: 14 Days
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold">
            Fee: ₹300
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Property Mutation & Jamabandi Entry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Update ownership and land records following sale, inheritance, gift, partition, or other legally recognized transfer.
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
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Target Land Parcel (Retrieved from Cadastral Database)
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
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
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-blue-700 select-all"
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
                <span className="text-slate-500 block text-[11px] font-medium">Existing Patta No:</span>
                <input
                  type="text"
                  readOnly
                  value={landDetails.existingPattaNumber}
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

          {/* SECTION 2A: CURRENT OWNERSHIP DETAILS */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              A. Current Ownership Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-600 block text-[11px] font-bold">Current Registered Owner:</label>
                <input
                  type="text"
                  readOnly
                  value={currentOwnership.currentOwnerName}
                  className="w-full mt-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-slate-600 block text-[11px] font-bold">Ownership Type:</label>
                <input
                  type="text"
                  readOnly
                  value={currentOwnership.ownershipType}
                  className="w-full mt-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-slate-600 block text-[11px] font-bold">Extent Under Transfer:</label>
                <input
                  type="text"
                  readOnly
                  value={currentOwnership.landExtent}
                  className="w-full mt-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2B: NEW OWNER / TRANSFEREE DETAILS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              B. New Owner / Transferee Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  New Owner / Buyer Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newOwner.fullName}
                  onChange={(e) => setNewOwner({ ...newOwner, fullName: e.target.value })}
                  placeholder="Enter full legal name"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Father / Husband / Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newOwner.guardianName}
                  onChange={(e) => setNewOwner({ ...newOwner, guardianName: e.target.value })}
                  placeholder="Enter guardian name"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Mobile Number (For SMS Status Alerts) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newOwner.mobileNumber}
                  onChange={(e) => setNewOwner({ ...newOwner, mobileNumber: e.target.value })}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newOwner.email}
                  onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-700 block text-[11px] font-bold">
                  Residential Communication Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={newOwner.address}
                  onChange={(e) => setNewOwner({ ...newOwner, address: e.target.value })}
                  placeholder="Full permanent / communication address with PIN code"
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white text-xs"
                ></textarea>
              </div>
            </div>
          </div>

          {/* SECTION 2C: TRANSFER DETAILS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              C. Transfer Instrument & Mutation Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Mutation Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={mutationType}
                  onChange={(e) => setMutationType(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="Sale">Sale (Absolute Sale Deed)</option>
                  <option value="Inheritance">Inheritance / Succession</option>
                  <option value="Gift">Gift (Daan Patra)</option>
                  <option value="Partition">Partition (Family Settlement)</option>
                  <option value="Settlement">Settlement Deed</option>
                  <option value="Court Order">Court Order / Decree</option>
                  <option value="Other">Other Supported Type</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Registered Document Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transferDetails.documentNumber}
                  onChange={(e) => setTransferDetails({ ...transferDetails, documentNumber: e.target.value })}
                  placeholder="e.g. DOC/2026/8841"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Document Registration Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={transferDetails.documentDate}
                  onChange={(e) => setTransferDetails({ ...transferDetails, documentDate: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Sub-Registrar Office (SRO) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transferDetails.registrationOffice}
                  onChange={(e) => setTransferDetails({ ...transferDetails, registrationOffice: e.target.value })}
                  placeholder="e.g. SRO Tambaram"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Registration Number (if applicable)
                </label>
                <input
                  type="text"
                  value={transferDetails.registrationNumber}
                  onChange={(e) => setTransferDetails({ ...transferDetails, registrationNumber: e.target.value })}
                  placeholder="e.g. REG-TN-2026-00452"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-slate-700 block text-[11px] font-bold">
                  Transfer Reason / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={transferDetails.transferReason}
                  onChange={(e) => setTransferDetails({ ...transferDetails, transferReason: e.target.value })}
                  placeholder="e.g. Absolute conveyance by registered sale deed"
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2D: INHERITANCE-SPECIFIC FIELDS (SHOWN ONLY IF INHERITANCE) */}
          {mutationType === 'Inheritance' && (
            <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  D. Statutory Inheritance & Legal Heir Declarations
                </h3>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  Succession Mode
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Deceased Registered Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inheritanceDetails.deceasedOwnerName}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, deceasedOwnerName: e.target.value })}
                    placeholder="Full name of deceased owner"
                    className="w-full mt-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Date of Death <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={inheritanceDetails.dateOfDeath}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, dateOfDeath: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Relationship with Applicant <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inheritanceDetails.relationshipWithApplicant}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, relationshipWithApplicant: e.target.value })}
                    placeholder="e.g. Son / Daughter / Legal Heir"
                    className="w-full mt-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Legal Heir Certificate No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={inheritanceDetails.legalHeirCertificateNo}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, legalHeirCertificateNo: e.target.value })}
                    placeholder="e.g. LHC-REV-2025-78129"
                    className="w-full mt-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Total Number of Legal Heirs
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inheritanceDetails.legalHeirCount}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, legalHeirCount: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block text-[11px] font-bold">
                    Legal Heir Summary / Remarks
                  </label>
                  <input
                    type="text"
                    value={inheritanceDetails.legalHeirSummary}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, legalHeirSummary: e.target.value })}
                    placeholder="e.g. Applicant and spouse, affidavits obtained"
                    className="w-full mt-1 px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: MUTATION DOCUMENTS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Supporting Documents for {mutationType} Mutation
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload PDF, JPG, or PNG files up to 10MB each. Starts completely empty.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition shadow-sm self-start sm:self-auto">
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

            {/* Checklist of required/suggested docs */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-2">Required Document Checklist for {mutationType}:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getSuggestedDocuments(mutationType).map((item, idx) => (
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
                <p className="text-xs font-bold text-slate-600">No documents uploaded yet</p>
                <p className="text-[11px] text-slate-400">
                  Please upload the required transfer deed, legal heir/death certificates, or Patta copy.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-blue-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
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
                      title="Remove document"
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
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-700/20 transition flex items-center justify-center gap-2 active:scale-95"
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

export default PropertyMutationWorkflow;
