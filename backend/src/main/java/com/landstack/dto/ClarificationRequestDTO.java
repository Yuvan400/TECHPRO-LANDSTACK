package com.landstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClarificationRequestDTO {
    @NotNull
    private Long applicationId;

    @NotBlank
    private String category; // e.g. "DOCUMENT_DEFICIENCY", "BOUNDARY_DISCREPANCY", "LAND_USE_CLARIFICATION", "OTHER"

    @NotBlank
    private String message;

    private String requiredDocument;

    private LocalDate dueDate;
}
