package com.landstack.data;

import com.landstack.entity.*;
import com.landstack.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ParcelRepository parcelRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ApplicationDocumentRepository documentRepository;
    private final FieldVerificationRepository fieldVerificationRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (roleRepository.count() > 0) {
            ensureTenDepartmentsAndServices();
            ensureSampleFieldApplications();
            log.info("Core database tables already seeded. Verified 10 statutory departments and services.");
            return;
        }

        log.info("Seeding LandStack SIH 2026 database...");

        // 1. Roles
        Role adminRole = roleRepository.save(Role.builder().name(RoleType.ADMIN).description("System Administrator").build());
        Role supervisorRole = roleRepository.save(Role.builder().name(RoleType.DEPARTMENT_SUPERVISOR).description("Department Supervisor").build());
        Role officerRole = roleRepository.save(Role.builder().name(RoleType.FIELD_OFFICER).description("Field Verification Officer").build());
        Role citizenRole = roleRepository.save(Role.builder().name(RoleType.CITIZEN).description("Citizen Portal User").build());

        // 2. Departments
        Department deptRevenue = departmentRepository.save(Department.builder()
                .name("Revenue & Disaster Management")
                .code("REV-DM")
                .description("Department responsible for land records, patta, mutation, and revenue collection")
                .active(true)
                .build());

        Department deptSurvey = departmentRepository.save(Department.builder()
                .name("Survey & Settlement")
                .code("SRV-SET")
                .description("Cadastral surveys, ULPIN geocoding, and boundary demarcation")
                .active(true)
                .build());

        Department deptReg = departmentRepository.save(Department.builder()
                .name("Registration & Stamp Revenue")
                .code("REG-STAMP")
                .description("Deed registration, encumbrance certificates, and title conveyancing")
                .active(true)
                .build());

        Department deptTown = departmentRepository.save(Department.builder()
                .name("Town & Country Planning")
                .code("TCP-URB")
                .description("Master plan zoning, land-use conversion, and building layout sanction")
                .active(true)
                .build());

        Department deptMunicipal = departmentRepository.save(Department.builder()
                .name("Municipal Administration")
                .code("MUN-CORP")
                .description("Urban local body property taxation, civic utility NOCs, and trade permits")
                .active(true)
                .build());

        // 3. Demo Users (Password: Demo@123)
        String demoPassword = passwordEncoder.encode("Demo@123");

        User adminUser = userRepository.save(User.builder()
                .fullName("Rajesh Sharma")
                .email("admin@landstack.demo")
                .password(demoPassword)
                .mobile("+91 9876543210")
                .role(adminRole)
                .department(deptRevenue)
                .designation("Principal Secretary (Land Governance)")
                .employeeCode("GOV-ADM-001")
                .active(true)
                .build());

        User supervisorUser = userRepository.save(User.builder()
                .fullName("Ananya Deshmukh")
                .email("supervisor@landstack.demo")
                .password(demoPassword)
                .mobile("+91 9845012345")
                .role(supervisorRole)
                .department(deptRevenue)
                .designation("Tahsildar & Revenue Supervisor")
                .employeeCode("REV-SUP-104")
                .active(true)
                .build());

        User officerUser = userRepository.save(User.builder()
                .fullName("Vikramaditya Rao")
                .email("officer@landstack.demo")
                .password(demoPassword)
                .mobile("+91 9711223344")
                .role(officerRole)
                .department(deptRevenue)
                .designation("Senior Cadastral Inspector")
                .employeeCode("REV-FLD-502")
                .active(true)
                .build());

        User citizenUser = userRepository.save(User.builder()
                .fullName("Karthik Subramanian")
                .email("citizen@landstack.demo")
                .password(demoPassword)
                .mobile("+91 9444123890")
                .role(citizenRole)
                .designation("Citizen")
                .active(true)
                .build());

        // Extra supervisor and officer for Town Planning
        User supTown = userRepository.save(User.builder()
                .fullName("Sunita Mehra")
                .email("supervisor.urban@landstack.demo")
                .password(demoPassword)
                .mobile("+91 9811099887")
                .role(supervisorRole)
                .department(deptTown)
                .designation("Town Planning Officer")
                .employeeCode("TCP-SUP-202")
                .active(true)
                .build());

        User offTown = userRepository.save(User.builder()
                .fullName("Arun Kumar")
                .email("officer.urban@landstack.demo")
                .password(demoPassword)
                .mobile("+91 9922334455")
                .role(officerRole)
                .department(deptTown)
                .designation("Zoning Field Surveyor")
                .employeeCode("TCP-FLD-303")
                .active(true)
                .build());

        // 4. Government Services Catalog
        ServiceEntity s1 = serviceRepository.save(ServiceEntity.builder()
                .serviceCode("SRV-LOC-01")
                .serviceName("Land Ownership Certificate (Patta)")
                .description("Official statutory certification confirming undisputed ownership and title of the designated parcel.")
                .department(deptRevenue)
                .requiredDocuments("Registered Sale Deed, Encumbrance Certificate, Latest Property Tax Receipt, Identity Proof")
                .processingDays(7)
                .feeInr(150.0)
                .active(true)
                .build());

        ServiceEntity s2 = serviceRepository.save(ServiceEntity.builder()
                .serviceCode("SRV-EC-02")
                .serviceName("Encumbrance Certificate (EC)")
                .description("Certificate detailing all registered financial liabilities, mortgages, and transactions on the parcel for up to 30 years.")
                .department(deptReg)
                .requiredDocuments("Previous Deed Copy, Survey Sketch, Aadhaar/Voter ID")
                .processingDays(3)
                .feeInr(100.0)
                .active(true)
                .build());

        ServiceEntity s3 = serviceRepository.save(ServiceEntity.builder()
                .serviceCode("SRV-CONV-03")
                .serviceName("Land Conversion (Agricultural to Non-Agricultural)")
                .description("Statutory permission under Section 47A for reclassifying agricultural land into residential or commercial layouts.")
                .department(deptRevenue)
                .requiredDocuments("Patta/Chitta Extract, FMB Sketch, Soil Quality Certificate, Master Plan Zoning Extract")
                .processingDays(21)
                .feeInr(2500.0)
                .active(true)
                .build());

        ServiceEntity s4 = serviceRepository.save(ServiceEntity.builder()
                .serviceCode("SRV-MUT-04")
                .serviceName("Property Mutation & Jamabandi Entry")
                .description("Updating buyer title and ownership records in the state jamabandi revenue registers following sale or inheritance.")
                .department(deptRevenue)
                .requiredDocuments("Registered Transfer Deed, Death Certificate (if inheritance), No-Calamity Declaration")
                .processingDays(14)
                .feeInr(300.0)
                .active(true)
                .build());

        ServiceEntity s5 = serviceRepository.save(ServiceEntity.builder()
                .serviceCode("SRV-BLD-05")
                .serviceName("Building Permission & Layout Sanction")
                .description("Technical appraisal and municipal approval of architectural and structural blueprints adhering to building bylaws.")
                .department(deptTown)
                .requiredDocuments("Approved Site Plan, Structural Engineer Certificate, Soil Investigation Report, Ownership Patta")
                .processingDays(15)
                .feeInr(4500.0)
                .active(true)
                .build());

        ServiceEntity s6 = serviceRepository.save(ServiceEntity.builder()
                .serviceCode("SRV-SURV-06")
                .serviceName("Cadastral Boundary Demarcation & DGPS Survey")
                .description("On-site physical boundary pegging and differential GPS demarcation to resolve neighbor boundary overlaps.")
                .department(deptSurvey)
                .requiredDocuments("Cadastral Field Measurement Book (FMB), Neighbor Consent / Notice, Patta")
                .processingDays(10)
                .feeInr(800.0)
                .active(true)
                .build());

        ServiceEntity s7 = serviceRepository.save(ServiceEntity.builder()
                .serviceCode("SRV-TAX-07")
                .serviceName("Property Tax Assessment & Name Change")
                .description("Apportioning municipal annual ratable value and registering new property owner for local municipal taxes.")
                .department(deptMunicipal)
                .requiredDocuments("Latest Electricity Bill, Sale Deed, Completion Certificate")
                .processingDays(7)
                .feeInr(200.0)
                .active(true)
                .build());

        ServiceEntity s8 = serviceRepository.save(ServiceEntity.builder()
                .serviceCode("SRV-UTIL-08")
                .serviceName("Water & Sewerage Network NOC")
                .description("Civic utility clearance for connecting residential/commercial structures to the municipal trunk water mains.")
                .department(deptMunicipal)
                .requiredDocuments("Plumbing Layout, Sanctioned Building Plan, Property Tax Receipt")
                .processingDays(7)
                .feeInr(500.0)
                .active(true)
                .build());

        // 5. Realistic 22 Cadastral Parcels with Polygons
        List<Parcel> parcels = new ArrayList<>();

        // Helper to generate polygon GeoJSON around a center lat/lng
        // Target demo parcel: 33TNCHN0000123456 in Tambaram, Chennai
        parcels.add(createParcel(
                "33TNCHN0000123456", "124/3B", "A", "Chennai", "Tambaram", "Selaiyur", "600073",
                12.9249, 80.1472, 2.45, 106722.0, "Residential", "Residential Zone (R2)",
                "Private Individual", "Karthik Subramanian", "XXXX-XXXX-4819", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 18500000.0,
                14.2, "Low", "Clear title history with seamless geo-cadastral alignment."
        ));

        parcels.add(createParcel(
                "33TNTAM0000234567", "89/2A", "1", "Chennai", "Tambaram", "Chromepet", "600044",
                12.9516, 80.1462, 1.15, 50094.0, "Commercial", "Commercial Mixed Zone",
                "Private Individual", "Sundaramurthy Ramasamy", "XXXX-XXXX-9102", "Paid", 2025,
                "Registered", "Verified", "Clear Title", 24000000.0,
                22.0, "Low", "Fully compliant zoning, no road-widening reservations."
        ));

        parcels.add(createParcel(
                "33TNTAM0000345678", "15/4C", "2", "Chennai", "Tambaram", "Medavakkam", "600100",
                12.9185, 80.1912, 4.80, 209088.0, "Agricultural", "Wet Agricultural (Nanjai)",
                "Joint Ownership", "Meenakshi & Brothers", "XXXX-XXXX-3341", "Arrears", 2023,
                "Registered", "Pending Verification", "Mortgage Active", 32000000.0,
                58.5, "Moderate", "Mortgage registered with Canara Bank; physical boundary verification pending."
        ));

        parcels.add(createParcel(
                "33TNKAN0000456789", "202/1A", "B", "Kanchipuram", "Sriperumbudur", "Irungattukottai", "602105",
                12.9810, 79.9740, 12.50, 544500.0, "Industrial", "SIPCOT Industrial Estate",
                "Corporate", "Apex Logistics Parks Pvt Ltd", "XXXX-XXXX-1100", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 98000000.0,
                12.0, "Low", "Industrial clearance secured; environmental buffer compliant."
        ));

        parcels.add(createParcel(
                "33TNKAN0000567890", "305/7B", "3", "Kanchipuram", "Walajabad", "Thenneri", "631604",
                12.8250, 79.8150, 6.20, 270072.0, "Agricultural", "Dry Agricultural (Punjai)",
                "Private Individual", "Elangovan Duraisamy", "XXXX-XXXX-7721", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 15500000.0,
                18.0, "Low", "No disputes, water-table recharge zone noted."
        ));

        parcels.add(createParcel(
                "33TNCHN0000678901", "412/1", "A", "Chennai", "Guindy", "Alandur", "600016",
                12.9975, 80.2010, 0.85, 37026.0, "Commercial", "IT Corridor Commercial",
                "Corporate", "CyberSpace Properties LLP", "XXXX-XXXX-8822", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 62000000.0,
                8.0, "Low", "Direct arterial road access with metro rail buffer compliance."
        ));

        parcels.add(createParcel(
                "33TNCHN0000789012", "78/5B", "C", "Chennai", "Sholinganallur", "Perungudi", "600096",
                12.9620, 80.2450, 1.75, 76230.0, "Residential", "High-Density Residential",
                "Private Individual", "Lakshmi Narayanan", "XXXX-XXXX-9911", "Arrears", 2024,
                "Registered", "Disputed", "Court Injunction", 28000000.0,
                78.0, "High", "Civil Court injunction OS-402/2024 active; succession contest."
        ));

        parcels.add(createParcel(
                "33TNTAM0000890123", "99/1", "1A", "Chennai", "Tambaram", "Pallavaram", "600043",
                12.9675, 80.1490, 0.95, 41382.0, "Residential", "Residential Zone (R1)",
                "Private Individual", "Mohammed Ismail", "XXXX-XXXX-2244", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 14000000.0,
                10.5, "Low", "Airport zone height NOC verified."
        ));

        parcels.add(createParcel(
                "33TNCHN0000901234", "160/2", "B", "Chennai", "Mylapore", "Mandaveli", "600028",
                13.0280, 80.2610, 0.45, 19602.0, "Residential", "Heritage Urban Residential",
                "Private Individual", "Subramanian Swaminathan", "XXXX-XXXX-6532", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 45000000.0,
                15.0, "Low", "Prime heritage precinct; title trace clear for 60 years."
        ));

        parcels.add(createParcel(
                "33TNTAM0001012345", "210/4", "D", "Chennai", "Tambaram", "Guduvanchery", "603202",
                12.8420, 80.0610, 3.10, 135036.0, "Residential", "Plotted Development Scheme",
                "Private Individual", "Praveen Venkatesan", "XXXX-XXXX-3388", "Paid", 2025,
                "Registered", "Pending Verification", "Clear Title", 21000000.0,
                32.0, "Moderate", "New layout; subdivision survey marker check recommended."
        ));

        // Bengaluru region parcels
        parcels.add(createParcel(
                "29KABNG0001123456", "54/2", "1", "Bengaluru Urban", "Bengaluru South", "Electronic City", "560100",
                12.8452, 77.6602, 3.50, 152460.0, "Commercial", "Tech Hub Commercial",
                "Corporate", "IndoTech Realty Solutions", "XXXX-XXXX-4411", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 85000000.0,
                9.5, "Low", "KIADB sanctioned tech estate; all NOCs in order."
        ));

        parcels.add(createParcel(
                "29KABNG0001234567", "112/3", "A", "Bengaluru Urban", "Yelahanka", "Jakkur", "560064",
                13.0780, 77.6040, 2.10, 91476.0, "Residential", "Lake-Facing Residential",
                "Private Individual", "Giridhar Hegde", "XXXX-XXXX-7700", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 38000000.0,
                24.0, "Low", "Complies with NGT 75-meter lake buffer norms."
        ));

        parcels.add(createParcel(
                "29KABNG0001345678", "88/1", "C", "Bengaluru Urban", "K.R. Puram", "Whitefield", "560066",
                12.9698, 77.7499, 1.80, 78408.0, "Commercial", "Mixed Retail & Office",
                "Private Individual", "Naveen Reddy", "XXXX-XXXX-5522", "Arrears", 2024,
                "Registered", "Pending Verification", "Mortgage Active", 52000000.0,
                48.0, "Moderate", "BBMP property tax arrears; HDFC mortgage recorded."
        ));

        // Pune / Maharashtra parcels
        parcels.add(createParcel(
                "27MHPUN0001456789", "45/2B", "1", "Pune", "Haveli", "Hinjawadi", "411057",
                18.5913, 73.7389, 4.20, 182952.0, "Commercial", "Special Economic Zone (IT)",
                "Corporate", "Synergy IT Parks Corp", "XXXX-XXXX-9933", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 110000000.0,
                11.0, "Low", "MIDC notified industrial IT layout."
        ));

        parcels.add(createParcel(
                "27MHPUN0001567890", "19/3", "A", "Pune", "Mulshi", "Pirangut", "412115",
                18.5080, 73.6820, 7.50, 326700.0, "Agricultural", "Semi-Hilly Horticulture",
                "Private Individual", "Ganesh Kulkarni", "XXXX-XXXX-8811", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 22000000.0,
                17.5, "Low", "Green zone verified; slope gradient within permissible bounds."
        ));

        // Additional parcels to reach 22
        parcels.add(createParcel(
                "33TNCHN0001678901", "24/1", "A", "Chennai", "Tambaram", "Madambakkam", "600126",
                12.8940, 80.1620, 1.40, 60984.0, "Residential", "Low-Rise Residential",
                "Private Individual", "Sivakumar Natarajan", "XXXX-XXXX-1122", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 16800000.0,
                13.0, "Low", "Clear Patta with digitized FMB boundary."
        ));

        parcels.add(createParcel(
                "33TNCHN0001789012", "67/3", "B", "Chennai", "Ambattur", "Padi", "600050",
                13.0920, 80.1780, 0.70, 30492.0, "Industrial", "Small Scale Industrial Zone",
                "Private Individual", "Chandrasekaran M.", "XXXX-XXXX-5544", "Paid", 2025,
                "Registered", "Verified", "Clear Title", 19500000.0,
                14.0, "Low", "Pollution Control Board Orange category NOC granted."
        ));

        parcels.add(createParcel(
                "33TNTAM0001890123", "144/2", "2", "Chennai", "Tambaram", "Perungalathur", "600063",
                12.9050, 80.0980, 2.05, 89298.0, "Residential", "CMDA Approved Plotted Layout",
                "Private Individual", "Deepa Balasubramanian", "XXXX-XXXX-9988", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 29000000.0,
                9.0, "Low", "Direct highway access with approved CMDA layout 44/2021."
        ));

        parcels.add(createParcel(
                "33TNKAN0001901234", "83/1", "A", "Kanchipuram", "Kanchipuram", "Orikkai", "631502",
                12.8120, 79.7120, 5.10, 222156.0, "Agricultural", "Silk Weaving Village Agro Zone",
                "Private Individual", "Venkatesan Chettiar", "XXXX-XXXX-3355", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 14500000.0,
                16.0, "Low", "Traditional weaving family estate; mutation verified."
        ));

        parcels.add(createParcel(
                "33TNCHN0002012345", "102/4", "C", "Chennai", "Alandur", "Adambakkam", "600088",
                12.9880, 80.2030, 0.55, 23958.0, "Residential", "Urban Residential",
                "Private Individual", "Srinivasan Parthasarathy", "XXXX-XXXX-7766", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 23000000.0,
                12.5, "Low", "Within 500m of Adambakkam MRTS railway station."
        ));

        parcels.add(createParcel(
                "33TNTAM0002123456", "312/1", "1", "Chennai", "Tambaram", "Vandalur", "600048",
                12.8910, 80.0810, 8.40, 365904.0, "Forest / Institutional", "Eco-Sensitive Buffer",
                "Government Held", "Tamil Nadu Forest Department", "GOV-DEP-FOREST", "Exempt", 2026,
                "Registered", "Verified", "Clear Title", 68000000.0,
                21.0, "Low", "Zoological park peripheral buffer zone."
        ));

        parcels.add(createParcel(
                "33TNCHN0002234567", "501/2", "B", "Chennai", "T. Nagar", "Thyagaraya Nagar", "600017",
                13.0410, 80.2330, 0.38, 16552.0, "Commercial", "Prime Commercial Retail",
                "Corporate", "Grand Silks & Jewels Real Estate", "XXXX-XXXX-0099", "Paid", 2026,
                "Registered", "Verified", "Clear Title", 72000000.0,
                11.5, "Low", "Premier retail shopping hub with complete structural clearance."
        ));

        parcelRepository.saveAll(parcels);

        // 6. Pre-seed Sample Service Applications across stages
        Parcel mainDemoParcel = parcels.get(0); // 33TNCHN0000123456
        Parcel secondDemoParcel = parcels.get(1); // 33TNTAM0000234567
        Parcel thirdDemoParcel = parcels.get(2); // 33TNTAM0000345678

        // App 1: An older approved application for demo parcel
        ServiceRequest app1 = ServiceRequest.builder()
                .applicationNumber("LS-2026-00001")
                .citizen(citizenUser)
                .parcel(mainDemoParcel)
                .service(s2) // Encumbrance Certificate
                .department(deptReg)
                .status(ApplicationStatus.COMPLETED)
                .citizenRemarks("Need 15-year non-encumbrance certificate for mortgage redemption.")
                .supervisorRemarks("Verified from SRO Tambaram digitised registry. Title clean.")
                .certificateNumber("CERT-20260215-001")
                .certificateUrl("/api/certificates/LS-2026-00001.pdf")
                .certificateGeneratedAt(LocalDateTime.now().minusDays(10))
                .build();
        app1 = serviceRequestRepository.save(app1);

        documentRepository.save(ApplicationDocument.builder()
                .serviceRequest(app1)
                .documentType("Sale Deed")
                .documentName("SaleDeed_2018_Reg412.pdf")
                .fileSize("2.4 MB")
                .verified(true)
                .aiDocumentClassification("REGISTERED_SALE_DEED_MATCH_99%")
                .build());

        // App 2: An existing pending application under Town Planning
        ServiceRequest app2 = ServiceRequest.builder()
                .applicationNumber("LS-2026-00002")
                .citizen(citizenUser)
                .parcel(secondDemoParcel)
                .service(s5) // Building Permission
                .department(deptTown)
                .supervisor(supTown)
                .fieldOfficer(offTown)
                .status(ApplicationStatus.FIELD_VERIFICATION)
                .citizenRemarks("Applying for commercial G+3 floor office layout approval.")
                .supervisorRemarks("Assigned officer for site setback inspection.")
                .build();
        app2 = serviceRequestRepository.save(app2);

        documentRepository.save(ApplicationDocument.builder()
                .serviceRequest(app2)
                .documentType("Sanctioned Site Plan")
                .documentName("SiteBlueprint_Architect_Sign.pdf")
                .fileSize("4.1 MB")
                .verified(false)
                .aiDocumentClassification("ARCHITECTURAL_BLUEPRINT_VALID")
                .build());

        // App 3: Sample field verification completed
        ServiceRequest app3 = ServiceRequest.builder()
                .applicationNumber("LS-2026-00003")
                .citizen(citizenUser)
                .parcel(thirdDemoParcel)
                .service(s3) // Land Conversion
                .department(deptRevenue)
                .supervisor(supervisorUser)
                .fieldOfficer(officerUser)
                .status(ApplicationStatus.VERIFIED)
                .citizenRemarks("Applying for conversion from Nanjai agro to commercial plotting.")
                .supervisorRemarks("Field inspection completed by officer. Reviewing buffer norms.")
                .fieldOfficerRemarks("Site physically surveyed using DGPS. No encroachment on public irrigation canal.")
                .build();
        app3 = serviceRequestRepository.save(app3);

        FieldVerification fv3 = FieldVerification.builder()
                .serviceRequest(app3)
                .fieldOfficer(officerUser)
                .inspectionDate(LocalDateTime.now().minusDays(1))
                .gpsLatitude(thirdDemoParcel.getLatitude())
                .gpsLongitude(thirdDemoParcel.getLongitude())
                .gpsCoordinatesVerified(true)
                .boundaryMatchesRecord(true)
                .encroachmentDetected(false)
                .remarks("Site physically visited. Stones numbered 1 to 4 intact as per FMB sketch 15/4C.")
                .photoUrls("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800")
                .verificationResult("VERIFIED_COMPLIANT")
                .build();
        fieldVerificationRepository.save(fv3);
        app3.setFieldVerification(fv3);
        serviceRequestRepository.save(app3);

        // 7. Seed Notifications
        notificationRepository.save(Notification.builder()
                .recipient(citizenUser)
                .title("Welcome to LandStack DPI Portal")
                .message("Your citizen digital identity has been verified. You can now explore cadastral records and apply for 10+ integrated land services.")
                .type("INFO")
                .referenceId("ONBOARDING")
                .isRead(true)
                .build());

        notificationRepository.save(Notification.builder()
                .recipient(citizenUser)
                .title("Certificate Ready: LS-2026-00001")
                .message("Your Encumbrance Certificate has been approved and issued by the Sub-Registrar.")
                .type("STATUS_UPDATE")
                .referenceId("LS-2026-00001")
                .isRead(false)
                .build());

        notificationRepository.save(Notification.builder()
                .recipient(supervisorUser)
                .title("New Review Task: LS-2026-00003")
                .message("Field Officer Vikramaditya Rao has completed site verification for parcel " + thirdDemoParcel.getUlpin() + ". Final review pending.")
                .type("ACTION_REQUIRED")
                .referenceId("LS-2026-00003")
                .isRead(false)
                .build());

        notificationRepository.save(Notification.builder()
                .recipient(officerUser)
                .title("Inspection Scheduled: LS-2026-00002")
                .message("Assigned for physical site verification at Chromepet (ULPIN: " + secondDemoParcel.getUlpin() + ").")
                .type("ACTION_REQUIRED")
                .referenceId("LS-2026-00002")
                .isRead(false)
                .build());

        // 8. Seed Initial Audit Logs
        auditLogRepository.save(AuditLog.builder()
                .userId(adminUser.getId())
                .userEmail(adminUser.getEmail())
                .role("ADMIN")
                .action("SYSTEM_INITIALIZATION")
                .entityType("SYSTEM")
                .entityId("ROOT")
                .description("LandStack SIH 2026 platform initialized with ULPIN cadastral data layers")
                .ipAddress("127.0.0.1")
                .timestamp(LocalDateTime.now().minusDays(2))
                .build());

        auditLogRepository.save(AuditLog.builder()
                .userId(adminUser.getId())
                .userEmail(adminUser.getEmail())
                .role("ADMIN")
                .action("CREATE_SERVICE")
                .entityType("SERVICE")
                .entityId("SRV-LOC-01")
                .description("Created Land Ownership Certificate service with 7-day SLA")
                .ipAddress("127.0.0.1")
                .timestamp(LocalDateTime.now().minusDays(1))
                .build());

        ensureTenDepartmentsAndServices();
        ensureSampleFieldApplications();
        log.info("Database seeding completed successfully! Pre-seeded {} parcels and {} services.", parcels.size(), 8);
    }

    private Parcel createParcel(
            String ulpin, String surveyNo, String subDiv, String district, String taluk, String village, String pincode,
            double lat, double lng, double areaAcre, double areaSqFt, String landType, String landUse,
            String ownershipStatus, String ownerName, String maskedAadhaar, String taxStatus, int taxYear,
            String regStatus, String verifStatus, String encumbrance, double valuation,
            double aiRisk, String riskCategory, String aiNotes) {

        // Generate realistic GeoJSON polygon around lat, lng
        double delta = 0.0015 * Math.sqrt(areaAcre);
        String geoJson = String.format(
                "{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":[[[%f,%f],[%f,%f],[%f,%f],[%f,%f],[%f,%f]]]},\"properties\":{\"ulpin\":\"%s\",\"surveyNumber\":\"%s\",\"areaAcre\":%f,\"ownerName\":\"%s\"}}",
                lng - delta, lat - delta,
                lng + delta, lat - (delta * 0.7),
                lng + (delta * 1.1), lat + delta,
                lng - delta, lat + (delta * 0.9),
                lng - delta, lat - delta,
                ulpin, surveyNo, areaAcre, ownerName
        );

        return Parcel.builder()
                .ulpin(ulpin)
                .surveyNumber(surveyNo)
                .subDivision(subDiv)
                .district(district)
                .taluk(taluk)
                .village(village)
                .pincode(pincode)
                .latitude(lat)
                .longitude(lng)
                .areaAcre(areaAcre)
                .areaSqFt(areaSqFt)
                .landType(landType)
                .landUse(landUse)
                .ownershipStatus(ownershipStatus)
                .ownerName(ownerName)
                .ownerAadhaarMasked(maskedAadhaar)
                .propertyTaxStatus(taxStatus)
                .lastTaxPaidYear(taxYear)
                .registrationStatus(regStatus)
                .verificationStatus(verifStatus)
                .encumbranceStatus(encumbrance)
                .marketValuationInr(valuation)
                .boundaryGeoJson(geoJson)
                .aiRiskScore(aiRisk)
                .aiRiskCategory(riskCategory)
                .aiRiskNotes(aiNotes)
                .build();
    }

    private void ensureTenDepartmentsAndServices() {
        Department deptRevenue = getOrCreateDept("Revenue", "REV", "Land administration, jamabandi records, patta, mutation, and revenue collection");
        Department deptSurvey = getOrCreateDept("Survey & Land Records", "SRV-LR", "Cadastral surveys, ULPIN geocoding, boundary demarcation, and FMB verification");
        Department deptReg = getOrCreateDept("Registration", "REG", "Deed registration, encumbrance certificates (EC), and legal title conveyancing");
        Department deptTown = getOrCreateDept("Town & Country Planning", "TCP", "Master plan zoning, land-use reclassification, and layout sanction");
        Department deptLocal = getOrCreateDept("Local Body", "LOC-BODY", "Municipal and panchayat local governance, trade licenses, and civic infrastructure");
        Department deptBuilding = getOrCreateDept("Building & Planning", "BLD-PLAN", "Structural blueprint sanction, architectural bylaws appraisal, and building permits");
        Department deptHighways = getOrCreateDept("Highways", "HWY", "Road widening alignments, highway setback verification, and access NOCs");
        Department deptForest = getOrCreateDept("Forest", "FOR", "Ecological buffer zones, reserve forest boundary demarcations, and environmental clearance");
        Department deptElectricity = getOrCreateDept("Electricity", "ELEC", "Power grid connection NOC, transmission line corridor easements, and transformer clearance");
        Department deptWater = getOrCreateDept("Water & Sewerage", "WAT-SEW", "Municipal trunk water supply, drainage network clearance, and effluent discharge NOC");
        Department deptEnv = getOrCreateDept("Environment", "ENV", "Coastal Regulation Zone (CRZ) clearance, wetland conservation, and ecological impact appraisals");

        getOrCreateService("SRV-LOC-01", "Land Ownership Certificate (Patta)",
                "Official statutory certification confirming undisputed ownership and title of the designated parcel.",
                deptRevenue, "Registered Sale Deed, Encumbrance Certificate, Latest Property Tax Receipt, Identity Proof", 7, 150.0);

        getOrCreateService("SRV-CONV-03", "Land Conversion (Agricultural to Non-Agricultural)",
                "Statutory permission for reclassifying agricultural land into residential or commercial layouts.",
                deptRevenue, "Patta/Chitta Extract, FMB Sketch, Soil Quality Certificate, Master Plan Extract", 21, 2500.0);

        getOrCreateService("SRV-MUT-04", "Property Mutation & Jamabandi Entry",
                "Updating buyer title and ownership records in the state jamabandi revenue registers following sale or inheritance.",
                deptRevenue, "Registered Transfer Deed, Death Certificate (if inheritance), No-Calamity Declaration", 14, 300.0);

        getOrCreateService("SRV-SURV-06", "Cadastral Boundary Demarcation & DGPS Survey",
                "On-site physical boundary pegging and differential GPS demarcation to resolve neighbor boundary overlaps.",
                deptSurvey, "Cadastral Field Measurement Book (FMB), Neighbor Notice, Patta", 10, 800.0);

        getOrCreateService("SRV-EC-02", "Encumbrance Certificate (EC)",
                "Certificate detailing all registered financial liabilities, mortgages, and transactions on the parcel for up to 30 years.",
                deptReg, "Previous Deed Copy, Survey Sketch, Aadhaar/Voter ID", 3, 100.0);

        getOrCreateService("SRV-TCP-09", "Master Plan Zoning NOC & Land Reclassification",
                "Comprehensive planning clearance evaluating parcel alignment with master development plan land-use matrices.",
                deptTown, "Site Master Plan Sketch, Patta Extract, Topographical Contour Map", 14, 2000.0);

        getOrCreateService("SRV-TAX-07", "Property Tax Assessment & Municipal Khata Transfer",
                "Apportioning municipal annual ratable value and registering new property owner for local municipal taxes.",
                deptLocal, "Latest Property Tax Receipt, Sale Deed, Completion Certificate", 7, 200.0);

        getOrCreateService("SRV-BLD-05", "Building Permission & Layout Sanction",
                "Technical appraisal and municipal approval of architectural and structural blueprints adhering to building bylaws.",
                deptBuilding, "Approved Site Plan, Structural Engineer Certificate, Soil Investigation Report, Ownership Patta", 15, 4500.0);

        getOrCreateService("SRV-HWY-10", "National & State Highway Access Setback NOC",
                "Statutory clearance verifying ribbon development norms, highway right-of-way (RoW), and safe vehicular access points.",
                deptHighways, "Georeferenced Road Frontage Survey, Access Road Engineering Plan, Patta Copy", 10, 1200.0);

        getOrCreateService("SRV-FOR-11", "Eco-Sensitive Buffer & Reserve Forest Clearance",
                "Ecological compliance verification ensuring parcel boundary is clear of declared forest land and national park buffer perimeters.",
                deptForest, "Cadastral Map with GPS Boundary, Tree Census Extract, Title Document", 21, 1000.0);

        getOrCreateService("SRV-ELEC-12", "High-Tension Corridor NOC & Power Substation Clearance",
                "Right-of-way safety appraisal verifying electrical clearance from high-tension power transmission lines.",
                deptElectricity, "Site Electrical Layout, Power Load Sanction Request, Cadastral FMB Sketch", 7, 750.0);

        getOrCreateService("SRV-UTIL-08", "Water & Sewerage Network NOC",
                "Civic utility clearance for connecting residential/commercial structures to the municipal trunk water mains.",
                deptWater, "Plumbing Layout, Sanctioned Building Plan, Property Tax Receipt", 7, 500.0);

        getOrCreateService("SRV-ENV-13", "Coastal Regulation Zone & Wetland Buffer Clearance",
                "Statutory environmental clearance verifying compliance with CRZ notifications, wetland buffer perimeters, and ecological buffer constraints.",
                deptEnv, "CRZ Cadastral Map with GPS Boundary, High Tide Line (HTL) Demarcation, Environmental Impact Affidavit", 15, 1500.0);

        ensureAllElevenDepartmentOfficersAndApps(deptRevenue, deptSurvey, deptReg, deptTown, deptLocal,
                deptBuilding, deptHighways, deptForest, deptElectricity, deptWater, deptEnv);
    }

    private void ensureAllElevenDepartmentOfficersAndApps(
            Department deptRevenue, Department deptSurvey, Department deptReg, Department deptTown,
            Department deptLocal, Department deptBuilding, Department deptHighways, Department deptForest,
            Department deptElectricity, Department deptWater, Department deptEnv) {

        Role officerRole = roleRepository.findByName(RoleType.FIELD_OFFICER).orElse(null);
        if (officerRole == null) return;

        String demoPassword = passwordEncoder.encode("Demo@123");

        // 1. Revenue Officer & Supervisor synchronization
        Department revDept = departmentRepository.findByName("Revenue & Disaster Management").orElse(deptRevenue);
        User offRev = getOrCreateOfficer("officer.revenue@landstack.demo", "Vikramaditya Rao", "+91 9711223344", revDept, "Senior Cadastral Inspector", "REV-FLD-502", officerRole, demoPassword);
        userRepository.findByEmail("officer@landstack.demo").ifPresent(u -> {
            u.setDepartment(revDept);
            userRepository.save(u);
        });
        userRepository.findByEmail("supervisor@landstack.demo").ifPresent(u -> {
            u.setDepartment(revDept);
            userRepository.save(u);
        });

        // 2. Survey & Land Records Officer
        User offSurv = getOrCreateOfficer("officer.survey@landstack.demo", "Devendra Patil", "+91 9822110022", deptSurvey, "Senior Cadastral Surveyor", "SRV-FLD-101", officerRole, demoPassword);

        // 3. Registration Officer
        User offReg = getOrCreateOfficer("officer.registration@landstack.demo", "Meenakshi Sundaram", "+91 9833221133", deptReg, "Sub-Registrar Field Examiner", "REG-FLD-201", officerRole, demoPassword);

        // 4. Town & Country Planning Officer
        User offTown = getOrCreateOfficer("officer.planning@landstack.demo", "Arun Kumar", "+91 9922334455", deptTown, "Town Planning Inspector", "TCP-FLD-303", officerRole, demoPassword);
        userRepository.findByEmail("officer.urban@landstack.demo").ifPresent(u -> {
            u.setDepartment(deptTown);
            userRepository.save(u);
        });

        // 5. Local Body Officer
        User offLocal = getOrCreateOfficer("officer.localbody@landstack.demo", "Suresh Nair", "+91 9844332244", deptLocal, "Municipal Revenue Inspector", "LOC-FLD-401", officerRole, demoPassword);

        // 6. Building & Planning Officer
        User offBld = getOrCreateOfficer("officer.building@landstack.demo", "Kavita Reddy", "+91 9855443355", deptBuilding, "Assistant Executive Engineer (Building)", "BLD-FLD-501", officerRole, demoPassword);

        // 7. Highways Officer
        User offHwy = getOrCreateOfficer("officer.highways@landstack.demo", "R. Balachander", "+91 9866554466", deptHighways, "Assistant Engineer (NH & PWD)", "HWY-FLD-601", officerRole, demoPassword);

        // 8. Forest Officer
        User offFor = getOrCreateOfficer("officer.forest@landstack.demo", "Manoj Varma", "+91 9877665577", deptForest, "Forest Range Officer", "FOR-FLD-701", officerRole, demoPassword);

        // 9. Electricity Officer
        User offElec = getOrCreateOfficer("officer.electricity@landstack.demo", "N. Venkatesh", "+91 9888776688", deptElectricity, "Assistant Electrical Inspector", "ELEC-FLD-801", officerRole, demoPassword);

        // 10. Water & Sewerage Officer
        User offWat = getOrCreateOfficer("officer.water@landstack.demo", "Priya Natarajan", "+91 9899887799", deptWater, "Assistant Engineer (Water Supply)", "WAT-FLD-901", officerRole, demoPassword);

        // 11. Environment Officer
        User offEnv = getOrCreateOfficer("officer.environment@landstack.demo", "Dr. Swaminathan Iyer", "+91 9811224488", deptEnv, "Environmental Scrutiny Officer", "ENV-FLD-111", officerRole, demoPassword);

        // Now ensure sample applications assigned to each department officer
        List<Parcel> parcels = parcelRepository.findAll();
        if (parcels.isEmpty()) return;
        User citizen = userRepository.findByEmail("citizen@landstack.demo").orElse(null);
        User supervisor = userRepository.findByEmail("supervisor@landstack.demo").orElse(null);
        if (citizen == null) return;

        // Sync all existing revenue applications to revDept and primary officer
        User primaryOfficer = userRepository.findByEmail("officer@landstack.demo").orElse(offRev);
        serviceRequestRepository.findByFieldOfficerOrderByCreatedAtDesc(primaryOfficer).forEach(a -> {
            if (a.getDepartment() == null || !a.getDepartment().getId().equals(revDept.getId())) {
                a.setDepartment(revDept);
                serviceRequestRepository.save(a);
            }
        });

        // 1. Revenue Sample Applications (if offRev)
        ensureSampleApp("REV-2026-000001", citizen, supervisor, offRev, revDept, "SRV-LOC-01", parcels.get(0 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Land ownership title patta inquiry for ancestral plot.",
                "Sale Deed", "Deed_Reg_89_2019.pdf", "INSP-2026-REV01", "Physical Possession & Jamabandi Audit");
        ensureSampleApp("REV-2026-000002", citizen, supervisor, offRev, revDept, "SRV-MUT-04", parcels.get(1 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Mutation of title following registered conveyance.",
                "Encumbrance Certificate", "EC_Statement_2026.pdf", null, null);

        // 2. Survey Applications (3 apps across stages)
        ensureSampleApp("SRV-2026-000101", citizen, supervisor, offSurv, deptSurvey, "SRV-SURV-06", parcels.get(0 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Cadastral boundary demarcation & DGPS survey requested due to neighbor dispute.",
                "Field Measurement Book (FMB)", "FMB_Sketch_Survey_89.pdf", "INSP-2026-SRV01", "Cadastral Boundary Pegging & DGPS Survey");
        ensureSampleApp("SRV-2026-000102", citizen, supervisor, offSurv, deptSurvey, "SRV-SURV-06", parcels.get(1 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "DGPS re-survey of sub-divided plot boundary stones.",
                "FMB Sub-Division Record", "FMB_Subdivision_Extract.pdf", "INSP-2026-SRV02", "DGPS Corner Pegging Verification");
        ensureSampleApp("SRV-2026-000103", citizen, supervisor, offSurv, deptSurvey, "SRV-SURV-06", parcels.get(2 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Cadastral map alignment check against village revenue map.",
                "Village Map Overlay", "Village_Cadastral_Overlay.pdf", null, null);

        // 3. Registration Applications (3 apps)
        ensureSampleApp("REG-2026-000201", citizen, supervisor, offReg, deptReg, "SRV-EC-02", parcels.get(1 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Encumbrance search for past 30 years following proposed sale conveyance.",
                "Encumbrance Statement", "EC_30_Year_Statement.pdf", null, null);
        ensureSampleApp("REG-2026-000202", citizen, supervisor, offReg, deptReg, "SRV-EC-02", parcels.get(3 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Title conveyancing document review and valuation check.",
                "Registered Sale Deed", "Conveyance_Deed_Copy.pdf", "INSP-2026-REG01", "Market Valuation & Title Conveyancing Audit");
        ensureSampleApp("REG-2026-000203", citizen, supervisor, offReg, deptReg, "SRV-EC-02", parcels.get(4 % parcels.size()),
                ApplicationStatus.FORWARDED_TO_AUTHORITY, "Statutory 15-year non-encumbrance certificate issuance.",
                "Nil-Encumbrance Extract", "EC_Extract_Digitized.pdf", null, null);

        // 4. Town Planning Applications (3 apps)
        ensureSampleApp("TCP-2026-000301", citizen, supervisor, offTown, deptTown, "SRV-TCP-09", parcels.get(4 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Master plan zoning NOC & land reclassification from agricultural to commercial.",
                "Master Plan Layout", "Master_Plan_Zoning_Extract.pdf", "INSP-2026-TCP01", "Master Plan Zoning & Land-Use Matrix Audit");
        ensureSampleApp("TCP-2026-000302", citizen, supervisor, offTown, deptTown, "SRV-TCP-09", parcels.get(5 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "Zoning setback audit for 40ft road widening master plan.",
                "Zoning Contour Map", "Zoning_Contour_Plan.pdf", "INSP-2026-TCP02", "Road Widening Corridor Alignment");
        ensureSampleApp("TCP-2026-000303", citizen, supervisor, offTown, deptTown, "SRV-TCP-09", parcels.get(6 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Layout approval verification against regional comprehensive development plan.",
                "Layout Master Plan", "Layout_Sanction_Drawings.pdf", null, null);

        // 5. Local Body Applications (3 apps)
        ensureSampleApp("LOC-2026-000401", citizen, supervisor, offLocal, deptLocal, "SRV-TAX-07", parcels.get(2 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Property tax assessment & municipal khata transfer application following inheritance.",
                "Property Tax Receipt", "Latest_Tax_Receipt.pdf", "INSP-2026-LOC01", "Plinth Area & Ratable Value Audit");
        ensureSampleApp("LOC-2026-000402", citizen, supervisor, offLocal, deptLocal, "SRV-TAX-07", parcels.get(7 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Municipal ward assessment and building dimension re-verification.",
                "Assessment Extract", "Ward_Assessment_Record.pdf", null, null);
        ensureSampleApp("LOC-2026-000403", citizen, supervisor, offLocal, deptLocal, "SRV-TAX-07", parcels.get(8 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "Trade license and municipal boundary clearance inspection.",
                "Site Survey Plan", "Municipal_Site_Sketch.pdf", "INSP-2026-LOC02", "Municipal Boundary & Civic Drainage Audit");

        // 6. Building & Planning Applications (3 apps)
        ensureSampleApp("BLD-2026-000501", citizen, supervisor, offBld, deptBuilding, "SRV-BLD-05", parcels.get(3 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Building layout permission sanction for G+2 residential apartment.",
                "Architectural Blueprint", "Sanctioned_Site_Plan.pdf", "INSP-2026-BLD01", "Architectural Blueprint & Setback Verification");
        ensureSampleApp("BLD-2026-000502", citizen, supervisor, offBld, deptBuilding, "SRV-BLD-05", parcels.get(9 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Structural engineering safety certificate and bylaws scrutiny.",
                "Structural Stability Certificate", "Structural_Calculation_Sheet.pdf", null, null);
        ensureSampleApp("BLD-2026-000503", citizen, supervisor, offBld, deptBuilding, "SRV-BLD-05", parcels.get(10 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "Front and rear setback verification conforming to NBC norms.",
                "Site Elevation Blueprint", "Building_Elevation_CrossSection.pdf", "INSP-2026-BLD02", "National Building Code Setback Survey");

        // 7. Highways Applications (3 apps)
        ensureSampleApp("HWY-2026-000601", citizen, supervisor, offHwy, deptHighways, "SRV-HWY-10", parcels.get(5 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Highway access setback clearance for proposed commercial entrance on NH-45.",
                "Frontage Survey", "NH45_Frontage_Survey.pdf", "INSP-2026-HWY01", "Highway Right-of-Way & Ribbon Setback Audit");
        ensureSampleApp("HWY-2026-000602", citizen, supervisor, offHwy, deptHighways, "SRV-HWY-10", parcels.get(11 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Median cut access and deceleration lane geometric approval.",
                "Traffic Impact Assessment", "Traffic_Circulation_Plan.pdf", null, null);
        ensureSampleApp("HWY-2026-000603", citizen, supervisor, offHwy, deptHighways, "SRV-HWY-10", parcels.get(12 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "State highway corridor buffer clearance inspection.",
                "Corridor Survey Sketch", "State_Highway_Setback_Map.pdf", "INSP-2026-HWY02", "Highway Roadway Buffer Pegging Audit");

        // 8. Forest Applications (3 apps)
        ensureSampleApp("FOR-2026-000701", citizen, supervisor, offFor, deptForest, "SRV-FOR-11", parcels.get(6 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Eco-sensitive buffer clearance for perimeter adjoining Tambaram reserve forest.",
                "Forest Cadastral Overlay", "Forest_Buffer_GPS_Map.pdf", "INSP-2026-FOR01", "Forest Boundary & Eco-Sensitive Zone Margin Survey");
        ensureSampleApp("FOR-2026-000702", citizen, supervisor, offFor, deptForest, "SRV-FOR-11", parcels.get(13 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Non-forest land certificate and tree preservation scrutiny.",
                "Tree Census Report", "Tree_Preservation_Affidavit.pdf", null, null);
        ensureSampleApp("FOR-2026-000703", citizen, supervisor, offFor, deptForest, "SRV-FOR-11", parcels.get(14 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "Reserve forest peripheral buffer stone verification.",
                "Reserve Forest Demarcation Map", "Reserve_Forest_Pillar_Survey.pdf", "INSP-2026-FOR02", "Forest Peripheral Demarcation Pillars Audit");

        // 9. Electricity Applications (3 apps)
        ensureSampleApp("ELEC-2026-000801", citizen, supervisor, offElec, deptElectricity, "SRV-ELEC-12", parcels.get(7 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "High-tension corridor NOC for 110kV transmission line proximity safety margin.",
                "Electrical Layout", "Grid_Clearance_Plan.pdf", "INSP-2026-ELEC01", "High-Tension Transmission Corridor Survey");
        ensureSampleApp("ELEC-2026-000802", citizen, supervisor, offElec, deptElectricity, "SRV-ELEC-12", parcels.get(15 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Substation feeder line easement and safety corridor audit.",
                "Substation Feeder Diagram", "Substation_Feeder_Route.pdf", "INSP-2026-ELEC02", "Substation Feeder Easement Survey");
        ensureSampleApp("ELEC-2026-000803", citizen, supervisor, offElec, deptElectricity, "SRV-ELEC-12", parcels.get(16 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Distribution transformer clearance request for commercial layout.",
                "Transformer Installation Plan", "Transformer_Clearance_Drawing.pdf", null, null);

        // 10. Water & Sewerage Applications (3 apps)
        ensureSampleApp("WAT-2026-000901", citizen, supervisor, offWat, deptWater, "SRV-UTIL-08", parcels.get(8 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Water and sewerage connection NOC for newly constructed commercial complex.",
                "Plumbing Layout", "Plumbing_Network_Plan.pdf", "INSP-2026-WAT01", "Civic Utility Mains & Hydraulic Gradient Survey");
        ensureSampleApp("WAT-2026-000902", citizen, supervisor, offWat, deptWater, "SRV-UTIL-08", parcels.get(17 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "Water pipeline trunk main tapping feasibility scrutiny.",
                "Municipal Pipeline Sketch", "Water_Main_Connection_Detail.pdf", null, null);
        ensureSampleApp("WAT-2026-000903", citizen, supervisor, offWat, deptWater, "SRV-UTIL-08", parcels.get(18 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "Stormwater discharge gradient and sewerage outlet inspection.",
                "Drainage Network Blueprint", "Drainage_Gradient_Blueprint.pdf", "INSP-2026-WAT02", "Stormwater & Effluent Gradient Verification");

        // 11. Environment Applications (3 apps)
        ensureSampleApp("ENV-2026-001101", citizen, supervisor, offEnv, deptEnv, "SRV-ENV-13", parcels.get(9 % parcels.size()),
                ApplicationStatus.FIELD_VERIFICATION, "Coastal Regulation Zone & wetland buffer clearance certificate for eco-tourism layout.",
                "CRZ Demarcation Map", "CRZ_Cadastral_Overlay.pdf", "INSP-2026-ENV01", "CRZ Classification & Wetland Buffer Audit");
        ensureSampleApp("ENV-2026-001102", citizen, supervisor, offEnv, deptEnv, "SRV-ENV-13", parcels.get(19 % parcels.size()),
                ApplicationStatus.DOCUMENT_VERIFICATION, "High Tide Line (HTL) 500m buffer compliance affidavit review.",
                "HTL Demarcation Affidavit", "HTL_500m_Compliance_Affidavit.pdf", null, null);
        ensureSampleApp("ENV-2026-001103", citizen, supervisor, offEnv, deptEnv, "SRV-ENV-13", parcels.get(20 % parcels.size()),
                ApplicationStatus.INSPECTION_COMPLETED, "Wetland catchment protection area on-site verification.",
                "National Wetlands Atlas Map", "Wetland_Boundary_GPS_Survey.pdf", "INSP-2026-ENV02", "National Wetland Atlas Catchment Verification");
    }

    private User getOrCreateOfficer(String email, String fullName, String mobile, Department dept, String designation, String employeeCode, Role officerRole, String encodedPassword) {
        return userRepository.findByEmail(email).map(existing -> {
            existing.setDepartment(dept);
            existing.setDesignation(designation);
            existing.setEmployeeCode(employeeCode);
            existing.setFullName(fullName);
            return userRepository.save(existing);
        }).orElseGet(() -> userRepository.save(User.builder()
                .email(email)
                .fullName(fullName)
                .mobile(mobile)
                .password(encodedPassword)
                .role(officerRole)
                .department(dept)
                .designation(designation)
                .employeeCode(employeeCode)
                .active(true)
                .build()));
    }

    private void ensureSampleApp(String appNumber, User citizen, User supervisor, User officer, Department dept,
                                 String serviceCode, Parcel parcel, ApplicationStatus status, String remarks,
                                 String docType, String docName, String inspNumber, String inspType) {
        if (serviceRequestRepository.findByApplicationNumber(appNumber).isPresent()) {
            return;
        }

        ServiceEntity srv = serviceRepository.findByServiceCode(serviceCode).orElse(null);
        if (srv == null) return;

        ServiceRequest app = serviceRequestRepository.save(ServiceRequest.builder()
                .applicationNumber(appNumber)
                .citizen(citizen)
                .parcel(parcel)
                .service(srv)
                .department(dept)
                .supervisor(supervisor)
                .fieldOfficer(officer)
                .status(status)
                .citizenRemarks(remarks)
                .supervisorRemarks("Assigned to " + officer.getFullName() + " for department review and verification.")
                .build());

        if (docType != null && docName != null) {
            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType(docType)
                    .documentName(docName)
                    .fileSize("2.4 MB")
                    .verified(true)
                    .verificationStatus("VERIFIED")
                    .verifiedBy(officer.getFullName())
                    .verifiedAt(LocalDateTime.now().minusDays(1))
                    .officerRemark("Verified with statutory records. Conforms to requirements.")
                    .aiDocumentClassification("OFFICIAL_RECORD_AUTHENTIC")
                    .build());
        }

        if (inspNumber != null && inspType != null) {
            FieldVerification fv = FieldVerification.builder()
                    .serviceRequest(app)
                    .fieldOfficer(officer)
                    .inspectionNumber(inspNumber)
                    .inspectionType(inspType)
                    .scheduledDate(LocalDateTime.now().plusDays(1))
                    .status("SCHEDULED")
                    .remarks("Scheduled on-site verification visit.")
                    .verificationResult("PENDING_FIELD_VISIT")
                    .build();
            fv = fieldVerificationRepository.save(fv);
            app.setFieldVerification(fv);
            serviceRequestRepository.save(app);
        }
    }

    private Department getOrCreateDept(String name, String code, String description) {
        return departmentRepository.findByName(name)
                .orElseGet(() -> departmentRepository.findByCode(code)
                        .orElseGet(() -> {
                            for (Department d : departmentRepository.findAll()) {
                                String exName = d.getName() != null ? d.getName().trim().toLowerCase() : "";
                                String target = name.trim().toLowerCase();
                                if ((target.contains("revenue") && exName.contains("revenue")) ||
                                    (target.contains("survey") && exName.contains("survey")) ||
                                    (target.contains("registration") && exName.contains("registration")) ||
                                    ((target.contains("town") || target.contains("planning")) && (exName.contains("town") || exName.contains("planning"))) ||
                                    ((target.contains("local") || target.contains("municipal")) && (exName.contains("local") || exName.contains("municipal")))) {
                                    return d;
                                }
                            }
                            return departmentRepository.save(Department.builder()
                                    .name(name)
                                    .code(code)
                                    .description(description)
                                    .active(true)
                                    .build());
                        }));
    }

    private ServiceEntity getOrCreateService(String code, String name, String desc, Department dept, String docs, int days, double fee) {
        return serviceRepository.findByServiceCode(code)
                .map(existing -> {
                    existing.setServiceName(name);
                    existing.setDescription(desc);
                    existing.setDepartment(dept);
                    return serviceRepository.save(existing);
                })
                .orElseGet(() -> serviceRepository.save(ServiceEntity.builder()
                        .serviceCode(code)
                        .serviceName(name)
                        .description(desc)
                        .department(dept)
                        .requiredDocuments(docs)
                        .processingDays(days)
                        .feeInr(fee)
                        .active(true)
                        .build()));
    }

    private void ensureSampleFieldApplications() {
        if (serviceRequestRepository.findByApplicationNumber("PT-2026-88192031").isPresent()) {
            return;
        }

        User officerUser = userRepository.findByEmail("officer@landstack.demo").orElse(null);
        User supervisorUser = userRepository.findByEmail("supervisor@landstack.demo").orElse(null);
        User citizenUser = userRepository.findByEmail("citizen@landstack.demo").orElse(null);

        if (officerUser == null || citizenUser == null) {
            return;
        }

        Department deptRev = departmentRepository.findByName("Revenue & Disaster Management").orElse(officerUser.getDepartment());
        Department deptSurv = departmentRepository.findByName("Survey & Settlement").orElse(deptRev);
        Department deptHwy = departmentRepository.findByName("Highways & Public Works").orElse(deptRev);
        Department deptElec = departmentRepository.findByName("Energy & Power Utilities").orElse(deptRev);

        ServiceEntity sPatta = serviceRepository.findByServiceCode("SRV-LOC-01").orElse(null);
        ServiceEntity sSurv = serviceRepository.findByServiceCode("SRV-SURV-06").orElse(null);
        ServiceEntity sHwy = serviceRepository.findByServiceCode("SRV-HWY-10").orElse(null);
        ServiceEntity sConv = serviceRepository.findByServiceCode("SRV-CONV-03").orElse(null);
        ServiceEntity sElec = serviceRepository.findByServiceCode("SRV-ELEC-12").orElse(null);
        ServiceEntity sMut = serviceRepository.findByServiceCode("SRV-MUT-04").orElse(null);

        List<Parcel> allParcels = parcelRepository.findAll();
        if (allParcels.isEmpty()) {
            return;
        }

        Parcel p1 = allParcels.get(0);
        Parcel p2 = allParcels.size() > 1 ? allParcels.get(1) : p1;
        Parcel p3 = allParcels.size() > 2 ? allParcels.get(2) : p1;
        Parcel p4 = allParcels.size() > 3 ? allParcels.get(3) : p1;
        Parcel p5 = allParcels.size() > 4 ? allParcels.get(4) : p1;
        Parcel p6 = allParcels.size() > 5 ? allParcels.get(5) : p1;

        // 1. PT-2026-88192031 - Document Verification pending
        if (sPatta != null) {
            ServiceRequest app = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("PT-2026-88192031")
                    .citizen(citizenUser)
                    .parcel(p1)
                    .service(sPatta)
                    .department(deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.DOCUMENT_VERIFICATION)
                    .citizenRemarks("Applying for fresh computerized e-Patta with updated sub-division record.")
                    .supervisorRemarks("Assigned to Field Officer for document audit and boundary check.")
                    .build());

            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType("Registered Sale Deed")
                    .documentName("Sale_Deed_Doc_412_2022.pdf")
                    .fileSize("2.8 MB")
                    .verified(true)
                    .verificationStatus("VERIFIED")
                    .verifiedBy(officerUser.getFullName())
                    .verifiedAt(LocalDateTime.now().minusHours(4))
                    .officerRemark("Verified with Sub-Registrar records. Clear consideration and schedule.")
                    .aiDocumentClassification("DEED_AUTHENTIC_99%")
                    .build());

            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType("Encumbrance Certificate")
                    .documentName("EC_Statement_15Years.pdf")
                    .fileSize("1.4 MB")
                    .verified(false)
                    .verificationStatus("NOT_VERIFIED")
                    .officerRemark("Pending verification against SRO online register.")
                    .aiDocumentClassification("EC_30YR_SCAN_95%")
                    .build());

            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType("Property Tax Receipt")
                    .documentName("Latest_Tax_Receipt_FY25.pdf")
                    .fileSize("890 KB")
                    .verified(false)
                    .verificationStatus("NOT_VERIFIED")
                    .officerRemark("Receipt date verification needed.")
                    .aiDocumentClassification("MUNICIPAL_TAX_RECEIPT")
                    .build());
        }

        // 2. SURV-2026-44120982 - Field Inspection scheduled for TODAY
        if (sSurv != null) {
            ServiceRequest app = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("SURV-2026-44120982")
                    .citizen(citizenUser)
                    .parcel(p2)
                    .service(sSurv)
                    .department(deptSurv != null ? deptSurv : deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.FIELD_VERIFICATION)
                    .citizenRemarks("Boundary dispute with southern adjacent parcel. Requesting official DGPS pegging.")
                    .supervisorRemarks("Priority field inspection sanctioned. Verify FMB corner stones.")
                    .build());

            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType("Field Measurement Book (FMB)")
                    .documentName("FMB_Sketch_Survey_89.pdf")
                    .fileSize("3.2 MB")
                    .verified(true)
                    .verificationStatus("VERIFIED")
                    .verifiedBy(officerUser.getFullName())
                    .verifiedAt(LocalDateTime.now().minusDays(1))
                    .officerRemark("Digitized FMB matches state cadastral repository.")
                    .aiDocumentClassification("FMB_CADASTRE_VERIFIED")
                    .build());

            FieldVerification fv = FieldVerification.builder()
                    .serviceRequest(app)
                    .fieldOfficer(officerUser)
                    .inspectionNumber("INSP-2026-00412")
                    .inspectionType("Cadastral Boundary Pegging & DGPS Demarcation")
                    .scheduledDate(LocalDateTime.now().plusHours(3))
                    .status("SCHEDULED")
                    .remarks("Scheduled on-site visit for DGPS pegging and boundary stone check.")
                    .verificationResult("PENDING_FIELD_VISIT")
                    .build();
            fv = fieldVerificationRepository.save(fv);
            app.setFieldVerification(fv);
            serviceRequestRepository.save(app);
        }

        // 3. HWY-2026-33910245 - Overdue Inspection
        if (sHwy != null) {
            ServiceRequest app = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("HWY-2026-33910245")
                    .citizen(citizenUser)
                    .parcel(p3)
                    .service(sHwy)
                    .department(deptHwy != null ? deptHwy : deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.FIELD_VERIFICATION)
                    .citizenRemarks("Seeking highway access setback clearance for proposed commercial entrance.")
                    .supervisorRemarks("Verify NH right-of-way 45m setback from center line.")
                    .build());

            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType("Georeferenced Road Frontage Survey")
                    .documentName("Frontage_Survey_Plan.pdf")
                    .fileSize("4.5 MB")
                    .verified(true)
                    .verificationStatus("VERIFIED")
                    .verifiedBy(officerUser.getFullName())
                    .verifiedAt(LocalDateTime.now().minusDays(3))
                    .officerRemark("Survey contours match NHAI road chainage markers.")
                    .aiDocumentClassification("ROAD_FRONTAGE_GEOMAP")
                    .build());

            FieldVerification fv = FieldVerification.builder()
                    .serviceRequest(app)
                    .fieldOfficer(officerUser)
                    .inspectionNumber("INSP-2026-00389")
                    .inspectionType("Highway Right-of-Way & Ribbon Setback Audit")
                    .scheduledDate(LocalDateTime.now().minusDays(2))
                    .status("SCHEDULED")
                    .remarks("Inspection delayed due to heavy rain; rescheduling priority visit.")
                    .verificationResult("PENDING_FIELD_VISIT")
                    .build();
            fv = fieldVerificationRepository.save(fv);
            app.setFieldVerification(fv);
            serviceRequestRepository.save(app);
        }

        // 4. CONV-2026-77820194 - Clarification Required
        if (sConv != null) {
            ServiceRequest app = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("CONV-2026-77820194")
                    .citizen(citizenUser)
                    .parcel(p4)
                    .service(sConv)
                    .department(deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.CLARIFICATION_REQUIRED)
                    .citizenRemarks("Agricultural to residential layout conversion request.")
                    .fieldOfficerRemarks("[CLARIFICATION REQUIRED - DOCUMENT_DEFICIENCY]: Upload revised NABL accredited soil lab test report with micro-nutrient and flood vulnerability analysis.")
                    .build());

            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType("Soil Quality Certificate")
                    .documentName("Soil_Report_Local_Lab.pdf")
                    .fileSize("1.1 MB")
                    .verified(false)
                    .verificationStatus("REQUIRES_CLARIFICATION")
                    .officerRemark("Certificate missing NABL accreditation stamp.")
                    .aiDocumentClassification("SOIL_TEST_DOC")
                    .build());
        }

        // 5. ELEC-2026-90184423 - Inspection Completed (Report Pending Forwarding)
        if (sElec != null) {
            ServiceRequest app = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("ELEC-2026-90184423")
                    .citizen(citizenUser)
                    .parcel(p5)
                    .service(sElec)
                    .department(deptElec != null ? deptElec : deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.INSPECTION_COMPLETED)
                    .citizenRemarks("Requesting NOC for HT transmission tower safety perimeter.")
                    .fieldOfficerRemarks("Physical inspection completed. Measured distance from 110kV tower centerline exceeds safety norm.")
                    .build());

            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType("Site Electrical Layout")
                    .documentName("Electrical_Clearance_Grid.pdf")
                    .fileSize("2.2 MB")
                    .verified(true)
                    .verificationStatus("VERIFIED")
                    .verifiedBy(officerUser.getFullName())
                    .verifiedAt(LocalDateTime.now().minusDays(1))
                    .officerRemark("Safety clearance diagram matches substation grid alignment.")
                    .aiDocumentClassification("ELECTRICAL_SCHEMATIC")
                    .build());

            FieldVerification fv = FieldVerification.builder()
                    .serviceRequest(app)
                    .fieldOfficer(officerUser)
                    .inspectionNumber("INSP-2026-00405")
                    .inspectionType("High-Tension Corridor Clearance Survey")
                    .inspectionDate(LocalDateTime.now().minusHours(3))
                    .gpsLatitude(p5.getLatitude())
                    .gpsLongitude(p5.getLongitude())
                    .gpsAccuracy(2.8)
                    .gpsCoordinatesVerified(true)
                    .boundaryMatchesRecord(true)
                    .encroachmentDetected(false)
                    .officerFinding("Verified with Remarks")
                    .remarks("Physical clearance from 110kV tower centerline measured at 24.8m. Complies with 22m standard.")
                    .photoUrls("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800")
                    .verificationResult("VERIFIED_COMPLIANT")
                    .status("COMPLETED")
                    .build();
            fv = fieldVerificationRepository.save(fv);
            app.setFieldVerification(fv);
            serviceRequestRepository.save(app);
        }

        // 6. MUT-2026-66231908 - Forwarded to Authority
        if (sMut != null) {
            ServiceRequest app = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("MUT-2026-66231908")
                    .citizen(citizenUser)
                    .parcel(p6)
                    .service(sMut)
                    .department(deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.FORWARDED_TO_AUTHORITY)
                    .citizenRemarks("Mutation request following registered sale deed 144/2025.")
                    .fieldOfficerRemarks("Physical boundary verified on ground. Possession verified with neighbors. Recommended for final approval.")
                    .build());

            documentRepository.save(ApplicationDocument.builder()
                    .serviceRequest(app)
                    .documentType("Registered Transfer Deed")
                    .documentName("Deed_Reg_144_2025.pdf")
                    .fileSize("3.0 MB")
                    .verified(true)
                    .verificationStatus("VERIFIED")
                    .verifiedBy(officerUser.getFullName())
                    .verifiedAt(LocalDateTime.now().minusDays(2))
                    .officerRemark("Duly registered deed verified with SRO.")
                    .aiDocumentClassification("TRANSFER_DEED")
                    .build());

            FieldVerification fv = FieldVerification.builder()
                    .serviceRequest(app)
                    .fieldOfficer(officerUser)
                    .inspectionNumber("INSP-2026-00378")
                    .inspectionType("Physical Possession & Jamabandi Field Audit")
                    .inspectionDate(LocalDateTime.now().minusDays(2))
                    .gpsLatitude(p6.getLatitude())
                    .gpsLongitude(p6.getLongitude())
                    .gpsAccuracy(1.9)
                    .gpsCoordinatesVerified(true)
                    .boundaryMatchesRecord(true)
                    .encroachmentDetected(false)
                    .officerFinding("Verified")
                    .remarks("Owner in undisputed possession of land. No boundary conflict.")
                    .photoUrls("https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800")
                    .verificationResult("VERIFIED_COMPLIANT")
                    .status("FORWARDED")
                    .build();
            fv = fieldVerificationRepository.save(fv);
            app.setFieldVerification(fv);
            serviceRequestRepository.save(app);
        }

        // 7. Assigned to Officer (Awaiting Officer processing)
        if (sConv != null) {
            ServiceRequest appAssigned = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("ASN-2026-551988")
                    .citizen(citizenUser)
                    .parcel(p1)
                    .service(sConv)
                    .department(deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.ASSIGNED_TO_OFFICER)
                    .citizenRemarks("Application for sub-division zoning review.")
                    .supervisorRemarks("[ASSIGNED TO OFFICER]: Priority: HIGH | Conduct physical measurement of road frontage.")
                    .build());
        }

        // 8. Correction Required (Returned by Supervisor to Officer)
        if (sSurv != null) {
            ServiceRequest appCorr = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("CORR-2026-441209")
                    .citizen(citizenUser)
                    .parcel(p2)
                    .service(sSurv)
                    .department(deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.CORRECTION_REQUIRED)
                    .citizenRemarks("Cadastral boundary demarcation request.")
                    .supervisorRemarks("[CORRECTION REQUIRED]: Reason: GPS coordinate variance exceeds 0.2m against FMB. | Correction: Re-calibrate with CORS base and re-measure north-east corner peg.")
                    .build());
        }

        // 9. Escalated Case (Referred by Supervisor to Admin)
        if (sHwy != null) {
            ServiceRequest appEsc = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("ESC-2026-339812")
                    .citizen(citizenUser)
                    .parcel(p3)
                    .service(sHwy)
                    .department(deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.ESCALATED)
                    .citizenRemarks("Request for highway access median cut clearance.")
                    .supervisorRemarks("[ESCALATED TO ADMIN]: Case ID: ESC-20260923-0003 | Issue: STATUTORY_JURISDICTION_CONFLICT | Priority: URGENT | State Highway buffer overlaps with National Highway Authority jurisdiction. Requires Secretary-level clearance.")
                    .build());
        }

        // 10. Rejected Application (With statutory reason)
        if (sMut != null) {
            ServiceRequest appRej = serviceRequestRepository.save(ServiceRequest.builder()
                    .applicationNumber("REJ-2026-110943")
                    .citizen(citizenUser)
                    .parcel(p4)
                    .service(sMut)
                    .department(deptRev)
                    .supervisor(supervisorUser)
                    .fieldOfficer(officerUser)
                    .status(ApplicationStatus.REJECTED)
                    .citizenRemarks("Mutation request under disputed title.")
                    .supervisorRemarks("[REJECTED BY SUPERVISOR]: Reason: Sub-judice property dispute pending before Hon'ble High Court in W.P. No. 18412/2024. Inadmissible under Section 22-A of Registration Act.")
                    .rejectionReason("Sub-judice property dispute pending before High Court (W.P. No. 18412/2024).")
                    .build());
        }

        log.info("Successfully seeded 10 realistic field officer applications across all supervisor lifecycle stages.");
    }
}

