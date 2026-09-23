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
public class ForwardAuthorityRequest {
    @NotNull
    private Long applicationId;

    @NotBlank
    private String officerFinding; // "Verified", "Verified with Remarks", "Clarification Required", "Further Inspection Required", "Not Verified"

    private String remarks;
}
