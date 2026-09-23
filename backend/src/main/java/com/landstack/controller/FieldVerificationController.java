package com.landstack.controller;

import com.landstack.dto.*;
import com.landstack.entity.User;
import com.landstack.service.AuthService;
import com.landstack.service.FieldVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/field")
@RequiredArgsConstructor
public class FieldVerificationController {

    private final FieldVerificationService fieldVerificationService;
    private final AuthService authService;
    private final com.landstack.service.AuditLogService auditLogService;

    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<List<ApplicationResponseDTO>> getAssignedApplications(@AuthenticationPrincipal UserDetails userDetails) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.getAssignedApplications(fieldOfficer));
    }

    @GetMapping("/application/{id}")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> getApplicationById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.getApplicationById(id, fieldOfficer));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<FieldDashboardStatsDTO> getFieldStats(@AuthenticationPrincipal UserDetails userDetails) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.getFieldDashboardStats(fieldOfficer));
    }

    @PostMapping("/document/verify")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<ApplicationDocumentDTO> verifyDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DocumentVerificationRequest request) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.verifyDocument(fieldOfficer, request));
    }

    @PostMapping("/inspection/schedule")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<FieldVerificationDTO> scheduleInspection(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ScheduleInspectionRequest request) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.scheduleInspection(fieldOfficer, request));
    }

    @PostMapping("/inspection/save-draft")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<FieldVerificationDTO> saveDraft(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FieldInspectionDraftRequest request) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.saveDraft(fieldOfficer, request));
    }

    @PostMapping("/inspection/submit-report")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<FieldVerificationDTO> submitInspectionReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FieldInspectionDraftRequest request) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.submitInspectionReport(fieldOfficer, request));
    }

    @PostMapping("/inspection/clarification")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> requestClarification(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ClarificationRequestDTO request) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.requestClarification(fieldOfficer, request));
    }

    @PostMapping("/inspection/forward")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> forwardToAuthority(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ForwardAuthorityRequest request) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(fieldVerificationService.forwardToAuthority(fieldOfficer, request));
    }

    @PostMapping("/verification")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<FieldVerificationDTO> submitVerification(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FieldVerificationRequest request) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return new ResponseEntity<>(fieldVerificationService.submitVerification(fieldOfficer, request), HttpStatus.CREATED);
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAnyRole('FIELD_OFFICER', 'ADMIN')")
    public ResponseEntity<List<AuditLogDTO>> getOfficerAuditLogs(@AuthenticationPrincipal UserDetails userDetails) {
        User fieldOfficer = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(auditLogService.getLogsByUser(fieldOfficer));
    }
}
