package com.landstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfficerWorkloadDTO {
    private Long officerId;
    private String officerName;
    private String employeeCode;
    private String designation;
    private String departmentName;
    private String email;
    private String mobile;
    private String district;
    private String taluk;
    private String status; // Active, On Leave, Inactive
    private Long totalAssigned;
    private Long pendingDocVerification;
    private Long fieldInspectionsPending;
    private Long inspectionsCompleted;
    private Long reportsPending;
    private Long clarificationsPending;
    private Long overdue;
    private Long completed;
    private Double averageProcessingDays;
    private Integer workloadScore;
    private String suggestionReason;
}
