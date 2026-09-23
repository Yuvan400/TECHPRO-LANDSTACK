package com.landstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {
    private Long totalCitizens;
    private Long totalStaff;
    private Long totalDepartments;
    private Long totalServices;
    private Long totalParcels;

    private Long totalApplications;
    private Long pendingApplications;
    private Long approvedApplications;
    private Long rejectedApplications;

    private Long activeOfficersCount;

    private Map<String, Long> applicationsByDepartment;
    private Map<String, Long> applicationsByStatus;
    private Map<String, Long> parcelVerificationStats;
    private Map<String, Long> landUseDistribution;
}
