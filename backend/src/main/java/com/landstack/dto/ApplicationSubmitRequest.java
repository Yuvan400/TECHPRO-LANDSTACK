package com.landstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ApplicationSubmitRequest {

    @NotBlank(message = "ULPIN is required")
    private String ulpin;

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    private String citizenRemarks;

    private String customApplicationNumber;

    private List<DocumentUploadDTO> documents;
}
