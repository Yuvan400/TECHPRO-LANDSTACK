package com.landstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FieldVerificationRequest {

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    private Double gpsLatitude;
    private Double gpsLongitude;

    private Boolean gpsCoordinatesVerified = true;
    private Boolean boundaryMatchesRecord = true;
    private Boolean encroachmentDetected = false;

    @NotBlank(message = "Remarks are required")
    private String remarks;

    private String photoUrls;

    @NotBlank(message = "Verification result is required")
    private String verificationResult; // VERIFIED_COMPLIANT, DISCREPANCY_FOUND, ENCROACHMENT_FLAGGED
}
