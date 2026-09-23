package com.landstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldVerificationDTO {
    private Long id;
    private Long applicationId;
    private Long fieldOfficerId;
    private String fieldOfficerName;
    private LocalDateTime inspectionDate;
    private LocalDateTime scheduledDate;
    private String inspectionNumber;
    private String inspectionType;
    private Double gpsLatitude;
    private Double gpsLongitude;
    private Double gpsAccuracy;
    private Boolean gpsCoordinatesVerified;
    private Boolean boundaryMatchesRecord;
    private Boolean encroachmentDetected;
    private String remarks;
    private String photoUrls;
    private String officerFinding;
    private String status;
    private String reportData;
    private String verificationResult;
    private LocalDateTime submittedAt;
}
