/**
 * Generates the standardized 10-Department parameters for any cadastral parcel
 * adhering strictly to the National Land Stack and Tamil Nadu Cadastral standard.
 */
export const getDepartmentDataForParcel = (parcel) => {
  if (!parcel) return null;

  const idNum = parcel.id || 125;
  const hash = Math.abs(
    (parcel.ulpin || 'TN-PCL-00125').split('').reduce((acc, char) => acc + char.charCodeAt(0) * 17, 0)
  );

  const parcelId = `TN-PCL-${String(idNum).padStart(5, '0')}`;
  const isAgri = parcel.landType === 'Agricultural';
  const isComm = parcel.landType === 'Commercial';

  return {
    parcelId,
    ulpin: parcel.ulpin,
    surveyNumber: parcel.surveyNumber,
    subDivision: parcel.subDivision || '4A',
    ownerName: parcel.ownerName,
    ownerAadhaar: parcel.ownerAadhaarMasked || 'XXXX-XXXX-4819',
    district: parcel.district || 'Chennai',
    taluk: parcel.taluk || 'Tambaram',
    village: parcel.village || 'Selaiyur',
    areaAcre: parcel.areaAcre || 2.45,

    // 1. Revenue Department
    revenue: {
      id: 'revenue',
      title: 'Revenue Department',
      subtitle: 'Land Administration, Patta Registers & Jamabandi Records',
      badgeColor: 'blue',
      keyMetrics: 'Patta, Survey No., ULPIN, Ownership, Area, Classification, Mutation.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'ULPIN', value: parcel.ulpin, highlight: true },
        { label: 'Patta Number', value: `PT-${100000 + (hash % 899999)}`, badge: 'Active' },
        { label: 'Survey Number', value: parcel.surveyNumber },
        { label: 'Sub-Division Number', value: parcel.subDivision || '4A' },
        { label: 'Owner Name', value: parcel.ownerName },
        { label: 'Ownership Type', value: parcel.ownershipStatus || 'Individual' },
        { label: 'Land Area', value: `${parcel.areaAcre} Acres` },
        { label: 'Land Classification', value: parcel.landType || 'Residential' },
        { label: 'Land Type', value: isAgri ? 'Nanjai (Wet Land)' : 'Natham (Grama Natham Converted)' },
        { label: 'Patta Status', value: 'Active', badge: 'Active', badgeColor: 'green' },
        { label: 'Mutation Status', value: parcel.verificationStatus === 'Verified' ? 'Updated' : 'Pending Verification', badgeColor: parcel.verificationStatus === 'Verified' ? 'green' : 'amber' },
        { label: 'District', value: parcel.district },
        { label: 'Taluk', value: parcel.taluk },
        { label: 'Village', value: parcel.village }
      ]
    },

    // 2. Survey & Land Records Department
    survey: {
      id: 'survey',
      title: 'Survey & Land Records Department',
      subtitle: 'GIS Cadastral Geodesy, DGPS Resurveys & Field Measurement Book (FMB)',
      badgeColor: 'indigo',
      keyMetrics: 'Parcel Boundary + Cadastral Map + Survey Status + FMB + Adjacent Parcels.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'Survey Number', value: parcel.surveyNumber },
        { label: 'Sub-Division', value: parcel.subDivision || '4A' },
        { label: 'Parcel Area', value: `${parcel.areaAcre} Acres` },
        { label: 'Parcel Boundary', value: 'Polygon (Vector GeoJSON Verified)', badge: 'Polygon' },
        { label: 'Boundary Status', value: parcel.verificationStatus || 'Verified', badge: parcel.verificationStatus || 'Verified', badgeColor: 'green' },
        { label: 'Survey Status', value: 'Completed' },
        { label: 'Cadastral Map', value: 'Available', badge: 'Available' },
        { label: 'FMB Sketch', value: 'Available', badge: 'Available' },
        { label: 'Latitude', value: `${parcel.latitude ? parcel.latitude.toFixed(4) : '13.0421'}` },
        { label: 'Longitude', value: `${parcel.longitude ? parcel.longitude.toFixed(4) : '80.1942'}` },
        { label: 'Adjacent Parcels', value: `PCL-${String(Math.max(1, idNum - 1)).padStart(5, '0')}, PCL-${String(idNum + 1).padStart(5, '0')}` },
        { label: 'Boundary Coordinates', value: 'GIS coordinates (WGS84 Datum)' }
      ]
    },

    // 3. Registration Department
    registration: {
      id: 'registration',
      title: 'Registration Department',
      subtitle: 'Sub-Registrar Deeds, Title Conveyance & Encumbrance Certificates (EC)',
      badgeColor: 'emerald',
      keyMetrics: 'Document No. + Type + Date + Registration Office + Transaction + Encumbrance.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'Document Number', value: `DOC-2026-${10000 + (hash % 89999)}` },
        { label: 'Document Type', value: 'Sale Deed (Absolute Title)' },
        { label: 'Registration Date', value: '20-09-2026' },
        { label: 'Registration Office', value: `${parcel.taluk || parcel.district} SRO` },
        { label: 'Transaction Type', value: 'Sale' },
        { label: 'Transferor', value: 'Authorized record' },
        { label: 'Transferee', value: parcel.ownerName },
        { label: 'Transaction Value', value: `₹${((parcel.marketValuationInr || 18500000)).toLocaleString('en-IN')}` },
        { label: 'Encumbrance Status', value: parcel.encumbranceStatus || 'Clear', badge: parcel.encumbranceStatus || 'Clear', badgeColor: parcel.encumbranceStatus?.includes('Mortgage') ? 'amber' : 'green' },
        { label: 'Mortgage Status', value: parcel.encumbranceStatus?.includes('Mortgage') ? 'Active' : 'None' },
        { label: 'EC Status', value: 'Available', badge: 'Available' },
        { label: 'Document Status', value: 'Registered' }
      ]
    },

    // 4. Local Bodies
    localBodies: {
      id: 'localBodies',
      title: 'Local Bodies',
      subtitle: 'Corporation, Municipality & Town Panchayat Property Administration',
      badgeColor: 'purple',
      keyMetrics: 'Property ID + Assessment No. + Ward + Property Type + Tax Status.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'Property ID', value: `PROP-${40000 + (hash % 50000)}` },
        { label: 'Assessment Number', value: `ASS-${10000 + (hash % 89999)}` },
        { label: 'Ward Number', value: `Ward ${(hash % 200) + 1}` },
        { label: 'Local Body', value: `${parcel.district} City Corporation / Municipality` },
        { label: 'Property Type', value: parcel.landType || 'Residential' },
        { label: 'Property Usage', value: parcel.landUse || 'Residential' },
        { label: 'Building Status', value: isAgri ? 'Vacant' : 'Built (G+2)' },
        { label: 'Property Tax Status', value: parcel.propertyTaxStatus || 'Paid', badge: parcel.propertyTaxStatus || 'Paid', badgeColor: parcel.propertyTaxStatus === 'Paid' ? 'green' : 'red' },
        { label: 'Tax Amount', value: `₹${Math.round(parcel.areaAcre * 3400).toLocaleString('en-IN')}` },
        { label: 'Tax Arrears', value: parcel.propertyTaxStatus === 'Arrears' ? '₹14,200' : '₹0' },
        { label: 'Assessment Status', value: 'Active' }
      ]
    },

    // 5. Public Works Department — PWD
    pwd: {
      id: 'pwd',
      title: 'Public Works Department — PWD',
      subtitle: 'Roads, Canals, Government Infrastructure & Affected Land',
      badgeColor: 'amber',
      keyMetrics: 'Infrastructure + ROW + Width + Distance + Affected Area + Acquisition.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'Infrastructure ID', value: `PWD-${2000 + (hash % 7000)}` },
        { label: 'Infrastructure Type', value: isAgri ? 'Canal & Feeder Line' : 'Corridor Road' },
        { label: 'Road/Canal Name', value: `${parcel.village} - ${parcel.taluk} Link Road` },
        { label: 'Road Width', value: '18 m' },
        { label: 'Right of Way', value: '24 m' },
        { label: 'Distance from Parcel', value: '25 m' },
        { label: 'Affected Area', value: '0.00 Acre' },
        { label: 'Proposed Project', value: 'Road Expansion Setback' },
        { label: 'Acquisition Status', value: 'Not Required' },
        { label: 'Development Restriction', value: 'None' },
        { label: 'Infrastructure Status', value: 'Existing' }
      ]
    },

    // 6. Municipal Administration
    municipal: {
      id: 'municipal',
      title: 'Municipal Administration',
      subtitle: 'Urban Civic Infrastructure, Building Permissions & Utility Services',
      badgeColor: 'teal',
      keyMetrics: 'Municipality + Zone + Ward + Property + Building Permission + Tax + Utilities.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'Municipality/Corporation', value: `${parcel.district} City Corporation` },
        { label: 'Zone', value: `Zone ${(hash % 15) + 1}` },
        { label: 'Ward', value: `Ward ${(hash % 200) + 1}` },
        { label: 'Property ID', value: `PROP-${40000 + (hash % 50000)}` },
        { label: 'Building Usage', value: parcel.landUse || 'Residential' },
        { label: 'Building Permission', value: isAgri ? 'Not Applicable' : 'Approved' },
        { label: 'Property Tax', value: parcel.propertyTaxStatus || 'Paid', badge: parcel.propertyTaxStatus || 'Paid', badgeColor: parcel.propertyTaxStatus === 'Paid' ? 'green' : 'red' },
        { label: 'Water Connection', value: 'Active' },
        { label: 'Sewerage Connection', value: 'Active' },
        { label: 'Solid Waste Service', value: 'Available' },
        { label: 'Municipal Restriction', value: 'None' }
      ]
    },

    // 7. Agriculture & Forest Department (Separated into Agriculture and Forest)
    agriForest: {
      id: 'agriForest',
      title: 'Agriculture & Forest Department',
      subtitle: 'Agricultural Holding Classification, Soil Fertility, Reserve Forest & ESZ Buffers',
      badgeColor: 'lime',
      keyMetrics: 'Key Agriculture: Land Type + Crop + Soil + Irrigation | Key Forest: Forest Boundary + Protected Status + ESZ + Buffer + Restrictions.',
      agriculture: {
        title: 'Agriculture Section',
        parameters: [
          { label: 'Parcel ID', value: parcelId },
          { label: 'Agricultural Land Status', value: isAgri ? 'Agricultural' : 'Non-Agricultural' },
          { label: 'Land Type', value: isAgri ? 'Wet (Nanjai)' : 'Dry (Punjai)' },
          { label: 'Crop Type', value: isAgri ? 'Paddy' : 'None' },
          { label: 'Soil Type', value: 'Clay Loam' },
          { label: 'Irrigation Type', value: isAgri ? 'Canal / Borewell' : 'Not Applicable' },
          { label: 'Irrigated Status', value: isAgri ? 'Irrigated' : 'Dry' },
          { label: 'Cultivation Status', value: isAgri ? 'Cultivated' : 'Settled' },
          { label: 'Agricultural Classification', value: isAgri ? 'Agriculture' : 'Converted' },
          { label: 'Water Source', value: 'Groundwater / Canal' }
        ]
      },
      forest: {
        title: 'Forest Section',
        parameters: [
          { label: 'Parcel ID', value: parcelId },
          { label: 'Forest Zone ID', value: `FR-${1000 + (hash % 5000)}` },
          { label: 'Forest Type', value: 'Reserved' },
          { label: 'Forest Boundary', value: 'GIS Polygon Mapped' },
          { label: 'Protected Status', value: 'Protected Buffer Margin' },
          { label: 'Distance from Forest', value: `${(1.2 + (hash % 5) * 0.4).toFixed(1)} km` },
          { label: 'Buffer Zone', value: 'Applicable' },
          { label: 'Eco-Sensitive Zone', value: 'No' },
          { label: 'Development Restriction', value: 'None' },
          { label: 'Clearance Required', value: 'No' },
          { label: 'Clearance Status', value: 'Approved' }
        ]
      }
    },

    // 7A. Standalone Agriculture Department
    agriculture: {
      id: 'agriculture',
      number: '4',
      title: 'Agriculture Department',
      subtitle: 'Agricultural Holding Classification, Soil Fertility & Irrigation Sources',
      badgeColor: 'lime',
      keyMetrics: 'Crop Information + Soil Taxonomy + Irrigation Sources + Agricultural Land Status.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'ULPIN', value: parcel.ulpin },
        { label: 'Survey Number', value: parcel.surveyNumber },
        { label: 'Agricultural Land Status', value: isAgri ? 'Agricultural Land' : 'Non-Agricultural Land', badge: isAgri ? 'Agricultural' : 'Non-Agri', badgeColor: isAgri ? 'green' : 'amber' },
        { label: 'Land Type', value: isAgri ? 'Wet Land (Nanjai)' : 'Dry Land (Punjai)' },
        { label: 'Crop Information', value: isAgri ? 'Paddy (Samba Season) & Pulses' : 'None (Urban Layout)' },
        { label: 'Soil Information', value: 'Clay Loam with High Organic Retention' },
        { label: 'Irrigation Information', value: isAgri ? 'Canal & Deep Borewell Connected' : 'Not Applicable' },
        { label: 'Irrigated Status', value: isAgri ? 'Irrigated' : 'Dry' },
        { label: 'Cultivation Status', value: isAgri ? 'Under Active Cultivation' : 'Settled / Built' },
        { label: 'Agricultural Classification', value: isAgri ? 'Wet Crop Agriculture' : 'Converted' },
        { label: 'Water Source', value: 'Groundwater Aquifer & Irrigation Canal' }
      ]
    },

    // 8. Electricity Department
    electricity: {
      id: 'electricity',
      title: 'Electricity Department',
      subtitle: 'Power Grid Infrastructure, Substation Clearance & Transmission Corridors',
      badgeColor: 'yellow',
      keyMetrics: 'Connection + Status + Transformer + Pole + Power Line + Voltage.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'Connection ID', value: `EB-${40000 + (hash % 50000)}` },
        { label: 'Consumer ID', value: `CON-TN-${100000 + (hash % 899999)}` },
        { label: 'Connection Status', value: 'Active', badge: 'Active', badgeColor: 'green' },
        { label: 'Connection Type', value: isComm ? 'Commercial' : 'Domestic' },
        { label: 'Transformer ID', value: `TR-${1000 + (hash % 9000)}` },
        { label: 'Pole ID', value: `PL-${4000 + (hash % 5000)}` },
        { label: 'Power Line', value: '11 kV' },
        { label: 'Voltage Level', value: '11 kV / 415 V' },
        { label: 'Distance from Transformer', value: '85 m' },
        { label: 'Utility Corridor', value: 'GIS Layer' }
      ]
    },

    // 8. Environment & Forest Department
    environment: {
      id: 'environment',
      title: 'Environment & Forest Department',
      subtitle: 'Coastal Regulation Zone (CRZ), Wetland, Forest Buffers & Environmental Clearances',
      badgeColor: 'cyan',
      keyMetrics: 'CRZ + Wetland + Flood Zone + ESZ + Forest Buffer + Clearance Status.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'Environmental Zone', value: 'Normal / Permitted' },
        { label: 'CRZ Status', value: 'Not Applicable' },
        { label: 'Wetland Status', value: 'No' },
        { label: 'Waterbody Status', value: 'No' },
        { label: 'Flood Zone', value: 'Zone I (Safe)' },
        { label: 'Eco-Sensitive Zone (ESZ)', value: 'No' },
        { label: 'Forest Buffer Margin', value: `${(1.2 + (hash % 5) * 0.4).toFixed(1)} km`, badge: 'Clear', badgeColor: 'green' },
        { label: 'Forest Clearance Required', value: 'No' },
        { label: 'Environmental Clearance', value: 'Approved', badge: 'Approved', badgeColor: 'green' },
        { label: 'Development Restriction', value: 'None' },
        { label: 'Pollution Control Status', value: 'Compliant', badge: 'Compliant', badgeColor: 'green' }
      ]
    },

    // 10. Local Planning / Town & Country Planning
    planning: {
      id: 'planning',
      title: 'Local Planning / Town & Country Planning',
      subtitle: 'Master Plan Zoning, FSI/FAR, Maximum Building Heights & Setbacks',
      badgeColor: 'rose',
      keyMetrics: 'Key: Land Use + Zoning + Master Plan Zone + FSI + Setbacks + Restrictions.',
      parameters: [
        { label: 'Parcel ID', value: parcelId },
        { label: 'Land Use', value: parcel.landUse || 'Residential' },
        { label: 'Zoning', value: 'Residential Zone' },
        { label: 'Master Plan Zone', value: 'R2' },
        { label: 'Development Zone', value: 'Urban' },
        { label: 'Permitted Use', value: 'Residential' },
        { label: 'FSI / FAR', value: '2.00' },
        { label: 'Maximum Building Height', value: '18.30 m' },
        { label: 'Front Setback', value: '4.5 m' },
        { label: 'Side Setback', value: '3.0 m' },
        { label: 'Road Width', value: '18 m' },
        { label: 'Development Restriction', value: 'None' },
        { label: 'Planning Permission', value: 'Approved' },
        { label: 'Proposed Land Use', value: 'Future urban expansion corridor' }
      ]
    }
  };
};
