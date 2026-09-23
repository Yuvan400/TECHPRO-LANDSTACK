package com.landstack.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignOfficerRequest {
    @NotNull(message = "Field Officer ID is required")
    private Long fieldOfficerId;

    private String supervisorRemarks;
}
