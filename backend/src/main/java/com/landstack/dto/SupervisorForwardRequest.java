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
public class SupervisorForwardRequest {
    @NotNull
    private Long applicationId;

    @NotBlank
    private String validationFinding; // e.g. "Verified", "Verified with Remarks", "Recommended for Statutory Sanction"

    private String remarks;

    private String approvingAuthorityRole; // e.g. "DISTRICT_COLLECTOR", "TAHSILDAR", "CHIEF_TOWN_PLANNER"
}
