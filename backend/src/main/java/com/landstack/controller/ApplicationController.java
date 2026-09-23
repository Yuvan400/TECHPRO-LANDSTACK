package com.landstack.controller;

import com.landstack.dto.ApplicationResponseDTO;
import com.landstack.dto.ApplicationSubmitRequest;
import com.landstack.dto.AssignOfficerRequest;
import com.landstack.dto.StatusUpdateRequest;
import com.landstack.entity.ApplicationStatus;
import com.landstack.entity.User;
import com.landstack.service.ApplicationService;
import com.landstack.service.AuthService;
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
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final AuthService authService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CITIZEN', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> submitApplication(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ApplicationSubmitRequest request) {
        User citizen = authService.getUserByEmail(userDetails.getUsername());
        return new ResponseEntity<>(applicationService.submitApplication(citizen, request), HttpStatus.CREATED);
    }

    @GetMapping("/citizen")
    @PreAuthorize("hasAnyRole('CITIZEN', 'ADMIN')")
    public ResponseEntity<List<ApplicationResponseDTO>> getCitizenApplications(@AuthenticationPrincipal UserDetails userDetails) {
        User citizen = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(applicationService.getCitizenApplications(citizen));
    }

    @GetMapping("/supervisor")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<List<ApplicationResponseDTO>> getDepartmentApplications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) ApplicationStatus status) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(applicationService.getDepartmentApplications(supervisor, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationResponseDTO> getApplicationById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(applicationService.getApplicationById(id, currentUser));
    }

    @PostMapping("/{id}/assign-officer")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> assignOfficer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AssignOfficerRequest request) {
        User supervisor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(applicationService.assignFieldOfficer(id, supervisor, request));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DEPARTMENT_SUPERVISOR', 'ADMIN')")
    public ResponseEntity<ApplicationResponseDTO> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StatusUpdateRequest request) {
        User actor = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(applicationService.updateStatus(id, actor, request));
    }
}
