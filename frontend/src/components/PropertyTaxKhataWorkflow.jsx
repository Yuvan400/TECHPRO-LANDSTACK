import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileText, ShieldCheck, CheckCircle2, AlertCircle, Upload,
  Trash2, ArrowLeft, ArrowRight, Check, Clock, UserCheck, Building2,
  Receipt, Landmark, Users, MapPin, Hash, Calendar, HelpCircle
} from 'lucide-react';
import api from '../services/api';

export const PropertyTaxKhataWorkflow = ({
  parcel,
  deptData,
  user,
  onBack,
  onSuccess
}) => {
  const navigate = useNavigate();

  // Workflow steps: 'form' | 'review' | 'success'
  const [step, setStep] = useState('form');

  // Automatic Land & Property Details (Pre-populated from searched parcel context)
  const landDetails = {
    ulpin: parcel?.ulpin || '',
    surveyNumber: parcel?.surveyNumber || '',
    subDivision: parcel?.subDivision || '4A',
    district: parcel?.district || 'Chennai',
    taluk: parcel?.taluk || 'Tambaram',
    village: parcel?.village || 'Selaiyur',
    ward: deptData?.localBodies?.parameters?.find(p => p.label?.toLowerCase().includes('ward'))?.value || 'Ward 42',
    propertyAddress: `${parcel?.surveyNumber ? `Survey No. ${parcel.surveyNumber}, ` : ''}${parcel?.village || 'Selaiyur'}, ${parcel?.taluk || 'Tambaram'}, ${parcel?.district || 'Chennai'} - 600073`,
    existingAssessmentNo: deptData?.localBodies?.parameters?.find(p => p.label?.toLowerCase().includes('assessment'))?.value || 'ASS-2024-88412',
    existingKhataNo: deptData?.localBodies?.parameters?.find(p => p.label?.toLowerCase().includes('property id'))?.value?.replace('PROP-', 'KHT-') || 'KHT-TN-04291',
    existingPattaNumber: parcel?.pattaNumber || 'PATTA-2024-9912',
    landArea: parcel?.areaAcre ? `${parcel.areaAcre} Acres` : '2.45 Acres',
    currentOwnerName: parcel?.ownerName || 'Karthik Subramanian',
    propertyTaxStatus: parcel?.propertyTaxStatus || 'Paid'
  };

  // Section 1: Owner Details
  const [ownerDetails, setOwnerDetails] = useState({
    existingOwnerName: landDetails.currentOwnerName,
    newOwnerName: user?.fullName || 'Venkatesh Raman',
    guardianName: 'Ramanathan Iyer',
    mobileNumber: user?.mobile || '9840123456',
    email: user?.email || 'venkatesh.raman@gmail.com',
    residentialAddress: 'Flat 4B, Shanti Enclave, 1st Cross Street, Selaiyur, Chennai - 600073'
  });

  // Section 2: Property Parameters
  const [propertyParams, setPropertyParams] = useState({
    propertyType: parcel?.landType === 'Commercial' ? 'Commercial' : 'Residential',
    propertyAddress: landDetails.propertyAddress,
    doorNumber: 'Plot 12, Door No. 4/18',
    landArea: landDetails.landArea,
    builtupArea: '2,850 sq.ft.',
    numberOfFloors: 'G + 1 Floor',
    buildingUsage: 'Residential Dwelling Unit',
    yearOfConstruction: '2021',
    existingAssessmentNo: landDetails.existingAssessmentNo,
    existingKhataNo: landDetails.existingKhataNo
  });

  // Section 3: Khata / Ownership Transfer Details
  const [transferType, setTransferType] = useState('Sale'); // Sale, Gift, Inheritance, Partition, Settlement, Other
  const [transferDetails, setTransferDetails] = useState({
    documentNumber: 'DOC/SRO-TB/2026/8841',
    registrationDate: '2026-02-15',
    registrationOffice: 'Sub-Registrar Office, Tambaram',
    reasonForTransfer: 'Conveyance of absolute title and requesting municipal record name endorsement.'
  });

  // Section 3B: Inheritance-specific fields (only shown if transferType === 'Inheritance')
  const [inheritanceDetails, setInheritanceDetails] = useState({
    deceasedOwnerName: 'Late S. Ramanathan',
    dateOfDeath: '2025-08-10',
    relationshipWithApplicant: 'Son / Legal Heir',
    legalHeirInfo: 'Applicant (Son) and Radha Ramanathan (Spouse). Legal Heir Certificate verified.'
  });

  // Section 4: Supporting Documents (Starts empty - citizen uploads)
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [documentError, setDocumentError] = useState('');

  // Submission & Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [generatedApplication, setGeneratedApplication] = useState(null);

  // Dynamic suggested document list based on Transfer Type
  const getSuggestedDocuments = (type) => {
    const baseDocs = [
      { type: 'Previous Property Tax Receipt', desc: 'Latest municipal property tax payment receipt / paid challan', required: true },
      { type: 'Patta / Ownership Record', desc: 'Current Revenue Patta extract / Jamabandi certificate', required: true },
      { type: 'Latest Electricity Bill', desc: 'Recent electricity / water utility bill confirming possession', required: true },
      { type: 'Identity Proof', desc: 'Aadhaar Card / Voter ID / Passport of Transferee', required: true },
      { type: 'Address Proof', desc: 'Government issued residential address verification', required: true }
    ];

    if (type === 'Inheritance') {
      return [
        { type: 'Legal Heir Certificate', desc: 'Statutory certificate issued by Tahsildar / Revenue Court', required: true },
        { type: 'Death Certificate of Deceased Owner', desc: 'Official death certificate issued by Municipal Registrar', required: true },
        ...baseDocs,
        { type: 'No-Objection Affidavit from Co-Heirs', desc: 'Notarized consent or relinquishment affidavit', required: false }
      ];
    }

    if (type === 'Gift' || type === 'Settlement') {
      return [
        { type: 'Registered Gift / Settlement Deed', desc: 'Duly registered deed from Sub-Registrar Office', required: true },
        ...baseDocs,
        { type: 'Identity Proof of Donor & Donee', desc: 'Government photo IDs of both parties', required: true }
      ];
    }

    if (type === 'Partition') {
      return [
        { type: 'Registered Partition Deed', desc: 'Family partition deed or decree with demarcated share sketch', required: true },
        ...baseDocs
      ];
    }

    // Default 'Sale'
    return [
      { type: 'Registered Sale Deed', desc: 'Duly registered conveyance deed from Sub-Registrar Office', required: true },
      ...baseDocs,
      { type: 'Building Completion Certificate', desc: 'Completion certificate issued by Local Body / Planning Authority', required: false },
      { type: 'Property Tax Assessment Record', desc: 'Previous assessment register copy if available', required: false }
    ];
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
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        file: file
      });
    }

    setUploadedDocuments(prev => [...prev, ...validFiles]);
  };

  const handleRemoveDoc = (id) => {
    setUploadedDocuments(prev => prev.filter(d => d.id !== id));
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};

    if (!ownerDetails.newOwnerName?.trim()) {
      errs.newOwnerName = 'Please enter the new owner name.';
    }
    if (!ownerDetails.guardianName?.trim()) {
      errs.guardianName = 'Please enter Father / Husband / Guardian name.';
    }
    if (!ownerDetails.mobileNumber || !/^[6-9]\d{9}$/.test(ownerDetails.mobileNumber.replace(/\D/g, ''))) {
      errs.mobileNumber = 'Please enter a valid 10-digit mobile number.';
    }
    if (!propertyParams.propertyType) {
      errs.propertyType = 'Please select the property type.';
    }
    if (!propertyParams.builtupArea?.trim()) {
      errs.builtupArea = 'Please enter the built-up area.';
    }
    if (!transferType) {
      errs.transferType = 'Please select the transfer type.';
    }
    if (!transferDetails.documentNumber?.trim()) {
      errs.documentNumber = 'Please enter the document / registered deed number.';
    }
    if (!transferDetails.registrationOffice?.trim()) {
      errs.registrationOffice = 'Please enter the Sub-Registrar registration office.';
    }
    if (!transferDetails.reasonForTransfer?.trim()) {
      errs.reasonForTransfer = 'Please enter the reason for Khata transfer.';
    }

    // Conditional Inheritance Validation
    if (transferType === 'Inheritance') {
      if (!inheritanceDetails.deceasedOwnerName?.trim()) {
        errs.deceasedOwnerName = 'Please enter the deceased owner name.';
      }
      if (!inheritanceDetails.dateOfDeath) {
        errs.dateOfDeath = 'Please enter the date of death.';
      }
      if (!inheritanceDetails.relationshipWithApplicant?.trim()) {
        errs.relationshipWithApplicant = 'Please specify relationship with applicant.';
      }
      if (!inheritanceDetails.legalHeirInfo?.trim()) {
        errs.legalHeirInfo = 'Please enter legal heir information.';
      }
    }

    // Documents check
    if (uploadedDocuments.length === 0) {
      errs.documents = 'Please upload at least one required supporting document (e.g. Registered Deed, Tax Receipt).';
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
      // Lookup service ID for SRV-TAX-07 (Property Tax Assessment & Municipal Khata Transfer)
      let serviceId = 7;
      try {
        const servicesRes = await api.get('/api/services');
        const taxService = servicesRes.data?.find(
          s => s.serviceCode === 'SRV-TAX-07' || s.serviceName?.toLowerCase().includes('khata') || s.serviceName?.toLowerCase().includes('tax')
        );
        if (taxService) serviceId = taxService.id;
      } catch (err) {
        console.warn('Could not lookup service id, defaulting to 7', err);
      }

      // Generate dynamic application ID format: KHT-2026-XXXXXXXX
      const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
      const dynamicAppId = `KHT-2026-${randomDigits}`;

      const remarksSummary = `[Property Tax Assessment & Municipal Khata Transfer] Transfer Type: ${transferType} | New Owner: ${ownerDetails.newOwnerName} | Guardian: ${ownerDetails.guardianName} | Mobile: ${ownerDetails.mobileNumber} | Property Type: ${propertyParams.propertyType} | Built-up: ${propertyParams.builtupArea} | Floors: ${propertyParams.numberOfFloors} | Assessment No: ${propertyParams.existingAssessmentNo} | Khata No: ${propertyParams.existingKhataNo} | Doc No: ${transferDetails.documentNumber} | Reg Date: ${transferDetails.registrationDate} | SRO: ${transferDetails.registrationOffice}${transferType === 'Inheritance' ? ` | Deceased: ${inheritanceDetails.deceasedOwnerName} (DOD: ${inheritanceDetails.dateOfDeath}) | Relation: ${inheritanceDetails.relationshipWithApplicant} | Legal Heirs: ${inheritanceDetails.legalHeirInfo}` : ''} | Reason: ${transferDetails.reasonForTransfer}`;

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
        transferType: transferType,
        newOwnerName: ownerDetails.newOwnerName,
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
      setSubmitError(err.response?.data?.message || 'Failed to submit Property Tax / Khata application. Please try again.');
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
        <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-black uppercase tracking-wider">
            Municipal Administration & Local Body
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Property Tax & Khata Application Submitted
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Your application for municipal property tax assessment and Khata title transfer has been officially lodged.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-3 border-b border-slate-200 gap-2">
            <span className="text-slate-500 font-sans font-bold">Application ID:</span>
            <span className="font-black text-purple-700 text-base">{generatedApplication.applicationNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-500 font-sans font-bold block">Service:</span>
              <span className="font-bold text-slate-900">Property Tax Assessment & Municipal Khata Transfer</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Transfer Type:</span>
              <span className="font-bold text-purple-800">{transferType}</span>
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
              <span className="text-slate-500 font-sans font-bold block">New Transferee Name:</span>
              <span className="font-bold text-slate-900">{ownerDetails.newOwnerName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Submission Date:</span>
              <span className="font-bold text-slate-900">{generatedApplication.submissionDate}</span>
            </div>
            <div>
              <span className="text-slate-500 font-sans font-bold block">Statutory SLA:</span>
              <span className="font-bold text-purple-700">7 Days</span>
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
            className="w-full sm:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
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
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Step 2 of 2: Final Verification
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              Review Property Tax Assessment & Khata Transfer Application
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Confirm all municipal parameters, transferee identity, and attached deeds before final submission to the municipal corporation.
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
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Target Land Parcel & Municipal Record (Automatic Context)
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
                <span className="text-slate-500 block">Ward / Village:</span>
                <span className="font-bold text-slate-900">{landDetails.ward}, {landDetails.village}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Taluk & District:</span>
                <span className="font-bold text-slate-900">{landDetails.taluk}, {landDetails.district}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assessment No:</span>
                <span className="font-mono font-bold text-purple-700">{landDetails.existingAssessmentNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Existing Khata:</span>
                <span className="font-mono font-bold text-purple-700">{landDetails.existingKhataNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Land Area:</span>
                <span className="font-bold text-slate-900">{landDetails.landArea}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Existing Registered Owner:</span>
                <span className="font-bold text-slate-900">{landDetails.currentOwnerName}</span>
              </div>
            </div>
          </div>

          {/* Review 2: Owner Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              Owner & Transferee Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Existing Owner:</span>
                <span className="font-bold text-slate-700">{ownerDetails.existingOwnerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">New Owner / Transferee:</span>
                <span className="font-bold text-purple-900">{ownerDetails.newOwnerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Father / Guardian:</span>
                <span className="font-bold text-slate-900">{ownerDetails.guardianName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile Number:</span>
                <span className="font-bold text-slate-900">{ownerDetails.mobileNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address:</span>
                <span className="font-bold text-slate-900">{ownerDetails.email}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Residential Address:</span>
                <span className="font-bold text-slate-900">{ownerDetails.residentialAddress}</span>
              </div>
            </div>
          </div>

          {/* Review 3: Property Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Property Parameters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Property Type:</span>
                <span className="font-bold text-slate-900">{propertyParams.propertyType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Door Number:</span>
                <span className="font-bold text-slate-900">{propertyParams.doorNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Built-up Area:</span>
                <span className="font-bold text-slate-900">{propertyParams.builtupArea}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Floors:</span>
                <span className="font-bold text-slate-900">{propertyParams.numberOfFloors}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Building Usage:</span>
                <span className="font-bold text-slate-900">{propertyParams.buildingUsage}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Year of Construction:</span>
                <span className="font-bold text-slate-900">{propertyParams.yearOfConstruction}</span>
              </div>
            </div>
          </div>

          {/* Review 4: Transfer Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-600" />
              Khata & Title Transfer Parameters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Transfer Type:</span>
                <span className="font-bold text-purple-700">{transferType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registered Deed / Doc No:</span>
                <span className="font-mono font-bold text-slate-900">{transferDetails.documentNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registration Date:</span>
                <span className="font-bold text-slate-900">{transferDetails.registrationDate}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Registration Office:</span>
                <span className="font-bold text-slate-900">{transferDetails.registrationOffice}</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 block">Reason for Khata Transfer:</span>
                <span className="font-bold text-slate-900">{transferDetails.reasonForTransfer}</span>
              </div>

              {transferType === 'Inheritance' && (
                <>
                  <div>
                    <span className="text-slate-500 block">Deceased Owner:</span>
                    <span className="font-bold text-red-700">{inheritanceDetails.deceasedOwnerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date of Death:</span>
                    <span className="font-bold text-slate-900">{inheritanceDetails.dateOfDeath}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Relationship:</span>
                    <span className="font-bold text-slate-900">{inheritanceDetails.relationshipWithApplicant}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-500 block">Legal Heir Information:</span>
                    <span className="font-bold text-slate-900">{inheritanceDetails.legalHeirInfo}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Review 5: Supporting Documents */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Uploaded Supporting Documents ({uploadedDocuments.length})
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
              By submitting, you certify that all property tax clearances and registered ownership instruments are authentic.
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitApplication}
              className="w-full sm:w-auto px-8 py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-700/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Lodging Municipal Application...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Property Tax / Khata Application
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER STEP 1: DEDICATED APPLICATION FORM
  // ==========================================
  const suggestedDocs = getSuggestedDocuments(transferType);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* SERVICE HEADER */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
            <Landmark className="w-3.5 h-3.5 text-purple-400" />
            Local Body / Municipal Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Property Tax Assessment & Municipal Khata Transfer
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Assessment of property for municipal taxation and transfer of the municipal property record (Khata / Name Endorsement) to the new owner.
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

      {/* STEP 1 FORM */}
      <form onSubmit={handleProceedToReview} className="space-y-6">

        {/* SECTION 1: AUTOMATIC LAND DETAILS (REUSED CONTEXT - READ ONLY) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Land Area</label>
              <input
                type="text"
                value={landDetails.landArea}
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
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Existing Assessment No.</label>
              <input
                type="text"
                value={landDetails.existingAssessmentNo}
                readOnly
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-800 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: OWNER DETAILS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Owner & Transferee Details
              </h3>
              <p className="text-[11px] text-slate-500">
                Specify existing record owner and the new owner requesting the municipal Khata transfer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Existing Owner Name
              </label>
              <input
                type="text"
                value={ownerDetails.existingOwnerName}
                readOnly
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                New Owner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ownerDetails.newOwnerName}
                onChange={(e) => setOwnerDetails({ ...ownerDetails, newOwnerName: e.target.value })}
                placeholder="Enter Full Name of New Owner"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition ${
                  validationErrors.newOwnerName ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.newOwnerName && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.newOwnerName}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Father / Husband / Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={ownerDetails.guardianName}
                onChange={(e) => setOwnerDetails({ ...ownerDetails, guardianName: e.target.value })}
                placeholder="Enter Guardian / Father's Name"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition ${
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
                value={ownerDetails.mobileNumber}
                onChange={(e) => setOwnerDetails({ ...ownerDetails, mobileNumber: e.target.value })}
                placeholder="10-digit Mobile"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition ${
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
                value={ownerDetails.email}
                onChange={(e) => setOwnerDetails({ ...ownerDetails, email: e.target.value })}
                placeholder="citizen@example.com"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Residential Address
              </label>
              <input
                type="text"
                value={ownerDetails.residentialAddress}
                onChange={(e) => setOwnerDetails({ ...ownerDetails, residentialAddress: e.target.value })}
                placeholder="Full residential communication address with PIN code"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: PROPERTY PARAMETERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Property & Building Parameters
              </h3>
              <p className="text-[11px] text-slate-500">
                Municipal taxation rating attributes and physical built-up dimensions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                value={propertyParams.propertyType}
                onChange={(e) => setPropertyParams({ ...propertyParams, propertyType: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
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
                Door Number
              </label>
              <input
                type="text"
                value={propertyParams.doorNumber}
                onChange={(e) => setPropertyParams({ ...propertyParams, doorNumber: e.target.value })}
                placeholder="Plot / Door Number"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Built-up Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={propertyParams.builtupArea}
                onChange={(e) => setPropertyParams({ ...propertyParams, builtupArea: e.target.value })}
                placeholder="e.g. 2,850 sq.ft."
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition ${
                  validationErrors.builtupArea ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.builtupArea && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.builtupArea}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Number of Floors
              </label>
              <input
                type="text"
                value={propertyParams.numberOfFloors}
                onChange={(e) => setPropertyParams({ ...propertyParams, numberOfFloors: e.target.value })}
                placeholder="e.g. Ground Floor, G+1, G+2"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Building Usage
              </label>
              <input
                type="text"
                value={propertyParams.buildingUsage}
                onChange={(e) => setPropertyParams({ ...propertyParams, buildingUsage: e.target.value })}
                placeholder="e.g. Residential Dwelling / Commercial Retail"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Year of Construction
              </label>
              <input
                type="text"
                value={propertyParams.yearOfConstruction}
                onChange={(e) => setPropertyParams({ ...propertyParams, yearOfConstruction: e.target.value })}
                placeholder="e.g. 2021"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: KHATA / OWNERSHIP TRANSFER DETAILS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Khata / Ownership Transfer Details
              </h3>
              <p className="text-[11px] text-slate-500">
                Statutory instrument under which property title is conveyed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Transfer Type <span className="text-red-500">*</span>
              </label>
              <select
                value={transferType}
                onChange={(e) => setTransferType(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition shadow-sm"
              >
                <option value="Sale">Sale (Conveyance Deed)</option>
                <option value="Gift">Gift (Settlement/Gift Deed)</option>
                <option value="Inheritance">Inheritance (Succession / Legal Heir)</option>
                <option value="Partition">Partition (Family Settlement)</option>
                <option value="Settlement">Settlement</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Document / Deed Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transferDetails.documentNumber}
                onChange={(e) => setTransferDetails({ ...transferDetails, documentNumber: e.target.value })}
                placeholder="e.g. DOC/SRO-TB/2026/8841"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition ${
                  validationErrors.documentNumber ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {validationErrors.documentNumber && (
                <p className="text-[11px] text-red-600 font-semibold">{validationErrors.documentNumber}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Registration Date
              </label>
              <input
                type="date"
                value={transferDetails.registrationDate}
                onChange={(e) => setTransferDetails({ ...transferDetails, registrationDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Registration Office (SRO) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transferDetails.registrationOffice}
                onChange={(e) => setTransferDetails({ ...transferDetails, registrationOffice: e.target.value })}
                placeholder="Sub-Registrar Office where deed was executed"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Reason for Khata Transfer <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={transferDetails.reasonForTransfer}
                onChange={(e) => setTransferDetails({ ...transferDetails, reasonForTransfer: e.target.value })}
                placeholder="Provide reasons and details regarding the title conveyance and request for municipal record endorsement"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* INHERITANCE DYNAMIC FIELDS: ONLY SHOWN IF transferType === 'Inheritance' */}
          {transferType === 'Inheritance' && (
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-900">
                  Inheritance & Legal Heir Declaration
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-purple-900">
                    Deceased Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inheritanceDetails.deceasedOwnerName}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, deceasedOwnerName: e.target.value })}
                    placeholder="Late registered owner name"
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                  {validationErrors.deceasedOwnerName && (
                    <p className="text-[10px] text-red-600 font-semibold">{validationErrors.deceasedOwnerName}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-purple-900">
                    Date of Death <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={inheritanceDetails.dateOfDeath}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, dateOfDeath: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                  {validationErrors.dateOfDeath && (
                    <p className="text-[10px] text-red-600 font-semibold">{validationErrors.dateOfDeath}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-purple-900">
                    Relationship with Applicant <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inheritanceDetails.relationshipWithApplicant}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, relationshipWithApplicant: e.target.value })}
                    placeholder="e.g. Son / Daughter / Legal Heir"
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                  {validationErrors.relationshipWithApplicant && (
                    <p className="text-[10px] text-red-600 font-semibold">{validationErrors.relationshipWithApplicant}</p>
                  )}
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="text-[11px] font-bold text-purple-900">
                    Legal Heir Information & Consent Details <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inheritanceDetails.legalHeirInfo}
                    onChange={(e) => setInheritanceDetails({ ...inheritanceDetails, legalHeirInfo: e.target.value })}
                    placeholder="Summary of all surviving legal heirs, Legal Heir Certificate number, and no-objection affidavits"
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-medium text-slate-900"
                  />
                  {validationErrors.legalHeirInfo && (
                    <p className="text-[10px] text-red-600 font-semibold">{validationErrors.legalHeirInfo}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: PROPERTY TAX DOCUMENTS */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Service-Specific Document Upload
              </h3>
              <p className="text-[11px] text-slate-500">
                Upload authentic ownership deeds, tax challans, and identity proofs.
              </p>
            </div>
          </div>

          {/* Suggested Documents List for Khata */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 block">
              Required & Recommended Documents for {transferType} Khata Transfer:
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
            <label className="block p-6 border-2 border-dashed border-purple-200 hover:border-purple-500 rounded-2xl text-center cursor-pointer bg-purple-50/20 hover:bg-purple-50/40 transition">
              <Upload className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <span className="text-xs font-bold text-purple-900 block">
                Click to upload documents or drag and drop
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
                  Attached Files ({uploadedDocuments.length})
                </h4>
                {uploadedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-purple-600" />
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
            className="w-full sm:w-auto px-8 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-700/20 transition flex items-center justify-center gap-2 active:scale-95"
          >
            Review Application Details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};

export default PropertyTaxKhataWorkflow;
