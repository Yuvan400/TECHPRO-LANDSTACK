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
public class SupervisorDetailCorrectionRequest {

    @NotNull(message = "Application ID is required")
    private Long applicationId;

    @NotBlank(message = "Field name being corrected is required (e.g., areaAcre, boundaryStonesStatus)")
    private String fieldName;

    private String previousValue;

    @NotBlank(message = "Updated value is required")
    private String updatedValue;

    @NotBlank(message = "Auditable reason for correction is mandatory")
    private String reason;
}
