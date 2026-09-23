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
public class DocumentVerificationRequest {
    @NotNull
    private Long documentId;

    @NotNull
    private String verificationStatus; // VERIFIED, NOT_VERIFIED, REQUIRES_CLARIFICATION

    private String officerRemark;
}
