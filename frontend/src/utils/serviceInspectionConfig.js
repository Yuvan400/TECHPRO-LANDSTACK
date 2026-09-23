// serviceInspectionConfig.js
// Configuration for service-specific field inspection parameters, checklists, and statutory norms

export const SERVICE_INSPECTION_CONFIG = {
  // 1. Land Ownership Certificate (Patta)
  'SRV-LOC-01': {
    inspectionType: 'Physical Possession & Cadastral Boundary Verification',
    description: 'On-site verification of undisputed possession, boundary markers, and non-agricultural or agricultural utilization.',
    statutoryRule: 'Revenue Standing Order (RSO) 31: Physical possession audit and FMB alignment check.',
    fields: [
      { id: 'possessionHolder', label: 'Actual Possession Holder', type: 'text', placeholder: 'Name of person occupying the parcel', required: true },
      { id: 'fmbStoneStatus', label: 'Cadastral Boundary Stones (FMB)', type: 'select', options: ['All 4 Corner Stones Intact', '1 Stone Displaced / Missing', 'Multiple Stones Missing', 'No Stones Found'], required: true },
      { id: 'currentCultivationOrStructure', label: 'Current Ground Use', type: 'select', options: ['Vacant Land', 'Single-Storey Residential House', 'Multi-Storey Residential', 'Commercial Shop / Office', 'Agricultural Crops', 'Fallow Land'], required: true },
      { id: 'neighborDisputeCheck', label: 'Adjacent Neighbor Dispute', type: 'select', options: ['No Dispute / Consenting Neighbors', 'Active Verbal Boundary Dispute', 'Litigation Pending in Civil Court'], required: true },
    ],
    checklists: [
      'Applicant or authorized representative present during inspection',
      'Boundary stones match Field Measurement Book (FMB) dimensions',
      'No adverse possession claim observed on ground',
      'Village administrative officer (VAO / Patwari) concurrence obtained'
    ]
  },

  // 2. Encumbrance Certificate (EC)
  'SRV-EC-02': {
    inspectionType: 'Title & Physical Encumbrance Field Check',
    description: 'Ground appraisal of physical easements, private access ways, and local mortgage notices.',
    statutoryRule: 'Registration Act Section 57 & Transfer of Property Act easements audit.',
    fields: [
      { id: 'easementAccess', label: 'Public / Private Easement Rights', type: 'select', options: ['No Easement / Exclusive Right of Way', 'Shared Common Cart Track', 'Public Footpath Traversing Parcel'], required: true },
      { id: 'bankNoticeBoard', label: 'Financial Institution Notice on Site', type: 'select', options: ['No Bank Attachment Notice', 'SARFAESI Act Notice Posted', 'Mortgage Board Erected'], required: true },
      { id: 'physicalPossessionStatus', label: 'Physical Occupancy Status', type: 'select', options: ['Owner Occupied', 'Tenant Occupied (Registered Lease)', 'Unoccupied Vacant', 'Unauthorized Occupant'], required: true }
    ],
    checklists: [
      'Site inspected for financial institution attachment boards',
      'Easement rights match registered schedule of properties',
      'Local tax receipt numbers verified on site'
    ]
  },

  // 3. Land Conversion (Agricultural to Non-Agricultural)
  'SRV-CONV-03': {
    inspectionType: 'Agricultural Soil & CLU Master Plan Alignment Audit',
    description: 'Assessment of agricultural viability, public irrigation channels, surrounding developments, and road approach.',
    statutoryRule: 'Land Revenue Code Section 95: Change of Land Use (CLU) feasibility guidelines.',
    fields: [
      { id: 'irrigationProximity', label: 'Distance from Nearest Govt Canal / Watercourse', type: 'number', unit: 'meters', placeholder: 'e.g. 150', required: true },
      { id: 'approachRoadWidth', label: 'Access Road Metal Width', type: 'number', unit: 'meters', placeholder: 'e.g. 9.14 (30 ft)', required: true },
      { id: 'soilTypeObserved', label: 'Observed Soil Classification', type: 'select', options: ['Red Gravelly / Non-Arable', 'Clayey Loam', 'Alluvial Fertile Topsoil', 'Rocky Terrain', 'Black Cotton Soil'], required: true },
      { id: 'surroundingDevelopment', label: 'Surrounding Land Pattern', type: 'select', options: ['Predominantly Built Residential/Commercial Layouts', 'Mixed Agro & Plotted Layouts', 'Strict Agricultural Farmland on all sides'], required: true }
    ],
    checklists: [
      'Land does not obstruct natural drainage channel or irrigation feeder',
      'Access road has minimum statutory width of 7.2 meters (24 ft)',
      'No conversion restrictions under Wetlands Conservation Act',
      'Ground water table depth and environmental sensitivity recorded'
    ]
  },

  // 4. Property Mutation & Jamabandi Entry
  'SRV-MUT-04': {
    inspectionType: 'Physical Mutation & Succession Jamabandi Audit',
    description: 'On-site verification of purchaser/inheritor physical possession and absence of conflicting claims.',
    statutoryRule: 'Land Records Manual: Jamabandi register entry verification following transfer deed.',
    fields: [
      { id: 'possessionMethod', label: 'Mode of Possession', type: 'select', options: ['Purchased under Registered Sale Deed', 'Inheritance / Legal Heir Succession', 'Court Decree / Auction', 'Gift Deed Settlement'], required: true },
      { id: 'neighborConfirmation', label: 'North & South Neighbor Verification', type: 'select', options: ['Neighbors confirmed applicant possession', 'Neighbors raised boundary objection', 'Neighbors unavailable for inquiry'], required: true },
      { id: 'jamabandiSubdivisionReq', label: 'Sub-division Required', type: 'select', options: ['Full Survey Field (No Sub-division needed)', 'Sub-division required with fresh FMB sketch'], required: true }
    ],
    checklists: [
      'Applicant has physical custody of the designated parcel',
      'No pending dispute or caveat registered with Taluk Revenue Office',
      'Boundary dimensions agree with registered deed schedule'
    ]
  },

  // 5. Building Permission & Layout Sanction
  'SRV-BLD-05': {
    inspectionType: 'Architectural Blueprint & Setback Verification',
    description: 'Physical audit of front, rear, and side setbacks, abutting road width, FAR compliance, and rainwater harvesting.',
    statutoryRule: 'Development Control Regulations (DCR) & Municipal Building Bylaws 2024.',
    fields: [
      { id: 'frontSetbackMeasured', label: 'Measured Front Setback', type: 'number', unit: 'meters', placeholder: 'e.g. 4.5', required: true },
      { id: 'rearSetbackMeasured', label: 'Measured Rear Setback', type: 'number', unit: 'meters', placeholder: 'e.g. 3.0', required: true },
      { id: 'sideSetbackMeasured', label: 'Minimum Side Setback', type: 'number', unit: 'meters', placeholder: 'e.g. 2.0', required: true },
      { id: 'abuttingRoadWidth', label: 'Actual Abutting Road Width', type: 'number', unit: 'meters', placeholder: 'e.g. 12.0', required: true },
      { id: 'proposedFloorsObserved', label: 'Existing Ground Structure', type: 'select', options: ['Completely Vacant Plot', 'Plinth Level Built', 'Structure Already Under Construction (Violation)', 'Old Dilapidated Structure to be Demolished'], required: true }
    ],
    checklists: [
      'Front setback satisfies minimum statutory requirement based on road width',
      'Plot boundaries match architectural site blueprint 1:100 scale',
      'Provision for rainwater harvesting pit earmarked on site',
      'Overhead electric line / cable clear of building facade'
    ]
  },

  // 6. Cadastral Boundary Demarcation & DGPS Survey
  'SRV-SURV-06': {
    inspectionType: 'Cadastral Boundary Pegging & Differential GPS Survey',
    description: 'High-precision DGPS RTK boundary survey, pegging of corner markers, and FMB discrepancy resolution.',
    statutoryRule: 'Survey & Boundaries Act: Demarcation using Permanent Triangulation Stations (PTS).',
    fields: [
      { id: 'dgpsBaseStationRef', label: 'PTS / Base Station Reference', type: 'text', placeholder: 'e.g. CORS Station TN-CH-04', required: true },
      { id: 'dgpsRtkAccuracy', label: 'RTK Fix Precision Achieved', type: 'number', unit: 'cm', placeholder: 'e.g. 1.8', required: true },
      { id: 'peggingStatus', label: 'Corner Pegging Done', type: 'select', options: ['All 4 Corner Concrete Pegs Erected', 'Wooden Stakes Fixed Temporarily', 'Pegging Objected by Adjacent Owner'], required: true },
      { id: 'areaVariancePercent', label: 'Area Variance from FMB Record', type: 'number', unit: '%', placeholder: 'e.g. 0.4', required: true }
    ],
    checklists: [
      'DGPS rover connected to State CORS network with FIX precision < 3cm',
      'Adjacent land owners notified and present during boundary pegging',
      'Cadastral corner coordinates recorded in WGS84 and UTM Zone 44N',
      'Field Measurement Book (FMB) sub-division sketch prepared'
    ]
  },

  // 7. Property Tax Assessment & Municipal Khata Transfer
  'SRV-TAX-07': {
    inspectionType: 'Municipal Plinth Area & Annual Ratable Value Audit',
    description: 'Measurement of built-up plinth area, carpet area, number of floors, occupancy status, and building usage.',
    statutoryRule: 'Municipal Corporation Act: Property Tax Valuation & Capital Value Matrix.',
    fields: [
      { id: 'measuredPlinthArea', label: 'Measured Built Plinth Area', type: 'number', unit: 'sq ft', placeholder: 'e.g. 2450', required: true },
      { id: 'numberOfFloors', label: 'Number of Floors Constructed', type: 'select', options: ['Ground Only (G)', 'Ground + 1 (G+1)', 'Ground + 2 (G+2)', 'Ground + 3 or more (G+3+)'], required: true },
      { id: 'constructionGrade', label: 'Construction Classification', type: 'select', options: ['RCC Pucca / First Class', 'Semi-Pucca Brick with Tiled Roof', 'Industrial Shed / Pre-fab', 'Kutcha Structure'], required: true },
      { id: 'actualOccupancy', label: 'Actual Usage on Ground', type: 'select', options: ['Self-Occupied Residential', 'Rented Residential', 'Commercial Office / Retail', 'Mixed Residential-cum-Shop'], required: true }
    ],
    checklists: [
      'Plinth area tape measurement matches sanctioned plan within ±2%',
      'Electricity meter number and consumer account verified on site',
      'No unauthorized extra floor or terrace penthouse detected',
      'Water meter connection active and inspected'
    ]
  },

  // 8. Water & Sewerage Network NOC
  'SRV-UTIL-08': {
    inspectionType: 'Civic Utility Mains & Hydraulic Gradient Survey',
    description: 'Verification of municipal trunk water main distance, sewage invert level, and road-cutting permission feasibility.',
    statutoryRule: 'Water Supply & Sewerage Board Regulations: Connection pressure and underground gradient norms.',
    fields: [
      { id: 'waterTrunkDistance', label: 'Distance from Municipal Water Main', type: 'number', unit: 'meters', placeholder: 'e.g. 18.5', required: true },
      { id: 'sewerManholeDistance', label: 'Distance to Nearest Sewer Manhole', type: 'number', unit: 'meters', placeholder: 'e.g. 12.0', required: true },
      { id: 'sewerInvertLevel', label: 'Gravitational Sewer Gradient', type: 'select', options: ['Natural Gravity Flow Available (>1:100)', 'Flat Gradient (Requires sump & pumping)', 'Adverse Incline (Pumping Mandatory)'], required: true },
      { id: 'roadCuttingNeeded', label: 'Road Cutting Required', type: 'select', options: ['No Road Cut Needed (Connection on same side)', 'Tar Road Cutting Required (Requires PWD NOC)', 'Paver Block Cut Only'], required: true }
    ],
    checklists: [
      'Water main diameter adequate for proposed load connection',
      'Site inspection confirms no contamination hazard to water trunk',
      'Sewage inspection chamber location demarcated on boundary'
    ]
  },

  // 9. Master Plan Zoning NOC & Land Reclassification
  'SRV-TCP-09': {
    inspectionType: 'Master Plan Zoning & Land-Use Matrix Audit',
    description: 'Ground verification of master plan zone compliance, public reservations, green belt buffers, and ring road alignments.',
    statutoryRule: 'Town & Country Planning Act: Master Development Plan 2031 Comprehensive Zoning Regulations.',
    fields: [
      { id: 'masterPlanZoneOnGround', label: 'Ground Character vs Master Plan', type: 'select', options: ['Conforms to Primary Residential Zone (R1/R2)', 'Conforms to Mixed Commercial Zone (C1)', 'Located in Industrial Area', 'Agricultural Green Buffer Zone'], required: true },
      { id: 'publicReservationCheck', label: 'Public Reservation / OSR Status', type: 'select', options: ['Clear of any Public Reservation or Road Widening', 'Affected by Proposed 18m Ring Road Alignment', 'Affected by Open Space Reservation (OSR) Clause'], required: true },
      { id: 'contourTopography', label: 'Site Topography & Low-Lying Status', type: 'select', options: ['Flat Ground / Natural Grade', 'Gently Sloping (< 5%)', 'Low-Lying / Inundation Prone in Monsoons', 'Hilly / Steep Gradient'], required: true }
    ],
    checklists: [
      'Parcel does not fall in designated water catchment or lake buffer',
      'Road widening reservation line pegged and marked on ground',
      'Surrounding land developments compatible with applied reclassification'
    ]
  },

  // 10. National & State Highway Access Setback NOC
  'SRV-HWY-10': {
    inspectionType: 'Highway Right-of-Way (RoW) & Ribbon Setback Audit',
    description: 'On-site verification of highway centerline distance, Right-of-Way (RoW) boundary, access acceleration lane, and ribbon development norms.',
    statutoryRule: 'National Highways Act 1956 & Ministry of Road Transport and Highways (MoRTH) Access Guidelines.',
    fields: [
      { id: 'distanceFromHwyCenterline', label: 'Distance from Highway Centerline', type: 'number', unit: 'meters', placeholder: 'e.g. 48.5', required: true },
      { id: 'highwayRoWWidth', label: 'Existing Highway RoW Width', type: 'number', unit: 'meters', placeholder: 'e.g. 60.0 (4-lane NH)', required: true },
      { id: 'frontageLength', label: 'Road Frontage Along Highway', type: 'number', unit: 'meters', placeholder: 'e.g. 35.0', required: true },
      { id: 'accessRoadType', label: 'Proposed Vehicular Access', type: 'select', options: ['Via Existing Parallel Service Road', 'Direct Access to Highway (Requires Deceleration Lane)', 'Culvert Access over Highway Drain'], required: true },
      { id: 'ribbonClearanceCompliance', label: 'Building Ribbon Setback', type: 'select', options: ['Complies with 45m Centerline Setback', 'Requires Highway Relaxation Approval', 'Violates Ribbon Development Minimums'], required: true }
    ],
    checklists: [
      'Right-of-Way (RoW) boundary stone confirmed with NHAI/PWD chainage markers',
      'Sight distance at proposed access junction exceeds 150 meters in both directions',
      'Highway roadside storm drain will not be blocked or modified',
      'Provision for dedicated deceleration / acceleration taper noted'
    ]
  },

  // 11. Eco-Sensitive Buffer & Reserve Forest Clearance
  'SRV-FOR-11': {
    inspectionType: 'Forest Boundary & Eco-Sensitive Zone (ESZ) Margin Survey',
    description: 'Physical audit of distance from notified Reserve Forest boundary, National Park peripheral buffer, tree census, and wildlife corridor.',
    statutoryRule: 'Forest (Conservation) Act 1980 & Wildlife Protection Act: 1km Eco-Sensitive Zone (ESZ) Buffer Norms.',
    fields: [
      { id: 'distanceFromForestBoundary', label: 'Distance from Notified Forest Boundary', type: 'number', unit: 'meters', placeholder: 'e.g. 1250', required: true },
      { id: 'forestCairnStatus', label: 'Forest Department Boundary Cairns', type: 'select', options: ['Cairns Intact and Verified on Site', 'Cairn Displaced / Weathered', 'No Forest Cairns Nearby (> 1km away)'], required: true },
      { id: 'treeCensusCount', label: 'Tree Count on Parcel (>30cm girth)', type: 'number', unit: 'trees', placeholder: 'e.g. 8', required: true },
      { id: 'endangeredSpeciesObserved', label: 'Scheduled Tree Species Present', type: 'select', options: ['No Protected / Scheduled Species Found', 'Sandalwood / Teak / Rosewood Present (Requires Special Permit)', 'Mangrove / Wetland Vegetation'], required: true },
      { id: 'wildlifeMovementCheck', label: 'Wildlife Corridor Animal Track', type: 'select', options: ['No Wildlife Movement Corridor on Site', 'Seasonal Elephant / Deer Corridor Adjacent'], required: true }
    ],
    checklists: [
      'Parcel does not encroach onto notified Reserve Forest section or compartment',
      'Distance measured from GPS-tagged boundary cairn using laser rangefinder',
      'Tree enumeration sheet completed and verified by forest guard / range officer',
      'No non-forestry commercial extraction observed on ground'
    ]
  },

  // 12. High-Tension Corridor NOC & Power Substation Clearance
  'SRV-ELEC-12': {
    inspectionType: 'High-Tension Transmission Corridor & Wire Clearance Survey',
    description: 'Ground measurement of horizontal and vertical clearance from overhead high-tension (HT) power lines, towers, and substation buffers.',
    statutoryRule: 'Central Electricity Authority (Safety & Electric Supply) Regulations 2023 - Reg. 60/61.',
    fields: [
      { id: 'transmissionVoltage', label: 'Transmission Line Voltage', type: 'select', options: ['11 kV Distribution Line', '33 kV Feeder Line', '66 kV High-Tension Line', '110 kV HT Transmission Grid', '230 kV Extra High Voltage (EHV)', '400 kV Super Grid Corridor'], required: true },
      { id: 'horizontalClearance', label: 'Measured Horizontal Clearance to Tower / Wire', type: 'number', unit: 'meters', placeholder: 'e.g. 24.5', required: true },
      { id: 'verticalSagClearance', label: 'Vertical Wire Sag Clearance at Max Summer Sag', type: 'number', unit: 'meters', placeholder: 'e.g. 8.2', required: true },
      { id: 'rightOfWayCorridorWidth', label: 'Transmission Line Right-of-Way (RoW)', type: 'select', options: ['Structure Located Completely Outside RoW Safety Corridor', 'Structure Within 5m of RoW Margin', 'Structure Directly Beneath Conductors (Strict Prohibited Zone)'], required: true },
      { id: 'towerBaseEarthingCheck', label: 'Substation / Tower Earthing Grid Buffer', type: 'select', options: ['Clear (> 15m from Tower Footing)', 'Within 15m of Pylon Earthing Array'], required: true }
    ],
    checklists: [
      'Horizontal distance from nearest conductor meets CEA statutory table clearance',
      'No building structure or crane operation planned directly under the conductors',
      'Soil resistivity and earth electrode clearance checked',
      'Safety warning boards and induction hazard perimeter verified'
    ]
  },

  // 13. Coastal Regulation Zone & Wetland Buffer Clearance
  'SRV-ENV-13': {
    inspectionType: 'CRZ Classification & Wetland Buffer Audit',
    description: 'Ground verification of distance from High Tide Line (HTL), CRZ classification (CRZ-I/II/III/IV), wetland buffer, and mangrove conservation zone.',
    statutoryRule: 'CRZ Notification 2019 & Wetland (Conservation and Management) Rules 2017.',
    fields: [
      { id: 'crzClassification', label: 'Notified CRZ Classification', type: 'select', options: ['CRZ-I (Ecologically Sensitive Area / Mangroves)', 'CRZ-II (Substantially Built Urban Area)', 'CRZ-III (Rural / Undeveloped Coastal Zone)', 'CRZ-IV (Water Area & Intertidal Zone)', 'Outside CRZ Margin (> 500m from HTL)'], required: true },
      { id: 'distanceFromHTL', label: 'Distance from Demarcated High Tide Line (HTL)', type: 'number', unit: 'meters', placeholder: 'e.g. 520', required: true },
      { id: 'mangroveBufferObserved', label: 'Mangrove Vegetation & 50m Buffer', type: 'select', options: ['No Mangroves within 100m Perimeter', 'Mangroves Present (50m Protective Buffer Kept Vacant)', 'Encroachment in Mangrove Buffer (Violation)'], required: true },
      { id: 'environmentalClearanceReq', label: 'Statutory Clearance Category', type: 'select', options: ['General Exemption Permitted under 2019 Norms', 'State Coastal Zone Management Authority (SCZMA) Clearance Required', 'MoEFCC National Environmental Clearance Required'], required: true }
    ],
    checklists: [
      'High Tide Line (HTL) referenced against official NCSCM demarcated coastal zone map',
      'No permanent commercial structure planned inside No-Development Zone (NDZ)',
      'Natural drainage flow, tidal creeks, and estuarine channels unobstructed',
      'Ambient environmental impact and solid waste management plan verified'
    ]
  }
};

export const getServiceInspectionConfig = (serviceCode) => {
  return SERVICE_INSPECTION_CONFIG[serviceCode] || SERVICE_INSPECTION_CONFIG['SRV-LOC-01'];
};
