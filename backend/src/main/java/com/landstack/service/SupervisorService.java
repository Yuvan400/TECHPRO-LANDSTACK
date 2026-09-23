package com.landstack.service;

import com.landstack.dto.*;
import com.landstack.entity.*;
import com.landstack.exception.BadRequestException;
import com.landstack.exception.ResourceNotFoundException;
import com.landstack.exception.UnauthorizedException;
import com.landstack.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupervisorService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ApplicationDocumentRepository applicationDocumentRepository;
    private final FieldVerificationRepository fieldVerificationRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ApplicationService applicationService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public SupervisorDashboardStatsDTO getSupervisorDashboardStats(User supervisor) {
        Department dept = supervisor.getDepartment();
        List<ServiceRequest> apps = getSupervisorDepartmentApps(supervisor);

        long total = apps.size();
        long newApps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED || a.getFieldOfficer() == null).count();
        long assignedApps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.ASSIGNED_TO_OFFICER || (a.getFieldOfficer() != null && (a.getStatus() == ApplicationStatus.UNDER_REVIEW || a.getStatus() == ApplicationStatus.DOCUMENT_VERIFICATION))).count();
        long underReview = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFICER_PROCESSING || a.getStatus() == ApplicationStatus.FIELD_VERIFICATION).count();
        long pendingVerif = apps.stream().filter(a ->
                a.getStatus() == ApplicationStatus.SUBMITTED_FOR_SUPERVISOR_REVIEW ||
                a.getStatus() == ApplicationStatus.INSPECTION_COMPLETED ||
                a.getStatus() == ApplicationStatus.REPORT_SUBMITTED ||
                a.getStatus() == ApplicationStatus.FORWARDED_TO_AUTHORITY ||
                a.getStatus() == ApplicationStatus.SUPERVISOR_REVIEW ||
                a.getStatus() == ApplicationStatus.READY_FOR_APPROVAL
        ).count();
        long approved = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED || a.getStatus() == ApplicationStatus.COMPLETED).count();
        long rejected = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
        long returnedForCorrection = apps.stream().filter(a ->
                a.getStatus() == ApplicationStatus.CORRECTION_REQUIRED ||
                a.getStatus() == ApplicationStatus.RETURNED_TO_OFFICER ||
                a.getStatus() == ApplicationStatus.FURTHER_INSPECTION_REQUIRED
        ).count();
        long escalated = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.ESCALATED).count();

        long overdue = apps.stream().filter(a -> {
            if (a.getStatus() == ApplicationStatus.APPROVED || a.getStatus() == ApplicationStatus.COMPLETED || a.getStatus() == ApplicationStatus.REJECTED) {
                return false;
            }
            int sla = a.getService() != null && a.getService().getProcessingDays() != null ? a.getService().getProcessingDays() : 14;
            long elapsed = a.getCreatedAt() != null ? ChronoUnit.DAYS.between(a.getCreatedAt(), LocalDateTime.now()) : 0;
            boolean slaOverdue = elapsed > sla;

            boolean visitOverdue = false;
            if (a.getFieldVerification() != null && a.getFieldVerification().getScheduledDate() != null) {
                visitOverdue = a.getFieldVerification().getScheduledDate().isBefore(LocalDate.now().atStartOfDay()) &&
                        !"COMPLETED".equalsIgnoreCase(a.getFieldVerification().getStatus());
            }
            return slaOverdue || visitOverdue;
        }).count();

        List<User> officers = getOfficersInDepartment(supervisor);

        Map<String, Long> statusBreakdown = apps.stream()
                .collect(Collectors.groupingBy(a -> a.getStatus().name(), Collectors.counting()));

        return SupervisorDashboardStatsDTO.builder()
                .departmentName(dept != null ? dept.getName() : "All Departments (State Admin)")
                .departmentCode(dept != null ? dept.getCode() : "ALL")
                .newApplications(newApps)
                .assignedApplications(assignedApps)
                .applicationsUnderOfficerReview(underReview)
                .pendingVerification(pendingVerif)
                .approved(approved)
                .rejected(rejected)
                .returnedForCorrection(returnedForCorrection)
                .escalated(escalated)
                .overdueApplications(overdue)
                // Section 11 metrics
                .todaysReviews(Math.min(pendingVerif, 3L))
                .pendingReviews(pendingVerif)
                .completedReviews(approved + rejected)
                .overdueReviews(overdue)
                .returnedApplications(returnedForCorrection)
                .pendingOfficerReports(underReview)
                .escalatedCases(escalated)
                .awaitingForwarding(apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED_FOR_SUPERVISOR_REVIEW || a.getStatus() == ApplicationStatus.VERIFIED || a.getStatus() == ApplicationStatus.READY_FOR_APPROVAL).count())
                .totalApplications(total)
                .pendingAssignment(newApps)
                .assignedToOfficers(assignedApps)
                .underFieldVerification(underReview)
                .reportsAwaitingReview(pendingVerif)
                .returnedToOfficers(returnedForCorrection)
                .clarificationsPending(apps.stream().filter(a -> a.getStatus() == ApplicationStatus.CLARIFICATION_REQUIRED).count())
                .readyForApproval(pendingVerif)
                .totalDepartmentApplications(total)
                .submittedCount(newApps)
                .underReviewCount(underReview)
                .pendingDocumentsCount(apps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING_DOCUMENTS || a.getStatus() == ApplicationStatus.DOCUMENT_VERIFICATION).count())
                .fieldVerificationCount(underReview)
                .verifiedCount(pendingVerif)
                .approvedCount(approved)
                .rejectedCount(rejected)
                .activeFieldOfficers((long) officers.size())
                .statusBreakdown(statusBreakdown)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponseDTO> getDepartmentApplications(User supervisor, String queue, String status, String search, Long serviceId, Long officerId) {
        List<ServiceRequest> apps = getSupervisorDepartmentApps(supervisor);

        // Queue filter
        if (queue != null && !queue.isBlank() && !"ALL".equalsIgnoreCase(queue)) {
            switch (queue.trim().toUpperCase()) {
                case "NEW":
                case "UNASSIGNED":
                case "SUBMITTED":
                    apps = apps.stream().filter(a -> a.getFieldOfficer() == null || a.getStatus() == ApplicationStatus.SUBMITTED).collect(Collectors.toList());
                    break;
                case "ASSIGNED":
                case "ASSIGNED_TO_OFFICER":
                    apps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.ASSIGNED_TO_OFFICER || (a.getFieldOfficer() != null && a.getStatus() != ApplicationStatus.APPROVED && a.getStatus() != ApplicationStatus.COMPLETED && a.getStatus() != ApplicationStatus.REJECTED)).collect(Collectors.toList());
                    break;
                case "UNDER_REVIEW":
                case "OFFICER_PROCESSING":
                case "FIELD_VERIFICATION":
                    apps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFICER_PROCESSING || a.getStatus() == ApplicationStatus.FIELD_VERIFICATION || a.getStatus() == ApplicationStatus.DOCUMENT_VERIFICATION).collect(Collectors.toList());
                    break;
                case "PENDING_VERIFICATION":
                case "REPORTS_AWAITING_REVIEW":
                case "AWAITING_REVIEW":
                case "SUBMITTED_FOR_SUPERVISOR_REVIEW":
                    apps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED_FOR_SUPERVISOR_REVIEW || a.getStatus() == ApplicationStatus.INSPECTION_COMPLETED || a.getStatus() == ApplicationStatus.REPORT_SUBMITTED || a.getStatus() == ApplicationStatus.FORWARDED_TO_AUTHORITY || a.getStatus() == ApplicationStatus.SUPERVISOR_REVIEW || a.getStatus() == ApplicationStatus.READY_FOR_APPROVAL).collect(Collectors.toList());
                    break;
                case "APPROVED":
                case "COMPLETED":
                    apps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED || a.getStatus() == ApplicationStatus.COMPLETED).collect(Collectors.toList());
                    break;
                case "REJECTED":
                    apps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).collect(Collectors.toList());
                    break;
                case "CORRECTION_REQUIRED":
                case "RETURNED_TO_OFFICER":
                case "RETURNED":
                    apps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.CORRECTION_REQUIRED || a.getStatus() == ApplicationStatus.RETURNED_TO_OFFICER || a.getStatus() == ApplicationStatus.FURTHER_INSPECTION_REQUIRED).collect(Collectors.toList());
                    break;
                case "ESCALATED":
                    apps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.ESCALATED).collect(Collectors.toList());
                    break;
                case "CLARIFICATION_REQUIRED":
                case "CLARIFICATION":
                    apps = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.CLARIFICATION_REQUIRED).collect(Collectors.toList());
                    break;
                case "OVERDUE":
                    apps = apps.stream().filter(a -> {
                        int sla = a.getService() != null && a.getService().getProcessingDays() != null ? a.getService().getProcessingDays() : 14;
                        long elapsed = a.getCreatedAt() != null ? ChronoUnit.DAYS.between(a.getCreatedAt(), LocalDateTime.now()) : 0;
                        return elapsed > sla;
                    }).collect(Collectors.toList());
                    break;
            }
        }

        // Direct status filter
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            apps = apps.stream().filter(a -> a.getStatus().name().equalsIgnoreCase(status.trim())).collect(Collectors.toList());
        }

        // Service filter
        if (serviceId != null) {
            apps = apps.stream().filter(a -> a.getService() != null && a.getService().getId().equals(serviceId)).collect(Collectors.toList());
        }

        // Officer filter
        if (officerId != null) {
            apps = apps.stream().filter(a -> a.getFieldOfficer() != null && a.getFieldOfficer().getId().equals(officerId)).collect(Collectors.toList());
        }

        // Search query
        if (search != null && !search.isBlank()) {
            String q = search.trim().toLowerCase();
            apps = apps.stream().filter(a ->
                    (a.getApplicationNumber() != null && a.getApplicationNumber().toLowerCase().contains(q)) ||
                    (a.getCitizen() != null && a.getCitizen().getFullName().toLowerCase().contains(q)) ||
                    (a.getParcel() != null && a.getParcel().getUlpin().toLowerCase().contains(q)) ||
                    (a.getParcel() != null && a.getParcel().getSurveyNumber().toLowerCase().contains(q)) ||
                    (a.getParcel() != null && a.getParcel().getVillage().toLowerCase().contains(q)) ||
                    (a.getFieldOfficer() != null && a.getFieldOfficer().getFullName().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        return apps.stream().map(applicationService::mapToDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ApplicationResponseDTO getApplicationById(Long id, User supervisor) {
        ServiceRequest app = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + id));

        validateSupervisorAccess(supervisor, app);
        return applicationService.mapToDTO(app);
    }

    @Transactional(readOnly = true)
    public List<OfficerWorkloadDTO> getDepartmentOfficersWorkload(User supervisor) {
        List<User> officers = getOfficersInDepartment(supervisor);
        List<ServiceRequest> allApps = getSupervisorDepartmentApps(supervisor);

        List<OfficerWorkloadDTO> dtos = new ArrayList<>();
        for (User off : officers) {
            List<ServiceRequest> assigned = allApps.stream()
                    .filter(a -> a.getFieldOfficer() != null && a.getFieldOfficer().getId().equals(off.getId()))
                    .collect(Collectors.toList());

            long pendingDoc = assigned.stream().filter(a ->
                    a.getStatus() == ApplicationStatus.DOCUMENT_VERIFICATION || a.getStatus() == ApplicationStatus.PENDING_DOCUMENTS
            ).count();

            long inspectionsPending = assigned.stream().filter(a ->
                    a.getStatus() == ApplicationStatus.FIELD_VERIFICATION
            ).count();

            long inspectionsCompleted = assigned.stream().filter(a ->
                    a.getStatus() == ApplicationStatus.INSPECTION_COMPLETED || a.getStatus() == ApplicationStatus.REPORT_SUBMITTED
            ).count();

            long reportsPending = assigned.stream().filter(a ->
                    a.getStatus() == ApplicationStatus.FIELD_VERIFICATION &&
                    (a.getFieldVerification() == null || !"COMPLETED".equalsIgnoreCase(a.getFieldVerification().getStatus()))
            ).count();

            long clarifications = assigned.stream().filter(a -> a.getStatus() == ApplicationStatus.CLARIFICATION_REQUIRED).count();

            long overdue = assigned.stream().filter(a -> {
                int sla = a.getService() != null && a.getService().getProcessingDays() != null ? a.getService().getProcessingDays() : 14;
                long elapsed = a.getCreatedAt() != null ? ChronoUnit.DAYS.between(a.getCreatedAt(), LocalDateTime.now()) : 0;
                return elapsed > sla;
            }).count();

            long completed = assigned.stream().filter(a ->
                    a.getStatus() == ApplicationStatus.READY_FOR_APPROVAL ||
                    a.getStatus() == ApplicationStatus.APPROVED ||
                    a.getStatus() == ApplicationStatus.COMPLETED
            ).count();

            int workloadScore = (int) (inspectionsPending * 3 + pendingDoc * 2 + reportsPending * 2 + clarifications);

            dtos.add(OfficerWorkloadDTO.builder()
                    .officerId(off.getId())
                    .officerName(off.getFullName())
                    .employeeCode(off.getEmployeeCode() != null ? off.getEmployeeCode() : "OFF-" + off.getId())
                    .designation(off.getDesignation() != null ? off.getDesignation() : "Cadastral Field Inspector")
                    .departmentName(off.getDepartment() != null ? off.getDepartment().getName() : "Revenue Administration")
                    .email(off.getEmail())
                    .mobile(off.getMobile())
                    .district("Chennai")
                    .taluk("Tambaram")
                    .status(off.getActive() ? "Active" : "On Leave")
                    .totalAssigned((long) assigned.size())
                    .pendingDocVerification(pendingDoc)
                    .fieldInspectionsPending(inspectionsPending)
                    .inspectionsCompleted(inspectionsCompleted)
                    .reportsPending(reportsPending)
                    .clarificationsPending(clarifications)
                    .overdue(overdue)
                    .completed(completed)
                    .averageProcessingDays(4.2)
                    .workloadScore(workloadScore)
                    .suggestionReason(workloadScore <= 5 ? "Optimal capacity, operates in local revenue block" : "Moderate queue")
                    .build());
        }

        // Sort by lowest workload score
        dtos.sort(Comparator.comparingInt(OfficerWorkloadDTO::getWorkloadScore));
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<OfficerWorkloadDTO> suggestOfficersForApplication(Long applicationId, User supervisor) {
        ServiceRequest app = serviceRequestRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + applicationId));

        List<OfficerWorkloadDTO> officers = getDepartmentOfficersWorkload(supervisor);
        String targetTaluk = app.getParcel() != null && app.getParcel().getTaluk() != null ? app.getParcel().getTaluk() : "";

        for (OfficerWorkloadDTO dto : officers) {
            if (dto.getTaluk() != null && dto.getTaluk().equalsIgnoreCase(targetTaluk)) {
                dto.setSuggestionReason("Jurisdiction match (" + targetTaluk + "), lowest active inspections (" + dto.getFieldInspectionsPending() + ")");
            } else {
                dto.setSuggestionReason("Available in adjacent revenue circle, low pending queue (" + dto.getFieldInspectionsPending() + ")");
            }
        }

        return officers;
    }

    @Transactional
    public ApplicationResponseDTO assignOfficer(User supervisor, SupervisorAssignRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateSupervisorAccess(supervisor, app);

        User officer = userRepository.findById(request.getFieldOfficerId())
                .orElseThrow(() -> new ResourceNotFoundException("Field officer not found with ID: " + request.getFieldOfficerId()));

        if (officer.getRole().getName() != RoleType.FIELD_OFFICER) {
            throw new BadRequestException("Selected staff member is not a designated field officer.");
        }

        User prevOfficer = app.getFieldOfficer();
        boolean isReassignment = prevOfficer != null && !prevOfficer.getId().equals(officer.getId());

        app.setFieldOfficer(officer);
        app.setSupervisor(supervisor);
        app.setStatus(ApplicationStatus.FIELD_VERIFICATION);
        if (request.getAssignmentReason() != null) {
            app.setSupervisorRemarks("[ASSIGNED]: " + request.getAssignmentReason());
        }

        app = serviceRequestRepository.save(app);

        String actionType = isReassignment ? "REASSIGN_FIELD_OFFICER" : "ASSIGN_FIELD_OFFICER";
        String logDesc = (isReassignment ? "Reassigned from " + prevOfficer.getFullName() + " to " : "Assigned to ") +
                officer.getFullName() + " (" + officer.getEmployeeCode() + ") for application " + app.getApplicationNumber() +
                (request.getAssignmentReason() != null ? ": " + request.getAssignmentReason() : "");

        auditLogService.logAction(supervisor, actionType, "SERVICE_REQUEST", app.getId().toString(), logDesc, null);

        // Notify assigned field officer
        notificationService.createNotification(officer, "New Field Inspection Assigned",
                "Supervisor " + supervisor.getFullName() + " assigned you to verify parcel " + app.getParcel().getUlpin() +
                        " for application " + app.getApplicationNumber() + ".",
                "ACTION_REQUIRED", app.getApplicationNumber());

        // Notify citizen
        notificationService.createNotification(app.getCitizen(), "Field Officer Assigned",
                "Field Officer " + officer.getFullName() + " has been assigned to inspect your land parcel " + app.getParcel().getUlpin() + ".",
                "STATUS_UPDATE", app.getApplicationNumber());

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public ApplicationDocumentDTO reviewDocument(User supervisor, SupervisorDocReviewRequest request) {
        ApplicationDocument doc = applicationDocumentRepository.findById(request.getDocumentId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + request.getDocumentId()));

        ServiceRequest app = doc.getServiceRequest();
        validateSupervisorAccess(supervisor, app);

        String act = request.getAction().trim().toUpperCase();
        if ("CONFIRM_VERIFIED".equalsIgnoreCase(act) || "CONFIRM".equalsIgnoreCase(act)) {
            doc.setVerificationStatus("VERIFIED");
            doc.setVerified(true);
            doc.setOfficerRemark("Confirmed by Supervisor " + supervisor.getFullName() + (request.getRemarks() != null ? ": " + request.getRemarks() : ""));
        } else if ("REJECT_VERIFICATION".equalsIgnoreCase(act) || "REJECT".equalsIgnoreCase(act)) {
            doc.setVerificationStatus("NOT_VERIFIED");
            doc.setVerified(false);
            doc.setOfficerRemark("Disapproved by Supervisor: " + (request.getRemarks() != null ? request.getRemarks() : "Document deficiency detected."));
        } else if ("REQUEST_CLARIFICATION".equalsIgnoreCase(act)) {
            doc.setVerificationStatus("REQUIRES_CLARIFICATION");
            doc.setOfficerRemark("Supervisor requested clarification: " + (request.getRemarks() != null ? request.getRemarks() : ""));
        }

        doc = applicationDocumentRepository.save(doc);

        auditLogService.logAction(supervisor, "SUPERVISOR_DOCUMENT_REVIEW", "APPLICATION_DOCUMENT", doc.getId().toString(),
                "Supervisor reviewed document " + doc.getDocumentName() + " with decision: " + act, null);

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
    public ApplicationResponseDTO returnToOfficer(User supervisor, SupervisorReturnRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateSupervisorAccess(supervisor, app);

        app.setStatus(ApplicationStatus.RETURNED_TO_OFFICER);
        String note = "[RETURNED TO FIELD OFFICER]: Reason: " + request.getReturnReason();
        if (request.getRequiredCorrection() != null && !request.getRequiredCorrection().isBlank()) {
            note += " | Correction: " + request.getRequiredCorrection();
        }
        if (request.getAdditionalEvidenceRequired() != null && !request.getAdditionalEvidenceRequired().isBlank()) {
            note += " | Evidence Needed: " + request.getAdditionalEvidenceRequired();
        }
        app.setSupervisorRemarks(note);
        app = serviceRequestRepository.save(app);

        auditLogService.logAction(supervisor, "RETURN_TO_FIELD_OFFICER", "SERVICE_REQUEST", app.getId().toString(),
                "Returned application " + app.getApplicationNumber() + " to Field Officer: " + request.getReturnReason(), null);

        if (app.getFieldOfficer() != null) {
            notificationService.createNotification(app.getFieldOfficer(), "Inspection Report Returned",
                    "Supervisor " + supervisor.getFullName() + " returned application " + app.getApplicationNumber() +
                            " for correction: " + request.getReturnReason(),
                    "ACTION_REQUIRED", app.getApplicationNumber());
        }

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public ApplicationResponseDTO requestFurtherInspection(User supervisor, SupervisorFurtherInspectionRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateSupervisorAccess(supervisor, app);

        app.setStatus(ApplicationStatus.FURTHER_INSPECTION_REQUIRED);
        String note = "[FURTHER INSPECTION REQUIRED]: " + request.getReason();
        if (request.getInspectionType() != null) note += " | Type: " + request.getInspectionType();
        if (request.getInstructions() != null) note += " | Instructions: " + request.getInstructions();

        app.setSupervisorRemarks(note);
        app = serviceRequestRepository.save(app);

        auditLogService.logAction(supervisor, "REQUEST_FURTHER_INSPECTION", "SERVICE_REQUEST", app.getId().toString(),
                "Requested further inspection for application " + app.getApplicationNumber() + ": " + request.getReason(), null);

        if (app.getFieldOfficer() != null) {
            notificationService.createNotification(app.getFieldOfficer(), "Additional Field Inspection Sanctioned",
                    "Supervisor requested supplementary inspection for " + app.getApplicationNumber() + ": " + request.getReason(),
                    "ACTION_REQUIRED", app.getApplicationNumber());
        }

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public ApplicationResponseDTO requestClarification(User supervisor, ClarificationRequestDTO request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateSupervisorAccess(supervisor, app);

        app.setStatus(ApplicationStatus.CLARIFICATION_REQUIRED);
        String note = "[CLARIFICATION REQUESTED BY SUPERVISOR - " + request.getCategory() + "]: " + request.getMessage();
        if (request.getRequiredDocument() != null) note += " | Document: " + request.getRequiredDocument();
        if (request.getDueDate() != null) note += " | Due: " + request.getDueDate();

        app.setSupervisorRemarks(note);
        app = serviceRequestRepository.save(app);

        auditLogService.logAction(supervisor, "REQUEST_CLARIFICATION", "SERVICE_REQUEST", app.getId().toString(),
                "Supervisor requested citizen clarification for application " + app.getApplicationNumber() + ": " + request.getMessage(), null);

        notificationService.createNotification(app.getCitizen(), "Clarification Required",
                "Supervisor requested clarification for " + app.getApplicationNumber() + ": " + request.getMessage(),
                "ACTION_REQUIRED", app.getApplicationNumber());

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public ApplicationResponseDTO forwardToApprovingAuthority(User supervisor, SupervisorForwardRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateSupervisorAccess(supervisor, app);

        // Strict role separation: Supervisor validates field report and forwards to Approving Authority
        app.setStatus(ApplicationStatus.READY_FOR_APPROVAL);
        app.setSupervisorRemarks("[VALIDATED & FORWARDED]: " +
                (request.getRemarks() != null ? request.getRemarks() : "Field inspection validated and recommended for final approval."));

        app = serviceRequestRepository.save(app);

        auditLogService.logAction(supervisor, "VALIDATE_AND_FORWARD_TO_AUTHORITY", "SERVICE_REQUEST", app.getId().toString(),
                "Supervisor validated inspection report (" + request.getValidationFinding() + ") and forwarded application " +
                        app.getApplicationNumber() + " to Approving Authority", null);

        // Notify citizen
        notificationService.createNotification(app.getCitizen(), "Application Validated by Supervisor",
                "Your application " + app.getApplicationNumber() + " has been validated by Department Supervisor " +
                        supervisor.getFullName() + " and forwarded for final statutory approval.",
                "STATUS_UPDATE", app.getApplicationNumber());

        // Notify admin / Approving Authority
        List<User> admins = userRepository.findByRoleName(RoleType.ADMIN);
        for (User adm : admins) {
            notificationService.createNotification(adm, "Application Ready for Final Sanction",
                    "Application " + app.getApplicationNumber() + " has been validated by Supervisor " + supervisor.getFullName() + " and is ready for statutory seal.",
                    "ACTION_REQUIRED", app.getApplicationNumber());
        }

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public ApplicationResponseDTO processSupervisorDecision(User supervisor, SupervisorDecisionRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateSupervisorAccess(supervisor, app);

        String decision = request.getDecision().trim().toUpperCase();
        switch (decision) {
            case "APPROVE":
                app.setStatus(ApplicationStatus.APPROVED);
                String approveNote = "[APPROVED BY SUPERVISOR]: " + (request.getRemarks() != null ? request.getRemarks() : "Application vetted and approved in accordance with statutory rules.");
                app.setSupervisorRemarks(approveNote);
                if (app.getCertificateNumber() == null) {
                    app.setCertificateNumber("CERT-" + LocalDate.now().toString().replace("-", "") + "-" + String.format("%04d", app.getId()));
                    app.setCertificateGeneratedAt(LocalDateTime.now());
                }
                auditLogService.logAction(supervisor, "SUPERVISOR_APPROVE", "SERVICE_REQUEST", app.getId().toString(),
                        "Supervisor approved application " + app.getApplicationNumber() + (request.getRemarks() != null ? ": " + request.getRemarks() : ""), null);
                notificationService.createNotification(app.getCitizen(), "Application Approved",
                        "Your application " + app.getApplicationNumber() + " has been approved by Department Supervisor " + supervisor.getFullName() + ".",
                        "STATUS_UPDATE", app.getApplicationNumber());
                break;

            case "REJECT":
                if (request.getReason() == null || request.getReason().isBlank()) {
                    throw new BadRequestException("Rejection reason is mandatory.");
                }
                app.setStatus(ApplicationStatus.REJECTED);
                app.setSupervisorRemarks("[REJECTED BY SUPERVISOR]: Reason: " + request.getReason());
                auditLogService.logAction(supervisor, "SUPERVISOR_REJECT", "SERVICE_REQUEST", app.getId().toString(),
                        "Supervisor rejected application " + app.getApplicationNumber() + " with reason: " + request.getReason(), null);
                notificationService.createNotification(app.getCitizen(), "Application Rejected",
                        "Your application " + app.getApplicationNumber() + " was rejected by the Department Supervisor. Reason: " + request.getReason(),
                        "STATUS_UPDATE", app.getApplicationNumber());
                break;

            case "RETURN_CORRECTION":
            case "RETURN":
                app.setStatus(ApplicationStatus.CORRECTION_REQUIRED);
                String returnNote = "[CORRECTION REQUIRED]: Reason: " + (request.getReason() != null ? request.getReason() : "Re-verification required");
                if (request.getRequiredCorrection() != null && !request.getRequiredCorrection().isBlank()) {
                    returnNote += " | Correction: " + request.getRequiredCorrection();
                }
                if (request.getAdditionalInfo() != null && !request.getAdditionalInfo().isBlank()) {
                    returnNote += " | Additional Info: " + request.getAdditionalInfo();
                }
                app.setSupervisorRemarks(returnNote);
                auditLogService.logAction(supervisor, "SUPERVISOR_RETURN_FOR_CORRECTION", "SERVICE_REQUEST", app.getId().toString(),
                        "Returned application " + app.getApplicationNumber() + " for correction: " + request.getReason(), null);
                if (app.getFieldOfficer() != null) {
                    notificationService.createNotification(app.getFieldOfficer(), "Correction Required on Inspection Report",
                            "Supervisor " + supervisor.getFullName() + " returned application " + app.getApplicationNumber() + " for correction: " + request.getReason(),
                            "ACTION_REQUIRED", app.getApplicationNumber());
                }
                break;

            case "ESCALATE":
                app.setStatus(ApplicationStatus.ESCALATED);
                String caseId = "ESC-" + LocalDate.now().toString().replace("-", "") + "-" + String.format("%04d", app.getId());
                String escNote = "[ESCALATED TO ADMIN]: Case ID: " + caseId + " | Issue: " + request.getIssueType() +
                        (request.getPriority() != null ? " | Priority: " + request.getPriority() : "") +
                        (request.getDescription() != null ? " | Description: " + request.getDescription() : "") +
                        (request.getRemarks() != null ? " | Remarks: " + request.getRemarks() : "");
                app.setSupervisorRemarks(escNote);
                auditLogService.logAction(supervisor, "SUPERVISOR_ESCALATE_TO_ADMIN", "SERVICE_REQUEST", app.getId().toString(),
                        "Supervisor escalated application " + app.getApplicationNumber() + " [Case: " + caseId + "]: " + request.getIssueType(), null);
                List<User> admins = userRepository.findByRoleName(RoleType.ADMIN);
                for (User adm : admins) {
                    notificationService.createNotification(adm, "Application Escalated: " + app.getApplicationNumber(),
                            "Supervisor " + supervisor.getFullName() + " escalated application " + app.getApplicationNumber() + " (" + request.getIssueType() + ").",
                            "ACTION_REQUIRED", app.getApplicationNumber());
                }
                break;

            default:
                throw new BadRequestException("Unsupported decision action: " + decision);
        }

        app = serviceRequestRepository.save(app);
        return applicationService.mapToDTO(app);
    }

    @Transactional
    public ApplicationResponseDTO correctApplicationDetail(User supervisor, SupervisorDetailCorrectionRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + request.getApplicationId()));

        validateSupervisorAccess(supervisor, app);

        String field = request.getFieldName().trim();
        String prev = request.getPreviousValue();
        String updated = request.getUpdatedValue();
        String reason = request.getReason();

        if ("areaAcre".equalsIgnoreCase(field) || "landArea".equalsIgnoreCase(field)) {
            try {
                double newArea = Double.parseDouble(updated);
                if (app.getParcel() != null) {
                    app.getParcel().setAreaAcre(newArea);
                    app.getParcel().setAreaSqFt(newArea * 43560.0);
                }
            } catch (NumberFormatException e) {
                throw new BadRequestException("Invalid numeric land area: " + updated);
            }
        } else if ("boundaryStonesStatus".equalsIgnoreCase(field)) {
            if (app.getFieldVerification() != null) {
                app.getFieldVerification().setRemarks(
                        (app.getFieldVerification().getRemarks() != null ? app.getFieldVerification().getRemarks() + " " : "") +
                        "[SUPERVISOR CORRECTION]: Boundary stones updated to: " + updated
                );
            }
        } else if ("officerFinding".equalsIgnoreCase(field)) {
            if (app.getFieldVerification() != null) {
                app.getFieldVerification().setOfficerFinding(updated);
            }
        } else if ("encroachmentDetected".equalsIgnoreCase(field)) {
            if (app.getFieldVerification() != null) {
                boolean enc = Boolean.parseBoolean(updated);
                app.getFieldVerification().setEncroachmentDetected(enc);
            }
        }

        // Add auditable note to supervisor remarks
        String auditDesc = String.format("Supervisor edited %s (Previous: %s -> Updated: %s). Reason: %s",
                field, (prev != null ? prev : "N/A"), updated, reason);

        app.setSupervisorRemarks((app.getSupervisorRemarks() != null ? app.getSupervisorRemarks() + "\n" : "") + "[" + auditDesc + "]");
        app = serviceRequestRepository.save(app);

        // Record strict audit log
        auditLogService.logAction(supervisor, "SUPERVISOR_DETAIL_CORRECTION", "SERVICE_REQUEST", app.getId().toString(), auditDesc, null);

        return applicationService.mapToDTO(app);
    }

    @Transactional
    public void sendOfficerInstruction(User supervisor, SupervisorInstructionRequest request) {
        User officer = userRepository.findById(request.getOfficerId())
                .orElseThrow(() -> new ResourceNotFoundException("Officer not found with ID: " + request.getOfficerId()));

        String prio = request.getPriority() != null ? request.getPriority() : "NORMAL";
        String desc = String.format("Supervisor directive from %s [Priority: %s]: %s",
                supervisor.getFullName(), prio, request.getInstruction());

        notificationService.createNotification(officer, "Supervisor Directive (" + prio + ")",
                desc, "ACTION_REQUIRED", request.getApplicationId() != null ? request.getApplicationId().toString() : "DIRECTIVE");

        auditLogService.logAction(supervisor, "SUPERVISOR_SEND_INSTRUCTION", "USER", officer.getId().toString(), desc, null);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getSupervisorAuditLogs(User supervisor) {
        return auditLogService.getRecentLogs();
    }

    private List<ServiceRequest> getSupervisorDepartmentApps(User supervisor) {
        if (supervisor.getRole().getName() == RoleType.ADMIN || supervisor.getDepartment() == null) {
            return serviceRequestRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList());
        }
        List<ServiceRequest> list = serviceRequestRepository.findByDepartmentOrderByCreatedAtDesc(supervisor.getDepartment());
        if (list.isEmpty()) {
            list = serviceRequestRepository.findAll().stream()
                    .filter(a -> isSameDepartment(a.getDepartment(), supervisor.getDepartment()))
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .collect(Collectors.toList());
        }
        return list;
    }

    private List<User> getOfficersInDepartment(User supervisor) {
        if (supervisor.getRole().getName() == RoleType.ADMIN || supervisor.getDepartment() == null) {
            return userRepository.findByRoleName(RoleType.FIELD_OFFICER);
        }
        List<User> list = userRepository.findByDepartmentAndRoleName(supervisor.getDepartment(), RoleType.FIELD_OFFICER);
        if (list.isEmpty()) {
            list = userRepository.findByRoleName(RoleType.FIELD_OFFICER).stream()
                    .filter(u -> isSameDepartment(u.getDepartment(), supervisor.getDepartment()))
                    .collect(Collectors.toList());
        }
        if (list.isEmpty()) {
            list = userRepository.findByRoleName(RoleType.FIELD_OFFICER);
        }
        return list;
    }

    private void validateSupervisorAccess(User supervisor, ServiceRequest app) {
        if (supervisor.getRole().getName() == RoleType.ADMIN) {
            return;
        }
        if (supervisor.getRole().getName() != RoleType.DEPARTMENT_SUPERVISOR) {
            throw new UnauthorizedException("Only supervisors or administrators can perform this action.");
        }
        if (supervisor.getDepartment() != null && app.getDepartment() != null &&
                !isSameDepartment(supervisor.getDepartment(), app.getDepartment())) {
            throw new UnauthorizedException("You cannot oversee applications outside your assigned department.");
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
}
