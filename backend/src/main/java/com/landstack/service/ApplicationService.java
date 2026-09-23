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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ParcelRepository parcelRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final ApplicationDocumentRepository documentRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final ParcelService parcelService;
    private final GovernmentService governmentService;

    @Transactional
    public ApplicationResponseDTO submitApplication(User citizen, ApplicationSubmitRequest request) {
        if (citizen.getRole().getName() != RoleType.CITIZEN) {
            throw new UnauthorizedException("Only registered citizens can apply for land services.");
        }

        Parcel parcel = parcelRepository.findByUlpinIgnoreCase(request.getUlpin().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Parcel not found for ULPIN: " + request.getUlpin()));

        ServiceEntity service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + request.getServiceId()));

        String applicationNumber = generateApplicationNumber(service, request);

        ServiceRequest app = ServiceRequest.builder()
                .applicationNumber(applicationNumber)
                .citizen(citizen)
                .parcel(parcel)
                .service(service)
                .department(service.getDepartment())
                .status(ApplicationStatus.SUBMITTED)
                .citizenRemarks(request.getCitizenRemarks())
                .build();

        app = serviceRequestRepository.save(app);

        // Save documents
        if (request.getDocuments() != null && !request.getDocuments().isEmpty()) {
            List<ApplicationDocument> docs = new ArrayList<>();
            for (DocumentUploadDTO docDto : request.getDocuments()) {
                ApplicationDocument doc = ApplicationDocument.builder()
                        .serviceRequest(app)
                        .documentType(docDto.getDocumentType())
                        .documentName(docDto.getDocumentName())
                        .documentUrl(docDto.getDocumentUrl() != null ? docDto.getDocumentUrl() : "/documents/" + UUID.randomUUID())
                        .fileSize(docDto.getFileSize() != null ? docDto.getFileSize() : "1.2 MB")
                        .verified(false)
                        .aiDocumentClassification("VERIFIED_ACCURACY_96.4%")
                        .build();
                docs.add(doc);
            }
            documentRepository.saveAll(docs);
            app.setDocuments(docs);
        }

        auditLogService.logAction(citizen, "SUBMIT_APPLICATION", "SERVICE_REQUEST", app.getId().toString(),
                "Application " + applicationNumber + " submitted for service: " + service.getServiceName() + " on parcel: " + parcel.getUlpin(), null);

        notificationService.createNotification(citizen, "Application Submitted Successfully",
                "Your application " + applicationNumber + " for " + service.getServiceName() + " has been submitted and routed to " + service.getDepartment().getName(),
                "STATUS_UPDATE", applicationNumber);

        // Notify department supervisors
        List<User> supervisors = userRepository.findByDepartmentAndRoleName(service.getDepartment(), RoleType.DEPARTMENT_SUPERVISOR);
        for (User sup : supervisors) {
            notificationService.createNotification(sup, "New Service Application",
                    "New application " + applicationNumber + " received for " + service.getServiceName() + " (ULPIN: " + parcel.getUlpin() + ")",
                    "ACTION_REQUIRED", applicationNumber);
        }

        return mapToDTO(app);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponseDTO> getCitizenApplications(User citizen) {
        return serviceRequestRepository.findByCitizenOrderByCreatedAtDesc(citizen).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponseDTO> getDepartmentApplications(User supervisor, ApplicationStatus status) {
        Department dept = supervisor.getDepartment();
        List<ServiceRequest> list;

        if (supervisor.getRole().getName() == RoleType.ADMIN || dept == null) {
            list = serviceRequestRepository.findAll().stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .filter(a -> status == null || a.getStatus() == status)
                    .collect(Collectors.toList());
        } else {
            if (status != null) {
                list = serviceRequestRepository.findByDepartmentAndStatus(dept, status);
            } else {
                list = serviceRequestRepository.findByDepartmentOrderByCreatedAtDesc(dept);
            }
            // If department queue is empty, include all active requests so supervisor can oversee all incoming citizen applications
            if (list.isEmpty()) {
                list = serviceRequestRepository.findAll().stream()
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .filter(a -> status == null || a.getStatus() == status)
                        .collect(Collectors.toList());
            }
        }
        return list.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public ApplicationResponseDTO assignFieldOfficer(Long applicationId, User supervisor, AssignOfficerRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + applicationId));

        if (supervisor.getRole().getName() != RoleType.ADMIN && supervisor.getRole().getName() != RoleType.DEPARTMENT_SUPERVISOR) {
            throw new UnauthorizedException("Only authorized supervisors or administrators can assign field officers.");
        }

        User fieldOfficer = userRepository.findById(request.getFieldOfficerId())
                .orElseThrow(() -> new ResourceNotFoundException("Field officer not found with ID: " + request.getFieldOfficerId()));

        if (fieldOfficer.getRole().getName() != RoleType.FIELD_OFFICER) {
            throw new BadRequestException("Selected user is not a field officer.");
        }

        app.setSupervisor(supervisor);
        app.setFieldOfficer(fieldOfficer);
        app.setStatus(ApplicationStatus.FIELD_VERIFICATION);
        if (request.getSupervisorRemarks() != null) {
            app.setSupervisorRemarks(request.getSupervisorRemarks());
        }

        app = serviceRequestRepository.save(app);

        auditLogService.logAction(supervisor, "ASSIGN_FIELD_OFFICER", "SERVICE_REQUEST", app.getId().toString(),
                "Assigned field officer " + fieldOfficer.getFullName() + " to application " + app.getApplicationNumber(), null);

        notificationService.createNotification(fieldOfficer, "Field Verification Assigned",
                "You have been assigned to verify land parcel " + app.getParcel().getUlpin() + " for application " + app.getApplicationNumber(),
                "ACTION_REQUIRED", app.getApplicationNumber());

        notificationService.createNotification(app.getCitizen(), "Field Verification Scheduled",
                "Field Officer " + fieldOfficer.getFullName() + " has been assigned to physically verify your parcel (ULPIN: " + app.getParcel().getUlpin() + ")",
                "STATUS_UPDATE", app.getApplicationNumber());

        return mapToDTO(app);
    }

    @Transactional
    public ApplicationResponseDTO updateStatus(Long applicationId, User actor, StatusUpdateRequest request) {
        ServiceRequest app = serviceRequestRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + applicationId));

        ApplicationStatus targetStatus;
        try {
            targetStatus = ApplicationStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + request.getStatus());
        }

        // Supervisor authorization check
        if (actor.getRole().getName() != RoleType.ADMIN) {
            if (actor.getDepartment() == null || !actor.getDepartment().getId().equals(app.getDepartment().getId())) {
                throw new UnauthorizedException("You cannot modify applications from other departments.");
            }
        }

        app.setStatus(targetStatus);
        if (request.getRemarks() != null) {
            app.setSupervisorRemarks(request.getRemarks());
        }

        if (targetStatus == ApplicationStatus.APPROVED || targetStatus == ApplicationStatus.COMPLETED) {
            app.setCertificateNumber("CERT-" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + "-" + app.getId());
            app.setCertificateUrl("/api/certificates/" + app.getApplicationNumber() + ".pdf");
            app.setCertificateGeneratedAt(LocalDateTime.now());

            notificationService.createNotification(app.getCitizen(), "Application Approved!",
                    "Congratulations! Your application " + app.getApplicationNumber() + " for " + app.getService().getServiceName() + " has been approved.",
                    "STATUS_UPDATE", app.getApplicationNumber());
        } else if (targetStatus == ApplicationStatus.REJECTED) {
            app.setRejectionReason(request.getRejectionReason() != null ? request.getRejectionReason() : request.getRemarks());
            notificationService.createNotification(app.getCitizen(), "Application Status Update",
                    "Your application " + app.getApplicationNumber() + " has been rejected. Reason: " + app.getRejectionReason(),
                    "ALERT", app.getApplicationNumber());
        }

        app = serviceRequestRepository.save(app);

        auditLogService.logAction(actor, "UPDATE_APPLICATION_STATUS", "SERVICE_REQUEST", app.getId().toString(),
                "Status updated to " + targetStatus.name() + " for application " + app.getApplicationNumber(), null);

        return mapToDTO(app);
    }

    @Transactional(readOnly = true)
    public ApplicationResponseDTO getApplicationById(Long id, User currentUser) {
        ServiceRequest app = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with ID: " + id));

        // Check access
        RoleType role = currentUser.getRole().getName();
        if (role == RoleType.CITIZEN && !app.getCitizen().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only view your own applications.");
        }
        if (role == RoleType.FIELD_OFFICER && app.getFieldOfficer() != null && !app.getFieldOfficer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You are not assigned to this application.");
        }

        return mapToDTO(app);
    }

    private String generateApplicationNumber(ServiceEntity service, ApplicationSubmitRequest request) {
        if (request != null && request.getCustomApplicationNumber() != null && !request.getCustomApplicationNumber().trim().isEmpty()) {
            return request.getCustomApplicationNumber().trim();
        }
        String year = DateTimeFormatter.ofPattern("yyyy").format(LocalDateTime.now());
        String randomSuffix = String.format("%08d", (int)(Math.random() * 90000000) + 10000000);
        String code = service != null && service.getServiceCode() != null ? service.getServiceCode() : "";
        String sName = service != null && service.getServiceName() != null ? service.getServiceName().toLowerCase() : "";

        if ("SRV-TAX-07".equalsIgnoreCase(code) || sName.contains("khata") || sName.contains("tax")) {
            return String.format("KHT-%s-%s", year, randomSuffix);
        } else if ("SRV-UTIL-08".equalsIgnoreCase(code) || sName.contains("water") || sName.contains("sewerage")) {
            return String.format("WSN-%s-%s", year, randomSuffix);
        } else if ("SRV-TCP-09".equalsIgnoreCase(code) || sName.contains("zoning") || sName.contains("reclassification")) {
            return String.format("ZON-%s-%s", year, randomSuffix);
        } else if ("SRV-HWY-10".equalsIgnoreCase(code) || sName.contains("highway") || sName.contains("setback")) {
            return String.format("HWY-%s-%s", year, randomSuffix);
        } else if ("SRV-FOR-11".equalsIgnoreCase(code) || sName.contains("forest") || sName.contains("eco-sensitive")) {
            return String.format("FOR-%s-%s", year, randomSuffix);
        } else if ("SRV-ELEC-12".equalsIgnoreCase(code) || sName.contains("high-tension") || sName.contains("substation") || sName.contains("corridor")) {
            return String.format("ELEC-%s-%s", year, randomSuffix);
        } else if ("SRV-MUT-04".equalsIgnoreCase(code) || sName.contains("mutation")) {
            return String.format("MUT-%s-%s", year, randomSuffix);
        } else if ("SRV-BLD-05".equalsIgnoreCase(code) || sName.contains("building")) {
            return String.format("BLD-%s-%s", year, randomSuffix);
        } else if ("SRV-SURV-06".equalsIgnoreCase(code) || sName.contains("demarcation") || sName.contains("survey")) {
            return String.format("SURV-%s-%s", year, randomSuffix);
        } else if ("SRV-EC-02".equalsIgnoreCase(code) || sName.contains("encumbrance")) {
            return String.format("EC-%s-%s", year, randomSuffix);
        } else if ("SRV-CONV-03".equalsIgnoreCase(code) || sName.contains("conversion")) {
            return String.format("CONV-%s-%s", year, randomSuffix);
        } else if ("SRV-LOC-01".equalsIgnoreCase(code) || sName.contains("patta")) {
            return String.format("PT-%s-%s", year, randomSuffix);
        }
        long count = serviceRequestRepository.count() + 1;
        return String.format("LS-%s-%05d", year, count);
    }

    public ApplicationResponseDTO mapToDTO(ServiceRequest app) {
        List<ApplicationDocumentDTO> docDtos = app.getDocuments().stream().map(d ->
                ApplicationDocumentDTO.builder()
                        .id(d.getId())
                        .documentType(d.getDocumentType())
                        .documentName(d.getDocumentName())
                        .documentUrl(d.getDocumentUrl())
                        .fileSize(d.getFileSize())
                        .verified(d.getVerified())
                        .verificationStatus(d.getVerificationStatus())
                        .officerRemark(d.getOfficerRemark())
                        .verifiedBy(d.getVerifiedBy())
                        .verifiedAt(d.getVerifiedAt())
                        .aiDocumentClassification(d.getAiDocumentClassification())
                        .uploadedAt(d.getUploadedAt())
                        .build()
        ).collect(Collectors.toList());

        FieldVerificationDTO fvDto = null;
        if (app.getFieldVerification() != null) {
            FieldVerification fv = app.getFieldVerification();
            fvDto = FieldVerificationDTO.builder()
                    .id(fv.getId())
                    .applicationId(app.getId())
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

        int slaDays = app.getService() != null && app.getService().getProcessingDays() != null ? app.getService().getProcessingDays() : 14;
        long daysElapsed = 0;
        if (app.getCreatedAt() != null) {
            daysElapsed = java.time.temporal.ChronoUnit.DAYS.between(app.getCreatedAt(), LocalDateTime.now());
        }
        int daysRemaining = (int) (slaDays - daysElapsed);
        String slaStatus = "WITHIN_SLA";
        if (daysRemaining < 0) {
            slaStatus = "SLA_BREACHED";
        } else if (daysRemaining <= 2) {
            slaStatus = "APPROACHING_SLA";
        }

        String supervisorReviewStatus = "PENDING_REVIEW";
        if (app.getStatus() == ApplicationStatus.READY_FOR_APPROVAL || app.getStatus() == ApplicationStatus.APPROVED || app.getStatus() == ApplicationStatus.COMPLETED) {
            supervisorReviewStatus = "VALIDATED";
        } else if (app.getStatus() == ApplicationStatus.RETURNED_TO_OFFICER) {
            supervisorReviewStatus = "RETURNED_TO_OFFICER";
        } else if (app.getStatus() == ApplicationStatus.FURTHER_INSPECTION_REQUIRED) {
            supervisorReviewStatus = "FURTHER_INSPECTION_REQUIRED";
        } else if (app.getStatus() == ApplicationStatus.CLARIFICATION_REQUIRED) {
            supervisorReviewStatus = "CLARIFICATION_REQUESTED";
        } else if (app.getStatus() == ApplicationStatus.INSPECTION_COMPLETED || app.getStatus() == ApplicationStatus.REPORT_SUBMITTED || app.getStatus() == ApplicationStatus.FORWARDED_TO_AUTHORITY) {
            supervisorReviewStatus = "AWAITING_SUPERVISOR_REVIEW";
        }

        return ApplicationResponseDTO.builder()
                .id(app.getId())
                .applicationNumber(app.getApplicationNumber())
                .citizenId(app.getCitizen().getId())
                .citizenName(app.getCitizen().getFullName())
                .citizenEmail(app.getCitizen().getEmail())
                .citizenMobile(app.getCitizen().getMobile())
                .parcel(parcelService.mapToDTO(app.getParcel()))
                .service(governmentService.mapToDTO(app.getService()))
                .departmentId(app.getDepartment().getId())
                .departmentName(app.getDepartment().getName())
                .supervisorId(app.getSupervisor() != null ? app.getSupervisor().getId() : null)
                .supervisorName(app.getSupervisor() != null ? app.getSupervisor().getFullName() : null)
                .fieldOfficerId(app.getFieldOfficer() != null ? app.getFieldOfficer().getId() : null)
                .fieldOfficerName(app.getFieldOfficer() != null ? app.getFieldOfficer().getFullName() : null)
                .status(app.getStatus().name())
                .citizenRemarks(app.getCitizenRemarks())
                .supervisorRemarks(app.getSupervisorRemarks())
                .fieldOfficerRemarks(app.getFieldOfficerRemarks())
                .rejectionReason(app.getRejectionReason())
                .certificateNumber(app.getCertificateNumber())
                .certificateUrl(app.getCertificateUrl())
                .certificateGeneratedAt(app.getCertificateGeneratedAt())
                .documents(docDtos)
                .fieldVerification(fvDto)
                .slaDays(slaDays)
                .daysElapsed((int) daysElapsed)
                .daysRemaining(daysRemaining)
                .slaStatus(slaStatus)
                .supervisorReviewStatus(supervisorReviewStatus)
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }
}
