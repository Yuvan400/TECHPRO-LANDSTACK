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
public class SupervisorDecisionRequest {

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotBlank(message = "Decision action is required (APPROVE, REJECT, RETURN_CORRECTION, ESCALATE)")
    private String decision;

    // For APPROVE or general remarks
    private String remarks;

    // For REJECT (mandatory)
    private String reason;

    // For RETURN_CORRECTION
    private String requiredCorrection;
    private String additionalInfo;

    // For ESCALATE (to Admin)
    private String issueType;
    private String description;
    private String priority; // NORMAL, HIGH, URGENT
}
