package com.landstack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceDTO {
    private Long id;

    @NotBlank(message = "Service code is required")
    private String serviceCode;

    @NotBlank(message = "Service name is required")
    private String serviceName;

    private String description;

    @NotNull(message = "Department ID is required")
    private Long departmentId;
    private String departmentName;

    private String requiredDocuments;
    private Integer processingDays;
    private Double feeInr;
    private Boolean active;
    private LocalDateTime createdAt;
}
