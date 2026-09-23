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
public class SupervisorDashboardStatsDTO {
    private String departmentName;
    private String departmentCode;

    // 9 Exact Supervisor Dashboard Summary Metrics (Section 7)
    private Long newApplications;
    private Long assignedApplications;
    private Long applicationsUnderOfficerReview;
    private Long pendingVerification;
    private Long approved;
    private Long rejected;
    private Long returnedForCorrection;
    private Long escalated;
    private Long overdueApplications;

    // Section 11: Supervisor Dashboard Summary (8 Metrics)
    private Long todaysReviews;
    private Long pendingReviews;
    private Long completedReviews;
    private Long overdueReviews;
    private Long returnedApplications;
    private Long pendingOfficerReports;
    private Long escalatedCases;
    private Long awaitingForwarding;

    // Additional Supervisor Metrics & Aliases
    private Long totalApplications;
    private Long pendingAssignment;
    private Long assignedToOfficers;
    private Long underFieldVerification;
    private Long reportsAwaitingReview;
    private Long returnedToOfficers;
    private Long clarificationsPending;
    private Long readyForApproval;

    // Backward compatibility fields
    private Long totalDepartmentApplications;
    private Long submittedCount;
    private Long underReviewCount;
    private Long pendingDocumentsCount;
    private Long fieldVerificationCount;
    private Long verifiedCount;
    private Long approvedCount;
    private Long rejectedCount;
    private Long activeFieldOfficers;
    private Map<String, Long> statusBreakdown;
}
