package com.landstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupervisorReturnRequest {
    @NotNull
    private Long applicationId;

    @NotBlank
    private String returnReason; // e.g. "Missing photograph", "GPS mismatch", "Incomplete measurement", "Boundary discrepancy", "Document not verified", "Insufficient observation", "Incorrect service parameter"

    private String requiredCorrection;

    private String additionalEvidenceRequired;
}
