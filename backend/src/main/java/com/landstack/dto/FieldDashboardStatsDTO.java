package com.landstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldDashboardStatsDTO {
    // Section 8: Officer Dashboard Summary (6 Metrics)
    private Long todaysTasks;
    private Long pendingTasks;
    private Long completedTasks;
    private Long overdueTasks;
    private Long pendingVerification;
    private Long escalatedCases;

    // Existing fields for backwards compatibility
    private Long assignedInspectionsCount;
    private Long pendingVerificationCount;
    private Long completedVerificationCount;
    private Long todayVisitsCount;

    // Field Officer Dashboard 7 Summary Metrics
    private Long assignedApplicationsCount;
    private Long pendingDocVerificationCount;
    private Long fieldInspectionsRequiredCount;
    private Long inspectionsCompletedCount;
    private Long reportsPendingCount;
    private Long clarificationsRequiredCount;
    private Long completedApplicationsCount;

    // Work Queue counts
    private Long inspectionsTodayCount;
    private Long reportsDueTodayCount;
    private Long overdueInspectionsCount;
}
