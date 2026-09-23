package com.landstack.controller;

import com.landstack.dto.*;
import com.landstack.entity.User;
import com.landstack.service.AdminService;
import com.landstack.service.AuthService;
import com.landstack.service.DepartmentService;
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
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final DepartmentService departmentService;
    private final AuthService authService;

    // --- Staff Management ---
    @GetMapping("/api/admin/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllStaff() {
        return ResponseEntity.ok(adminService.getAllStaff());
    }

    @PostMapping("/api/admin/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> createStaff(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StaffCreateRequest request) {
        User admin = authService.getUserByEmail(userDetails.getUsername());
        return new ResponseEntity<>(adminService.createStaff(admin, request), HttpStatus.CREATED);
    }

    @PutMapping("/api/admin/staff/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateStaff(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StaffCreateRequest request) {
        User admin = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(adminService.updateStaff(id, admin, request));
    }

    @PatchMapping("/api/admin/staff/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleStaffStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User admin = authService.getUserByEmail(userDetails.getUsername());
        adminService.toggleStaffStatus(id, admin);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/admin/departments/{id}/officers")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPARTMENT_SUPERVISOR')")
    public ResponseEntity<List<UserDTO>> getDepartmentOfficers(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getFieldOfficersByDepartment(id));
    }

    // --- Department Management ---
    @GetMapping("/api/admin/departments")
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @PostMapping("/api/admin/departments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDTO> createDepartment(@Valid @RequestBody DepartmentDTO dto) {
        return new ResponseEntity<>(departmentService.createDepartment(dto), HttpStatus.CREATED);
    }

    @PutMapping("/api/admin/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DepartmentDTO> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentDTO dto) {
        return ResponseEntity.ok(departmentService.updateDepartment(id, dto));
    }

    @PatchMapping("/api/admin/departments/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleDepartmentStatus(@PathVariable Long id) {
        departmentService.toggleActiveStatus(id);
        return ResponseEntity.ok().build();
    }

    // --- Analytics / Dashboard Stats ---
    @GetMapping("/api/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardStatsDTO> getAdminStats() {
        return ResponseEntity.ok(adminService.getAdminDashboardStats());
    }
}
