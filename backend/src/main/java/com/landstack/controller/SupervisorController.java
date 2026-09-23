package com.landstack.controller;

import com.landstack.dto.*;
import com.landstack.entity.User;
import com.landstack.service.AuthService;
import com.landstack.service.SupervisorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/supervisor")
@RequiredArgsConstructor
public class SupervisorController {

    private final SupervisorService supervisorService;
    private final AuthService authService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<SupervisorDashboardStatsDTO> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.getSupervisorDashboardStats(supervisor));
    }

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<List<ApplicationResponseDTO>> getApplications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String queue,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long serviceId,
            @RequestParam(required = false) Long officerId) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.getDepartmentApplications(supervisor, queue, status, search, serviceId, officerId));
    }

    @GetMapping("/application/{id}")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> getApplicationById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.getApplicationById(id, supervisor));
    }

    @GetMapping("/officers")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<List<OfficerWorkloadDTO>> getOfficers(@AuthenticationPrincipal UserDetails userDetails) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.getDepartmentOfficersWorkload(supervisor));
    }

    @GetMapping("/suggest-officer/{applicationId}")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<List<OfficerWorkloadDTO>> suggestOfficer(
            @PathVariable Long applicationId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.suggestOfficersForApplication(applicationId, supervisor));
    }

    @PostMapping("/assign-officer")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> assignOfficer(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupervisorAssignRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.assignOfficer(supervisor, request));
    }

    @PostMapping("/document/review")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationDocumentDTO> reviewDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupervisorDocReviewRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.reviewDocument(supervisor, request));
    }

    @PostMapping("/review/return")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> returnToOfficer(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupervisorReturnRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.returnToOfficer(supervisor, request));
    }

    @PostMapping("/review/further-inspection")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> requestFurtherInspection(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupervisorFurtherInspectionRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.requestFurtherInspection(supervisor, request));
    }

    @PostMapping("/clarification")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> requestClarification(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ClarificationRequestDTO request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.requestClarification(supervisor, request));
    }

    @PostMapping("/review/forward")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> forwardToApprovingAuthority(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupervisorForwardRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.forwardToApprovingAuthority(supervisor, request));
    }

    @PostMapping("/decision")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> processDecision(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupervisorDecisionRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.processSupervisorDecision(supervisor, request));
    }

    @PostMapping("/correct-detail")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> correctDetail(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupervisorDetailCorrectionRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.correctApplicationDetail(supervisor, request));
    }

    @PostMapping("/instruction")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<?> sendInstruction(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SupervisorInstructionRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        supervisorService.sendOfficerInstruction(supervisor, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<List<AuditLogDTO>> getAuditLogs(@AuthenticationPrincipal UserDetails userDetails) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(supervisorService.getSupervisorAuditLogs(supervisor));
    }
}
