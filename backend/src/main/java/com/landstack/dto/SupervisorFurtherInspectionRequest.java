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
public class SupervisorFurtherInspectionRequest {
    @NotNull
    private Long applicationId;

    @NotBlank
    private String reason;

    private String inspectionType;

    private String specificLocation;

    private String instructions;
}
