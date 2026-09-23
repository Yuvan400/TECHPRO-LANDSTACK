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
public class SupervisorInstructionRequest {

    @NotNull(message = "Target Field Officer ID is required")
    private Long officerId;

    private Long applicationId;

    private String priority; // NORMAL, HIGH, URGENT

    @NotBlank(message = "Supervisor instruction directive text is required")
    private String instruction;
}
