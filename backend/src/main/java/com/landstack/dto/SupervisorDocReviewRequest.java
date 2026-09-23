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
public class SupervisorDocReviewRequest {
    @NotNull
    private Long documentId;

    @NotBlank
    private String action; // CONFIRM_VERIFIED, REJECT_VERIFICATION, REQUEST_CLARIFICATION

    private String remarks;
}
