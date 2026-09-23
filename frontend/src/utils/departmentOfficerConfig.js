// departmentOfficerConfig.js
// Dynamic department configuration registry for all 11 LandStack departments.
// Controls department-specific permissions, field operations, GIS layers, and reporting.

export const DEPARTMENT_CONFIGS = {
  // 1. REVENUE
  REVENUE: {
    code: 'REV',
    aliases: ['Revenue', 'Revenue & Disaster Management', 'REV', 'REV-DM'],
    name: 'Revenue & Disaster Management',
    shortName: 'Revenue',
    themeColor: 'amber',
    badgeText: 'Revenue Administration Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'Possession & Record Verification',
    primaryFocus: 'Patta scrutiny, land ownership verification, mutation, jamabandi audit, and revenue records.',
    allowedFieldOperations: [
      'POSSESSION_AUDIT',
      'NEIGHBOR_INQUIRY',
      'DISPUTE_CHECK',
      'JAMABANDI_VERIFICATION',
      'LAND_USE_AUDIT'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'revenue_villages', label: 'Revenue Village Boundaries', available: true },
      { id: 'jamabandi_status', label: 'Jamabandi Classification Overlay', available: true },
      { id: 'fmb_boundaries', label: 'FMB Survey Boundaries', available: false, fallbackText: 'FMB GIS data unavailable for this taluk' }
    ],
    reportTypes: [
      { id: 'revenue_applications', name: 'Revenue Applications Log', description: 'Complete register of patta and mutation applications' },
      { id: 'patta_verification', name: 'Patta Verification Audit', description: 'Record of ownership verifications completed' },
      { id: 'pending_revenue', name: 'Pending Jamabandi Inquiries', description: 'Applications awaiting revenue inquiry' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Document Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'Possession Checks' },
      { id: 'TODAY', label: "Today's Schedule" },
      { id: 'OVERDUE', label: 'Overdue' },
      { id: 'CLARIFICATION', label: 'Clarifications' },
      { id: 'COMPLETED', label: 'Forwarded' }
    ]
  },

  // 2. SURVEY & LAND RECORDS / LAND & SURVEY
  SURVEY: {
    code: 'SRV-LR',
    aliases: ['Survey & Land Records', 'Land & Survey', 'Survey & Settlement', 'SRV-LR', 'SRV-SET', 'Survey'],
    name: 'Survey & Land Records',
    shortName: 'Land & Survey',
    themeColor: 'teal',
    badgeText: 'Cadastral Survey & Demarcation Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: true, // EXCLUSIVE Cadastral Field Operation Capabilities
    fieldInspectionLabel: 'DGPS Survey & Boundary Demarcation',
    primaryFocus: 'Cadastral survey, DGPS RTK capture, corner pegging, FMB sketch alignment, boundary variance, and encroachment audit.',
    allowedFieldOperations: [
      'GPS_CAPTURE',
      'BOUNDARY_PEGGING',
      'FIELD_MEASUREMENTS',
      'GEOTAGGED_PHOTOS',
      'ENCROACHMENT_REPORTING',
      'DISCREPANCY_REPORTING',
      'RESURVEY_REQUEST',
      'FMB_ALIGNMENT',
      'CORS_CALIBRATION'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcel Boundaries', available: true },
      { id: 'fmb_polygons', label: 'Field Measurement Book (FMB) Geometry', available: true },
      { id: 'survey_corner_stones', label: 'Permanent Survey Stones (PTS)', available: true },
      { id: 'cors_stations', label: 'State CORS Reference Network', available: true },
      { id: 'subdivision_splits', label: 'Cadastral Sub-Division Layers', available: true }
    ],
    reportTypes: [
      { id: 'cadastral_survey_reports', name: 'Cadastral Inspection Reports', description: 'Certified field inspection reports with DGPS coordinates' },
      { id: 'boundary_discrepancy_log', name: 'Boundary Discrepancy & Encroachment Log', description: 'Parcels with boundary variance > 1%' },
      { id: 'resurvey_requests', name: 'Official Re-Survey Recommendations', description: 'Cases flagged for formal sub-division re-survey' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'FMB Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'Field DGPS Surveys' },
      { id: 'TODAY', label: "Today's Demarcation" },
      { id: 'OVERDUE', label: 'Overdue Surveys' },
      { id: 'CLARIFICATION', label: 'Discrepancies' },
      { id: 'COMPLETED', label: 'Demarcated / Forwarded' }
    ]
  },

  // 3. REGISTRATION
  REGISTRATION: {
    code: 'REG',
    aliases: ['Registration', 'Registration & Stamp Revenue', 'REG', 'REG-STAMP'],
    name: 'Registration & Stamp Revenue',
    shortName: 'Registration',
    themeColor: 'blue',
    badgeText: 'Property Registration & Conveyancing Authority',
    canPerformFieldOps: false, // DESK AUDIT by default
    isCadastralSurvey: false,
    fieldInspectionLabel: 'Physical Encumbrance Inspection (Optional)',
    primaryFocus: 'Deed registration, title chain trace, 30-year Encumbrance Certificate (EC), guideline valuation, and stamp duty audit.',
    allowedFieldOperations: [
      'TITLE_DEED_SCRUTINY',
      'ENCUMBRANCE_AUDIT',
      'MORTGAGE_NOTICE_CHECK',
      'EASEMENT_RIGHTS_AUDIT'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Registered Parcel Centroids', available: true },
      { id: 'guideline_values', label: 'State Guideline Valuation Zones', available: true },
      { id: 'sro_jurisdictions', label: 'Sub-Registrar Office (SRO) Extents', available: true },
      { id: 'prohibited_properties', label: 'Section 22-A Prohibited Lands Overlay', available: false, fallbackText: 'Prohibited property registry GIS data unavailable' }
    ],
    reportTypes: [
      { id: 'registration_applications', name: 'Registration Applications Register', description: 'Deed conveyance and EC application records' },
      { id: 'encumbrance_audit_log', name: '30-Year Encumbrance Audit Report', description: 'Certified non-encumbrance search reports' },
      { id: 'stamp_duty_valuation', name: 'Guideline Valuation & Deficit Stamp Audit', description: 'Valuation cross-checks' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Deed Scrutiny' },
      { id: 'TODAY', label: "Today's Inquiries" },
      { id: 'OVERDUE', label: 'Overdue Searches' },
      { id: 'CLARIFICATION', label: 'Title Defects' },
      { id: 'COMPLETED', label: 'Certified / Forwarded' }
    ]
  },

  // 4. TOWN & COUNTRY PLANNING / LOCAL PLANNING
  TOWN_PLANNING: {
    code: 'TCP',
    aliases: ['Town & Country Planning', 'Town Planning', 'TCP', 'TCP-URB', 'Local Planning Authority'],
    name: 'Town & Country Planning',
    shortName: 'Town Planning',
    themeColor: 'purple',
    badgeText: 'Urban Planning & Land-Use Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'Master Plan Zoning & Site Appraisal',
    primaryFocus: 'Master Plan land-use zoning, development restrictions, layout sanction, OSR reservations, and access road width verification.',
    allowedFieldOperations: [
      'ZONING_CONFORMITY',
      'ROAD_WIDTH_MEASUREMENT',
      'OSR_RESERVATION_AUDIT',
      'TOPOGRAPHY_CHECK',
      'BUFFER_ZONE_VERIFICATION'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'master_plan_zoning', label: 'Master Plan 2031 Land-Use Zones', available: true },
      { id: 'proposed_road_widening', label: 'Proposed Ring Road & Widening Alignments', available: true },
      { id: 'open_space_reservations', label: 'OSR & Public Reservation Zones', available: true },
      { id: 'waterbody_catchment', label: 'Designated Lake Catchments & Buffers', available: false, fallbackText: 'Catchment GIS layer offline' }
    ],
    reportTypes: [
      { id: 'zoning_noc_reports', name: 'Master Plan Zoning Clearance Register', description: 'Zoning NOC audit reports' },
      { id: 'land_use_reclassification', name: 'Land-Use Reclassification Inquiries', description: 'CLU appraisals' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Zoning Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'Site Appraisals' },
      { id: 'TODAY', label: "Today's Visits" },
      { id: 'OVERDUE', label: 'Overdue Appraisals' },
      { id: 'CLARIFICATION', label: 'Planning Deficiencies' },
      { id: 'COMPLETED', label: 'Sanctioned / Forwarded' }
    ]
  },

  // 5. LOCAL BODY / MUNICIPAL ADMINISTRATION
  LOCAL_BODY: {
    code: 'LOC-BODY',
    aliases: ['Local Body', 'Municipal Administration', 'LOC-BODY', 'MUN-CORP', 'Panchayat'],
    name: 'Local Body / Municipal Administration',
    shortName: 'Local Body',
    themeColor: 'emerald',
    badgeText: 'Urban Local Body & Civic Governance Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'Plinth Area & Ratable Value Audit',
    primaryFocus: 'Property tax assessment, municipal khata transfer, built-up plinth area measurement, annual ratable value, and trade licenses.',
    allowedFieldOperations: [
      'PLINTH_AREA_MEASUREMENT',
      'FLOOR_COUNT_AUDIT',
      'CONSTRUCTION_GRADE_CHECK',
      'OCCUPANCY_STATUS_AUDIT'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'ward_boundaries', label: 'Municipal Ward Boundaries', available: true },
      { id: 'tax_valuation_zones', label: 'Unit Area Tax Value Matrix Zones', available: true },
      { id: 'municipal_street_network', label: 'Municipal Road Maintenance Register', available: false, fallbackText: 'Street register GIS data unavailable' }
    ],
    reportTypes: [
      { id: 'tax_assessment_reports', name: 'Property Tax Assessment Summaries', description: 'Plinth area and valuation reports' },
      { id: 'khata_transfer_log', name: 'Municipal Khata Transfer Register', description: 'Title mutation records' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Tax Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'Plinth Verifications' },
      { id: 'TODAY', label: "Today's Visits" },
      { id: 'OVERDUE', label: 'Overdue Assessments' },
      { id: 'CLARIFICATION', label: 'Tax Clarifications' },
      { id: 'COMPLETED', label: 'Assessed / Forwarded' }
    ]
  },

  // 6. BUILDING & PLANNING
  BUILDING: {
    code: 'BLD-PLAN',
    aliases: ['Building & Planning', 'Building Permission', 'BLD-PLAN', 'Building'],
    name: 'Building & Planning',
    shortName: 'Building & Planning',
    themeColor: 'indigo',
    badgeText: 'Building Bylaws & Structural Sanction Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'Architectural Blueprint & Setback Inspection',
    primaryFocus: 'Front/rear/side setback measurements, floor area ratio (FAR), abutting road width, building height, structural cert, and rainwater harvesting.',
    allowedFieldOperations: [
      'SETBACK_MEASUREMENT',
      'ROAD_WIDTH_AUDIT',
      'PLINTH_STRUCTURE_CHECK',
      'RAINWATER_HARVESTING_AUDIT',
      'HEIGHT_RESTRICTION_CHECK'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'building_sanction_zones', label: 'Building Bylaw Density Zones', available: true },
      { id: 'heritage_buffers', label: 'Heritage & Monument Restricted Buffers', available: true },
      { id: 'airport_height_funnel', label: 'AAI Airport Obstacle Limitation Surfaces', available: false, fallbackText: 'Airport OLS funnel GIS layer offline' }
    ],
    reportTypes: [
      { id: 'building_sanction_reports', name: 'Building Blueprint Sanction Register', description: 'Setback and FAR compliance records' },
      { id: 'setback_deviation_log', name: 'Setback Deviation & Violation Notices', description: 'Structures violating statutory setbacks' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Blueprint Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'Setback Audits' },
      { id: 'TODAY', label: "Today's Inspections" },
      { id: 'OVERDUE', label: 'Overdue Inspections' },
      { id: 'CLARIFICATION', label: 'Blueprint Defects' },
      { id: 'COMPLETED', label: 'Sanctioned / Forwarded' }
    ]
  },

  // 7. HIGHWAYS / PUBLIC WORKS DEPARTMENT (PWD)
  HIGHWAYS: {
    code: 'HWY',
    aliases: ['Highways', 'Highways & Public Works', 'HWY', 'PWD', 'Highways / PWD'],
    name: 'Highways / Public Works Department',
    shortName: 'Highways / PWD',
    themeColor: 'rose',
    badgeText: 'Highway Right-of-Way & Access Safety Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'Highway RoW & Ribbon Setback Audit',
    primaryFocus: 'National/State Highway Right-of-Way (RoW), 45m centerline setback, ribbon development, road frontage, and vehicular access acceleration taper.',
    allowedFieldOperations: [
      'HIGHWAY_CENTERLINE_MEASUREMENT',
      'ROW_WIDTH_VERIFICATION',
      'FRONTAGE_MEASUREMENT',
      'ACCESS_ROAD_TYPE_AUDIT',
      'RIBBON_DEVELOPMENT_CHECK'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'highway_network', label: 'National & State Highway Centerlines', available: true },
      { id: 'highway_row_corridors', label: 'Notified Highway Right-of-Way (RoW) Buffers', available: true },
      { id: 'access_points_registry', label: 'Approved Access & Junction Catalog', available: false, fallbackText: 'Junction GIS catalog unavailable' }
    ],
    reportTypes: [
      { id: 'highway_noc_reports', name: 'Highway Access Setback Clearance Register', description: 'Approved Highway access NOC records' },
      { id: 'ribbon_setback_audit', name: 'Ribbon Development Setback Compliance', description: 'Distance compliance records' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Engineering Plan Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'Highway Setback Audits' },
      { id: 'TODAY', label: "Today's Visits" },
      { id: 'OVERDUE', label: 'Overdue Audits' },
      { id: 'CLARIFICATION', label: 'Access Defects' },
      { id: 'COMPLETED', label: 'Cleared / Forwarded' }
    ]
  },

  // 8. AGRICULTURE & FOREST
  FOREST: {
    code: 'FOR',
    aliases: ['Forest', 'Agriculture & Forest', 'FOR', 'Forest Department', 'Environment & Forests'],
    name: 'Agriculture & Forest',
    shortName: 'Agriculture & Forest',
    themeColor: 'green',
    badgeText: 'Forest Conservation & Eco-Sensitive Zone Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'Forest Boundary & Eco-Sensitive Zone Margin Survey',
    primaryFocus: 'Reserve Forest boundary cairns, 1km Eco-Sensitive Zone (ESZ) buffer, tree enumeration (>30cm girth), scheduled flora, and wildlife corridors.',
    allowedFieldOperations: [
      'FOREST_BOUNDARY_MEASUREMENT',
      'CAIRN_VERIFICATION',
      'TREE_CENSUS_AUDIT',
      'PROTECTED_SPECIES_CHECK',
      'WILDLIFE_CORRIDOR_AUDIT'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'reserve_forest_boundary', label: 'Notified Reserve Forest Boundaries', available: true },
      { id: 'esz_buffer_1km', label: '1km Eco-Sensitive Zone (ESZ) Peripheral Buffer', available: true },
      { id: 'tree_density_canopy', label: 'Satellite Tree Canopy Cover Analysis', available: false, fallbackText: 'Canopy density GIS layer unavailable' }
    ],
    reportTypes: [
      { id: 'forest_clearance_reports', name: 'Forest Peripheral Clearance Register', description: 'ESZ buffer clearance records' },
      { id: 'tree_enumeration_log', name: 'Tree Census & Scheduled Flora Log', description: 'Tree census verification certificates' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Forest Map Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'Forest Buffer Audits' },
      { id: 'TODAY', label: "Today's Surveys" },
      { id: 'OVERDUE', label: 'Overdue Surveys' },
      { id: 'CLARIFICATION', label: 'Ecological Queries' },
      { id: 'COMPLETED', label: 'Cleared / Forwarded' }
    ]
  },

  // 9. ELECTRICITY
  ELECTRICITY: {
    code: 'ELEC',
    aliases: ['Electricity', 'Energy & Power Utilities', 'ELEC', 'Power Transmission', 'TNEB'],
    name: 'Electricity & Power Utilities',
    shortName: 'Electricity',
    themeColor: 'yellow',
    badgeText: 'Power Transmission & High-Tension Safety Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'High-Tension Transmission Corridor Survey',
    primaryFocus: '11kV to 400kV transmission lines, horizontal clearance, vertical wire sag under max summer load, CEA safety regulations (Reg 60/61), and substation buffers.',
    allowedFieldOperations: [
      'VOLTAGE_RATING_AUDIT',
      'HORIZONTAL_CLEARANCE_MEASUREMENT',
      'VERTICAL_SAG_MEASUREMENT',
      'ROW_CORRIDOR_CHECK',
      'TOWER_EARTHING_BUFFER_AUDIT'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'transmission_lines_grid', label: 'High-Tension Grid Lines (66kV-400kV)', available: true },
      { id: 'transmission_tower_footings', label: 'Pylon / Tower Footing Coordinates', available: true },
      { id: 'power_substations', label: 'Substation Earthing Safety Buffer Zones', available: false, fallbackText: 'Substation earthing GIS data unavailable' }
    ],
    reportTypes: [
      { id: 'electrical_clearance_reports', name: 'High-Tension Corridor Clearance Register', description: 'Certified HT clearance safety reports' },
      { id: 'cea_violation_log', name: 'CEA Safety Regulation Buffer Violations', description: 'Encroachments in HT safety corridors' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Electrical Layout Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'HT Clearance Audits' },
      { id: 'TODAY', label: "Today's Surveys" },
      { id: 'OVERDUE', label: 'Overdue Surveys' },
      { id: 'CLARIFICATION', label: 'Safety Discrepancies' },
      { id: 'COMPLETED', label: 'Cleared / Forwarded' }
    ]
  },

  // 10. WATER & SEWERAGE
  WATER: {
    code: 'WAT-SEW',
    aliases: ['Water & Sewerage', 'Water Supply & Sewerage Board', 'WAT-SEW', 'Water', 'Drainage'],
    name: 'Water & Sewerage',
    shortName: 'Water & Sewerage',
    themeColor: 'cyan',
    badgeText: 'Civic Water & Sewerage Infrastructure Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'Civic Utility Mains & Hydraulic Gradient Survey',
    primaryFocus: 'Distance from municipal trunk water mains, sewer invert depth, gravitational flow gradient (>1:100), water contamination safety, and road cutting feasibility.',
    allowedFieldOperations: [
      'WATER_TRUNK_DISTANCE_MEASUREMENT',
      'SEWER_MANHOLE_DISTANCE_AUDIT',
      'INVERT_GRADIENT_CHECK',
      'ROAD_CUTTING_FEASIBILITY_CHECK'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'trunk_water_mains', label: 'Municipal Trunk Water Supply Mains', available: true },
      { id: 'underground_sewer_lines', label: 'Underground Sewerage Network & Manholes', available: true },
      { id: 'stormwater_drains', label: 'Stormwater Drainage Invert Gradients', available: false, fallbackText: 'Stormwater network GIS layer offline' }
    ],
    reportTypes: [
      { id: 'utility_noc_reports', name: 'Water & Sewerage Network NOC Register', description: 'Utility clearance certificates' },
      { id: 'hydraulic_gradient_log', name: 'Hydraulic Invert & Flow Assessment Log', description: 'Gravity flow verification logs' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Plumbing Plan Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'Network Feasibility Audits' },
      { id: 'TODAY', label: "Today's Surveys" },
      { id: 'OVERDUE', label: 'Overdue Audits' },
      { id: 'CLARIFICATION', label: 'Plumbing Deficiencies' },
      { id: 'COMPLETED', label: 'Cleared / Forwarded' }
    ]
  },

  // 11. ENVIRONMENT-RELATED AUTHORITIES
  ENVIRONMENT: {
    code: 'ENV',
    aliases: ['Environment', 'Environment & Climate Change', 'ENV', 'Pollution Control', 'Environmental Authority'],
    name: 'Environment & Climate Change',
    shortName: 'Environment',
    themeColor: 'teal',
    badgeText: 'Environmental Protection & Coastal Zone Authority',
    canPerformFieldOps: true,
    isCadastralSurvey: false,
    fieldInspectionLabel: 'CRZ Classification & Wetland Buffer Audit',
    primaryFocus: 'Coastal Regulation Zone (CRZ-I/II/III/IV), High Tide Line (HTL) distance, No-Development Zone (NDZ), wetland buffer perimeters, and EIA compliance.',
    allowedFieldOperations: [
      'CRZ_CATEGORY_AUDIT',
      'HTL_DISTANCE_MEASUREMENT',
      'MANGROVE_BUFFER_CHECK',
      'WETLAND_CONSERVATION_CHECK',
      'EIA_COMPLIANCE_AUDIT'
    ],
    gisLayers: [
      { id: 'cadastral_parcels', label: 'Cadastral Parcels', available: true },
      { id: 'crz_notified_zones', label: 'Coastal Regulation Zones (CRZ I-IV)', available: true },
      { id: 'high_tide_line', label: 'Demarcated High Tide Line (HTL 500m/200m NDZ)', available: true },
      { id: 'national_wetlands_atlas', label: 'National Wetland Inventory Overlay', available: true },
      { id: 'air_quality_ambient_zones', label: 'Ambient Air Quality Industrial Buffer', available: false, fallbackText: 'Industrial buffer GIS data unavailable' }
    ],
    reportTypes: [
      { id: 'crz_clearance_reports', name: 'Coastal Regulation Zone Clearance Register', description: 'Certified CRZ and wetland clearances' },
      { id: 'ecological_buffer_log', name: 'Ecologically Sensitive Area Impact Audits', description: 'Wetland and coastal compliance logs' }
    ],
    queueTabs: [
      { id: 'ALL', label: 'All Cases' },
      { id: 'DOC_VERIFICATION', label: 'Environmental Scrutiny' },
      { id: 'FIELD_INSPECTION', label: 'CRZ / Wetland Audits' },
      { id: 'TODAY', label: "Today's Surveys" },
      { id: 'OVERDUE', label: 'Overdue Audits' },
      { id: 'CLARIFICATION', label: 'Environmental Queries' },
      { id: 'COMPLETED', label: 'Cleared / Forwarded' }
    ]
  }
};

// Helper: Normalize department string and retrieve config
export const getDepartmentConfig = (deptNameOrCode) => {
  if (!deptNameOrCode) return DEPARTMENT_CONFIGS.REVENUE;

  const target = deptNameOrCode.trim().toLowerCase();

  // Pass 1: Exact match by code, name, shortName, or exact alias
  for (const key of Object.keys(DEPARTMENT_CONFIGS)) {
    const config = DEPARTMENT_CONFIGS[key];
    if (config.code.toLowerCase() === target || config.name.toLowerCase() === target || config.shortName.toLowerCase() === target) {
      return config;
    }
    if (config.aliases && config.aliases.some(a => a.toLowerCase() === target)) {
      return config;
    }
  }

  // Pass 2: Substring match (skip generic short words)
  // Ensure longer/more specific departments (like Registration) match before generic 'Revenue'
  const keys = Object.keys(DEPARTMENT_CONFIGS).sort((a, b) => {
    // Sort so REGISTRATION comes before REVENUE
    if (a === 'REGISTRATION') return -1;
    if (b === 'REGISTRATION') return 1;
    return 0;
  });

  for (const key of keys) {
    const config = DEPARTMENT_CONFIGS[key];
    if (config.aliases && config.aliases.some(a => a.length >= 4 && target.includes(a.toLowerCase()))) {
      return config;
    }
  }

  // Fallback defaults to Revenue configuration
  return DEPARTMENT_CONFIGS.REVENUE;
};

