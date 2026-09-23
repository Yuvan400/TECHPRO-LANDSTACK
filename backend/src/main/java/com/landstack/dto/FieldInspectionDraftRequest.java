package com.landstack.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldInspectionDraftRequest {
    @NotNull
    private Long applicationId;

    private Double gpsLatitude;
    private Double gpsLongitude;
    private Double gpsAccuracy;
    private Boolean gpsCoordinatesVerified;
    private Boolean boundaryMatchesRecord;
    private Boolean encroachmentDetected;
    private String remarks;
    private String photoUrls;
    private String officerFinding;
    private String inspectionType;
    private String reportData;
    private String verificationResult;
}
