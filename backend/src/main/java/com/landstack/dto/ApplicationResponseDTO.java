package com.landstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponseDTO {
    private Long id;
    private String applicationNumber;

    private Long citizenId;
    private String citizenName;
    private String citizenEmail;
    private String citizenMobile;

    private ParcelDTO parcel;
    private ServiceDTO service;

    private Long departmentId;
    private String departmentName;

    private Long supervisorId;
    private String supervisorName;

    private Long fieldOfficerId;
    private String fieldOfficerName;

    private String status;

    private String citizenRemarks;
    private String supervisorRemarks;
    private String fieldOfficerRemarks;
    private String rejectionReason;

    private String certificateNumber;
    private String certificateUrl;
    private LocalDateTime certificateGeneratedAt;

    private List<ApplicationDocumentDTO> documents;
    private FieldVerificationDTO fieldVerification;

    // SLA & Review Tracking
    private Integer slaDays;
    private Integer daysElapsed;
    private Integer daysRemaining;
    private String slaStatus;
    private LocalDateTime assignedAt;
    private String supervisorReviewStatus;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
