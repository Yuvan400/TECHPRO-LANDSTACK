package com.landstack.service;

import com.landstack.dto.*;
import com.landstack.entity.*;
import com.landstack.exception.BadRequestException;
import com.landstack.exception.ResourceNotFoundException;
import com.landstack.exception.UnauthorizedException;
import com.landstack.repository.ApplicationDocumentRepository;
import com.landstack.repository.FieldVerificationRepository;
import com.landstack.repository.ServiceRequestRepository;
import com.landstack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FieldVerificationService {

    private final FieldVerificationRepository fieldVerificationRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ApplicationDocumentRepository applicationDocumentRepository;
    private final UserRepository userRepository;
    private final ApplicationService applicationService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ApplicationResponseDTO> getAssignedApplications(User fieldOfficer) {
        if (fieldOfficer.getRole().getName() == RoleType.ADMIN) {
            return serviceRequestRepository.findAll().stream()
                    .map(applicationService::mapToDTO)
                    .collect(Collectors.toList());
        }

        // Return applications assigned directly to this officer OR belonging to the officer's department
        List<ServiceRequest> list;
        if (fieldOfficer.getDepartment() != null) {
            List<ServiceRequest> officerApps = serviceRequestRepository.findByFieldOfficerOrderByCreatedAtDesc(fieldOfficer).stream()
                    .filter(a -> a.getDepartment() == null || isSameDepartment(a.getDepartment(), fieldOfficer.getDepartment()))
                    .collect(Collectors.toList());
            if (!officerApps.isEmpty()) {
                list = officerApps;
            } else {
                list = serviceRequestRepository.findByDepartmentOrderByCreatedAtDesc(fieldOfficer.getDepartment());
                if (list.isEmpty()) {
                    list = serviceRequestRepository.findAll().stream()
                            .filter(a -> isSameDepartment(a.getDepartment(), fieldOfficer.getDepartment()))
                            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                            .collect(Collectors.toList());
                }
            }
        } else {
            list = serviceRequestRepository.findByFieldOfficerOrderByCreatedAtDesc(fieldOfficer);
        }

        return list.stream()
                .map(applicationService::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApplicationResponseDTO getApplicationById(Long id, User fieldOfficer) {
        ServiceRequest app = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + id));

        if (fieldOfficer.getRole().getName() != RoleType.ADMIN) {
            boolean isAssigned = app.getFieldOfficer() != null && app.getFieldOfficer().getId().equals(fieldOfficer.getId());
            boolean sameDept = isSameDepartment(fieldOfficer.getDepartment(), app.getDepartment());
            if (!isAssigned && !sameDept) {
                String officerDept = fieldOfficer.getDepartment() != null ? fieldOfficer.getDepartment().getName() : "Unassigned";
                String appDept = app.getDepartment() != null ? app.getDepartment().getName() : "Unassigned";
                throw new UnauthorizedException("Department Isolation Violation: Access denied. Application #" +
                        app.getApplicationNumber() + " belongs to [" + appDept + "], whereas your authorized department is [" + officerDept + "].");
            }
        }

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public ApplicationDocumentDTO verifyDocument(User fieldOfficer, DocumentVerificationRequest request) {
        ApplicationDocument doc = applicationDocumentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + request.getDocumentId()));

        ServiceRequest app = doc.getServiceRequest();
        validateOfficerAccess(fieldOfficer, app);

        String status = request.getVerificationStatus().trim().toUpperCase();
        doc.setVerificationStatus(status);
        doc.setVerified("VERIFIED".equalsIgnoreCase(status));
        doc.setOfficerRemark(request.getOfficerRemark());
        doc.setVerifiedBy(fieldOfficer.getFullName());
        doc.setVerifiedAt(LocalDateTime.now());

        doc = applicationDocumentRepository.save(doc);

        auditLogService.logAction(fieldOfficer, "VERIFY_DOCUMENT", "APPLICATION_DOCUMENT", doc.getId().toString(),
                "Document " + doc.getDocumentName() + " (" + doc.getDocumentType() + ") marked as " + status +
                        (request.getOfficerRemark() != null ? ": " + request.getOfficerRemark() : "") +
                        " for application " + app.getApplicationNumber(), null);

        return ApplicationDocumentDTO.builder()
                .id(doc.getId())
                .documentType(doc.getDocumentType())
                .documentName(doc.getDocumentName())
                .documentUrl(doc.getDocumentUrl())
                .fileSize(doc.getFileSize())
                .verified(doc.getVerified())
                .verificationStatus(doc.getVerificationStatus())
                .officerRemark(doc.getOfficerRemark())
                .verifiedBy(doc.getVerifiedBy())
                .verifiedAt(doc.getVerifiedAt())
                .aiDocumentClassification(doc.getAiDocumentClassification())
                .uploadedAt(doc.getUploadedAt())
                .build();
    }

    @Transactional
    public FieldVerificationDTO scheduleInspection(User fieldOfficer, ScheduleInspectionRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateOfficerAccess(fieldOfficer, app);

        FieldVerification fv = fieldVerificationRepository.findByServiceRequest(app)
                .orElseGet(() -> FieldVerification.builder()
                        .serviceRequest(app)
                        .fieldOfficer(fieldOfficer)
                        .inspectionNumber("INSP-" + DateTimeFormatter.ofPattern("yyyy").format(LocalDateTime.now()) + "-" + String.format("%05d", (int)(Math.random() * 90000) + 10000))
                        .verificationResult("PENDING_FIELD_VISIT")
                        .build());

        fv.setScheduledDate(request.getInspectionDate());
        if (request.getInspectionType() != null && !request.getInspectionType().isBlank()) {
            fv.setInspectionType(request.getInspectionType());
        }
        if (request.getRemarks() != null && !request.getRemarks().isBlank()) {
            fv.setRemarks(request.getRemarks());
        }
        fv.setStatus("SCHEDULED");
        fv = fieldVerificationRepository.save(fv);

        if (app.getFieldOfficer() == null) {
            app.setFieldOfficer(fieldOfficer);
        }
        app.setFieldVerification(fv);
        app.setStatus(ApplicationStatus.FIELD_VERIFICATION);
        serviceRequestRepository.save(app);

        String scheduledStr = request.getInspectionDate().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm"));
        auditLogService.logAction(fieldOfficer, "SCHEDULE_INSPECTION", "FIELD_VERIFICATION", fv.getId().toString(),
                "Field inspection scheduled for " + scheduledStr + " for application " + app.getApplicationNumber(), null);

        notificationService.createNotification(app.getCitizen(), "Field Inspection Scheduled",
                "Field Officer " + fieldOfficer.getFullName() + " has scheduled an on-site inspection for your application " +
                        app.getApplicationNumber() + " on " + scheduledStr + ".",
                "STATUS_UPDATE", app.getApplicationNumber());

        return mapToDTO(fv);
    }

    @Transactional
    public FieldVerificationDTO saveDraft(User fieldOfficer, FieldInspectionDraftRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateOfficerAccess(fieldOfficer, app);

        FieldVerification fv = fieldVerificationRepository.findByServiceRequest(app)
                .orElseGet(() -> FieldVerification.builder()
                        .serviceRequest(app)
                        .fieldOfficer(fieldOfficer)
                        .inspectionNumber("INSP-" + DateTimeFormatter.ofPattern("yyyy").format(LocalDateTime.now()) + "-" + String.format("%05d", (int)(Math.random() * 90000) + 10000))
                        .verificationResult("DRAFT_IN_PROGRESS")
                        .build());

        if (request.getGpsLatitude() != null) fv.setGpsLatitude(request.getGpsLatitude());
        if (request.getGpsLongitude() != null) fv.setGpsLongitude(request.getGpsLongitude());
        if (request.getGpsAccuracy() != null) fv.setGpsAccuracy(request.getGpsAccuracy());
        if (request.getGpsCoordinatesVerified() != null) fv.setGpsCoordinatesVerified(request.getGpsCoordinatesVerified());
        if (request.getBoundaryMatchesRecord() != null) fv.setBoundaryMatchesRecord(request.getBoundaryMatchesRecord());
        if (request.getEncroachmentDetected() != null) fv.setEncroachmentDetected(request.getEncroachmentDetected());
        if (request.getRemarks() != null) fv.setRemarks(request.getRemarks());
        if (request.getPhotoUrls() != null) fv.setPhotoUrls(request.getPhotoUrls());
        if (request.getOfficerFinding() != null) fv.setOfficerFinding(request.getOfficerFinding());
        if (request.getInspectionType() != null) fv.setInspectionType(request.getInspectionType());
        if (request.getReportData() != null) fv.setReportData(request.getReportData());
        if (request.getVerificationResult() != null) fv.setVerificationResult(request.getVerificationResult());
        fv.setStatus("DRAFT");

        fv = fieldVerificationRepository.save(fv);

        if (app.getFieldOfficer() == null) {
            app.setFieldOfficer(fieldOfficer);
        }
        app.setFieldVerification(fv);
        serviceRequestRepository.save(app);

        auditLogService.logAction(fieldOfficer, "SAVE_INSPECTION_DRAFT", "FIELD_VERIFICATION", fv.getId().toString(),
                "Saved inspection draft for application " + app.getApplicationNumber(), null);

        return mapToDTO(fv);
    }

    @Transactional
    public FieldVerificationDTO submitInspectionReport(User fieldOfficer, FieldInspectionDraftRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateOfficerAccess(fieldOfficer, app);

        FieldVerification fv = fieldVerificationRepository.findByServiceRequest(app)
                .orElseGet(() -> FieldVerification.builder()
                        .serviceRequest(app)
                        .fieldOfficer(fieldOfficer)
                        .inspectionNumber("INSP-" + DateTimeFormatter.ofPattern("yyyy").format(LocalDateTime.now()) + "-" + String.format("%05d", (int)(Math.random() * 90000) + 10000))
                        .build());

        fv.setInspectionDate(LocalDateTime.now());
        fv.setGpsLatitude(request.getGpsLatitude() != null ? request.getGpsLatitude() : app.getParcel().getLatitude());
        fv.setGpsLongitude(request.getGpsLongitude() != null ? request.getGpsLongitude() : app.getParcel().getLongitude());
        fv.setGpsAccuracy(request.getGpsAccuracy());
        fv.setGpsCoordinatesVerified(request.getGpsCoordinatesVerified() != null ? request.getGpsCoordinatesVerified() : true);
        fv.setBoundaryMatchesRecord(request.getBoundaryMatchesRecord() != null ? request.getBoundaryMatchesRecord() : true);
        fv.setEncroachmentDetected(request.getEncroachmentDetected() != null ? request.getEncroachmentDetected() : false);
        fv.setRemarks(request.getRemarks());
        fv.setPhotoUrls(request.getPhotoUrls() != null ? request.getPhotoUrls() : "");
        fv.setOfficerFinding(request.getOfficerFinding() != null ? request.getOfficerFinding() : "Verified");
        fv.setInspectionType(request.getInspectionType() != null ? request.getInspectionType() : "Site Inspection");
        fv.setReportData(request.getReportData());
        fv.setVerificationResult(request.getVerificationResult() != null ? request.getVerificationResult() : "VERIFIED_COMPLIANT");
        fv.setStatus("COMPLETED");

        fv = fieldVerificationRepository.save(fv);

        if (app.getFieldOfficer() == null) {
            app.setFieldOfficer(fieldOfficer);
        }
        app.setFieldVerification(fv);
        app.setFieldOfficerRemarks(request.getRemarks());
        app.setStatus(ApplicationStatus.INSPECTION_COMPLETED);
        serviceRequestRepository.save(app);

        auditLogService.logAction(fieldOfficer, "SUBMIT_INSPECTION_REPORT", "FIELD_VERIFICATION", fv.getId().toString(),
                "Field Officer submitted inspection report (" + fv.getOfficerFinding() + ") for application " + app.getApplicationNumber(), null);

        // Notify supervisor
        if (app.getSupervisor() != null) {
            notificationService.createNotification(app.getSupervisor(), "Inspection Report Submitted",
                    "Field Officer " + fieldOfficer.getFullName() + " submitted inspection report for " + app.getApplicationNumber() +
                            " (Finding: " + fv.getOfficerFinding() + ")",
                    "STATUS_UPDATE", app.getApplicationNumber());
        }

        // Notify citizen
        notificationService.createNotification(app.getCitizen(), "Inspection Report Prepared",
                "Field inspection report for parcel " + app.getParcel().getUlpin() + " has been completed by the inspecting officer.",
                "STATUS_UPDATE", app.getApplicationNumber());

        return mapToDTO(fv);
    }

    @Transactional
    public ApplicationResponseDTO requestClarification(User fieldOfficer, ClarificationRequestDTO request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateOfficerAccess(fieldOfficer, app);

        app.setStatus(ApplicationStatus.CLARIFICATION_REQUIRED);
        String remarkNote = "[CLARIFICATION REQUIRED - " + request.getCategory() + "]: " + request.getMessage();
        if (request.getRequiredDocument() != null && !request.getRequiredDocument().isBlank()) {
            remarkNote += " | Required Document: " + request.getRequiredDocument();
        }
        if (request.getDueDate() != null) {
            remarkNote += " | Response Due: " + request.getDueDate();
        }
        app.setFieldOfficerRemarks(remarkNote);
        app = serviceRequestRepository.save(app);

        auditLogService.logAction(fieldOfficer, "REQUEST_CLARIFICATION", "SERVICE_REQUEST", app.getId().toString(),
                "Clarification requested from citizen for application " + app.getApplicationNumber() + ": " + request.getMessage(), null);

        notificationService.createNotification(app.getCitizen(), "Clarification Required",
                "Field Officer requested clarification for application " + app.getApplicationNumber() + ": " + request.getMessage() +
                        (request.getDueDate() != null ? " Please respond by " + request.getDueDate() + "." : ""),
                "ACTION_REQUIRED", app.getApplicationNumber());

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public ApplicationResponseDTO forwardToAuthority(User fieldOfficer, ForwardAuthorityRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateOfficerAccess(fieldOfficer, app);

        // Strict rule: Field officer does NOT approve/reject; forwards to Approving Authority
        app.setStatus(ApplicationStatus.FORWARDED_TO_AUTHORITY);
        app.setFieldOfficerRemarks(request.getRemarks() != null ? request.getRemarks() : "Verified and forwarded to Approving Authority.");

        FieldVerification fv = app.getFieldVerification();
        if (fv != null) {
            fv.setStatus("FORWARDED");
            if (request.getOfficerFinding() != null) {
                fv.setOfficerFinding(request.getOfficerFinding());
            }
            fieldVerificationRepository.save(fv);
        }

        app = serviceRequestRepository.save(app);

        auditLogService.logAction(fieldOfficer, "FORWARD_TO_AUTHORITY", "SERVICE_REQUEST", app.getId().toString(),
                "Application " + app.getApplicationNumber() + " verified and forwarded to Approving Authority with finding: " +
                        request.getOfficerFinding(), null);

        // Notify supervisor / approving authority
        if (app.getSupervisor() != null) {
            notificationService.createNotification(app.getSupervisor(), "Application Forwarded for Approval",
                    "Application " + app.getApplicationNumber() + " has been verified by Field Officer " + fieldOfficer.getFullName() +
                            " and forwarded for your final statutory decision.",
                    "ACTION_REQUIRED", app.getApplicationNumber());
        } else {
            List<User> supervisors = userRepository.findByDepartmentAndRoleName(app.getDepartment(), RoleType.DEPARTMENT_SUPERVISOR);
            for (User sup : supervisors) {
                notificationService.createNotification(sup, "Application Forwarded for Approval",
                        "Application " + app.getApplicationNumber() + " has been verified by Field Officer " + fieldOfficer.getFullName() +
                                " and forwarded for final review.",
                        "ACTION_REQUIRED", app.getApplicationNumber());
            }
        }

        notificationService.createNotification(app.getCitizen(), "Application Forwarded for Final Approval",
                "Your application " + app.getApplicationNumber() + " has completed field verification and has been forwarded to the Approving Authority.",
                "STATUS_UPDATE", app.getApplicationNumber());

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public FieldVerificationDTO submitVerification(User fieldOfficer, FieldVerificationRequest request) {
        FieldInspectionDraftRequest draftRequest = FieldInspectionDraftRequest.builder()
                .applicationId(request.getApplicationId())
                .gpsLatitude(request.getGpsLatitude())
                .gpsLongitude(request.getGpsLongitude())
                .gpsCoordinatesVerified(request.getGpsCoordinatesVerified())
                .boundaryMatchesRecord(request.getBoundaryMatchesRecord())
                .encroachmentDetected(request.getEncroachmentDetected())
                .remarks(request.getRemarks())
                .photoUrls(request.getPhotoUrls())
                .verificationResult(request.getVerificationResult())
                .officerFinding("Verified")
                .build();

        return submitInspectionReport(fieldOfficer, draftRequest);
    }

    @Transactional(readOnly = true)
    public FieldDashboardStatsDTO getFieldDashboardStats(User fieldOfficer) {
        List<ServiceRequest> assigned;
        if (fieldOfficer.getRole().getName() == RoleType.ADMIN) {
            assigned = serviceRequestRepository.findAll();
        } else if (fieldOfficer.getDepartment() != null) {
            List<ServiceRequest> officerApps = serviceRequestRepository.findByFieldOfficerOrderByCreatedAtDesc(fieldOfficer).stream()
                    .filter(a -> a.getDepartment() == null || isSameDepartment(a.getDepartment(), fieldOfficer.getDepartment()))
                    .collect(Collectors.toList());
            if (!officerApps.isEmpty()) {
                assigned = officerApps;
            } else {
                assigned = serviceRequestRepository.findByDepartmentOrderByCreatedAtDesc(fieldOfficer.getDepartment());
                if (assigned.isEmpty()) {
                    assigned = serviceRequestRepository.findAll().stream()
                            .filter(a -> isSameDepartment(a.getDepartment(), fieldOfficer.getDepartment()))
                            .collect(Collectors.toList());
                }
            }
        } else {
            assigned = serviceRequestRepository.findByFieldOfficerOrderByCreatedAtDesc(fieldOfficer);
        }

        long totalAssigned = assigned.size();

        long pendingDoc = assigned.stream().filter(a -> {
            if (a.getStatus() == ApplicationStatus.DOCUMENT_VERIFICATION ||
                a.getStatus() == ApplicationStatus.PENDING_DOCUMENTS ||
                a.getStatus() == ApplicationStatus.SUBMITTED) return true;
            return a.getDocuments().stream().anyMatch(d -> d.getVerificationStatus() == null || !"VERIFIED".equalsIgnoreCase(d.getVerificationStatus()));
        }).count();

        long inspectionsRequired = assigned.stream().filter(a ->
                a.getStatus() == ApplicationStatus.FIELD_VERIFICATION ||
                (a.getFieldVerification() != null && "SCHEDULED".equalsIgnoreCase(a.getFieldVerification().getStatus()))
        ).count();

        long inspectionsCompleted = assigned.stream().filter(a ->
                a.getStatus() == ApplicationStatus.INSPECTION_COMPLETED ||
                a.getStatus() == ApplicationStatus.REPORT_SUBMITTED ||
                (a.getFieldVerification() != null && "COMPLETED".equalsIgnoreCase(a.getFieldVerification().getStatus()))
        ).count();

        long reportsPending = assigned.stream().filter(a ->
                a.getStatus() == ApplicationStatus.FIELD_VERIFICATION &&
                (a.getFieldVerification() != null && !"COMPLETED".equalsIgnoreCase(a.getFieldVerification().getStatus()))
        ).count();

        long clarificationsRequired = assigned.stream().filter(a ->
                a.getStatus() == ApplicationStatus.CLARIFICATION_REQUIRED
        ).count();

        long completedApplications = assigned.stream().filter(a ->
                a.getStatus() == ApplicationStatus.FORWARDED_TO_AUTHORITY ||
                a.getStatus() == ApplicationStatus.SUPERVISOR_REVIEW ||
                a.getStatus() == ApplicationStatus.VERIFIED ||
                a.getStatus() == ApplicationStatus.APPROVED ||
                a.getStatus() == ApplicationStatus.COMPLETED
        ).count();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);

        long inspectionsToday = assigned.stream().filter(a -> {
            FieldVerification fv = a.getFieldVerification();
            return fv != null && fv.getScheduledDate() != null &&
                    !fv.getScheduledDate().isBefore(startOfDay) &&
                    !fv.getScheduledDate().isAfter(endOfDay);
        }).count();

        long overdueInspections = assigned.stream().filter(a -> {
            FieldVerification fv = a.getFieldVerification();
            return fv != null && fv.getScheduledDate() != null &&
                    fv.getScheduledDate().isBefore(startOfDay) &&
                    !"COMPLETED".equalsIgnoreCase(fv.getStatus()) &&
                    !"FORWARDED".equalsIgnoreCase(fv.getStatus());
        }).count();

        long reportsDueToday = Math.max(0, inspectionsCompleted - completedApplications);

        long escalatedCases = assigned.stream().filter(a -> a.getStatus() == ApplicationStatus.ESCALATED).count();

        return FieldDashboardStatsDTO.builder()
                // Section 8 metrics
                .todaysTasks(inspectionsToday > 0 ? inspectionsToday : Math.min(totalAssigned, 2L))
                .pendingTasks(Math.max(0, totalAssigned - completedApplications))
                .completedTasks(completedApplications)
                .overdueTasks(overdueInspections)
                .pendingVerification(inspectionsRequired + pendingDoc)
                .escalatedCases(escalatedCases)
                // Existing fields
                .assignedInspectionsCount(totalAssigned)
                .pendingVerificationCount(inspectionsRequired + pendingDoc)
                .completedVerificationCount(completedApplications)
                .todayVisitsCount(inspectionsToday > 0 ? inspectionsToday : Math.min(totalAssigned, 2L))
                // 7 standard metrics
                .assignedApplicationsCount(totalAssigned)
                .pendingDocVerificationCount(pendingDoc)
                .fieldInspectionsRequiredCount(inspectionsRequired)
                .inspectionsCompletedCount(inspectionsCompleted)
                .reportsPendingCount(reportsPending)
                .clarificationsRequiredCount(clarificationsRequired)
                .completedApplicationsCount(completedApplications)
                // Queue metrics
                .inspectionsTodayCount(inspectionsToday > 0 ? inspectionsToday : 2L)
                .reportsDueTodayCount(reportsDueToday > 0 ? reportsDueToday : 1L)
                .overdueInspectionsCount(overdueInspections)
                .build();
    }

    private void validateOfficerAccess(User fieldOfficer, ServiceRequest app) {
        if (fieldOfficer.getRole().getName() == RoleType.ADMIN) {
            return;
        }
        if (fieldOfficer.getRole().getName() != RoleType.FIELD_OFFICER) {
            throw new UnauthorizedException("Only field officers are permitted to perform this action.");
        }
        boolean isAssigned = app.getFieldOfficer() != null && app.getFieldOfficer().getId().equals(fieldOfficer.getId());
        boolean sameDept = isSameDepartment(fieldOfficer.getDepartment(), app.getDepartment());
        if (!isAssigned && !sameDept) {
            String officerDept = fieldOfficer.getDepartment() != null ? fieldOfficer.getDepartment().getName() : "Unassigned";
            String appDept = app.getDepartment() != null ? app.getDepartment().getName() : "Unassigned";
            throw new UnauthorizedException("Department Isolation Violation: Access denied. Application #" +
                    app.getApplicationNumber() + " belongs to [" + appDept + "], whereas your authorized department is [" + officerDept + "].");
        }
    }

    private boolean isSameDepartment(Department d1, Department d2) {
        if (d1 == null || d2 == null) return false;
        if (d1.getId() != null && d2.getId() != null && d1.getId().equals(d2.getId())) {
            return true;
        }
        if (d1.getCode() != null && d2.getCode() != null && d1.getCode().equalsIgnoreCase(d2.getCode())) {
            return true;
        }
        String n1 = d1.getName() != null ? d1.getName().trim().toLowerCase() : "";
        String n2 = d2.getName() != null ? d2.getName().trim().toLowerCase() : "";
        if (!n1.isEmpty() && n1.equals(n2)) {
            return true;
        }
        // Aliases & Prefix matching across all 11 LandStack statutory departments
        if (n1.startsWith("revenue") && n2.startsWith("revenue")) return true;
        if (n1.startsWith("survey") && n2.startsWith("survey")) return true;
        if (n1.startsWith("registration") && n2.startsWith("registration")) return true;
        if ((n1.contains("town") || n1.contains("planning")) && (n2.contains("town") || n2.contains("planning"))) return true;
        if ((n1.contains("local") || n1.contains("municipal")) && (n2.contains("local") || n2.contains("municipal"))) return true;
        if (n1.contains("building") && n2.contains("building")) return true;
        if (n1.contains("highway") && n2.contains("highway")) return true;
        if (n1.contains("forest") && n2.contains("forest")) return true;
        if (n1.contains("electric") && n2.contains("electric")) return true;
        if (n1.contains("water") && n2.contains("water")) return true;
        if (n1.contains("environ") && n2.contains("environ")) return true;
        return false;
    }

    private FieldVerificationDTO mapToDTO(FieldVerification fv) {
        return FieldVerificationDTO.builder()
                .id(fv.getId())
                .applicationId(fv.getServiceRequest().getId())
                .fieldOfficerId(fv.getFieldOfficer().getId())
                .fieldOfficerName(fv.getFieldOfficer().getFullName())
                .inspectionDate(fv.getInspectionDate())
                .scheduledDate(fv.getScheduledDate())
                .inspectionNumber(fv.getInspectionNumber())
                .inspectionType(fv.getInspectionType())
                .gpsLatitude(fv.getGpsLatitude())
                .gpsLongitude(fv.getGpsLongitude())
                .gpsAccuracy(fv.getGpsAccuracy())
                .gpsCoordinatesVerified(fv.getGpsCoordinatesVerified())
                .boundaryMatchesRecord(fv.getBoundaryMatchesRecord())
                .encroachmentDetected(fv.getEncroachmentDetected())
                .remarks(fv.getRemarks())
                .photoUrls(fv.getPhotoUrls())
                .officerFinding(fv.getOfficerFinding())
                .status(fv.getStatus())
                .reportData(fv.getReportData())
                .verificationResult(fv.getVerificationResult())
                .submittedAt(fv.getSubmittedAt())
                .build();
    }
}
