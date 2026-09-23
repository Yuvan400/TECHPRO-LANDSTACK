package com.landstack.service;

import com.landstack.dto.AdminDashboardStatsDTO;
import com.landstack.dto.StaffCreateRequest;
import com.landstack.dto.SupervisorDashboardStatsDTO;
import com.landstack.dto.UserDTO;
import com.landstack.entity.*;
import com.landstack.exception.BadRequestException;
import com.landstack.exception.ResourceNotFoundException;
import com.landstack.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final ServiceRepository serviceRepository;
    private final ParcelRepository parcelRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserDTO> getAllStaff() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole().getName() != RoleType.CITIZEN)
                .map(this::mapUserToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getFieldOfficersByDepartment(Long departmentId) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        return userRepository.findByDepartmentAndRoleName(dept, RoleType.FIELD_OFFICER).stream()
                .filter(User::getActive)
                .map(this::mapUserToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO createStaff(User admin, StaffCreateRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("User already exists with email: " + email);
        }

        RoleType roleType;
        try {
            roleType = RoleType.valueOf(request.getRole().trim().toUpperCase());
            if (roleType != RoleType.DEPARTMENT_SUPERVISOR && roleType != RoleType.FIELD_OFFICER) {
                throw new BadRequestException("Admin can only create DEPARTMENT_SUPERVISOR or FIELD_OFFICER accounts");
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid staff role: " + request.getRole());
        }

        Role role = roleRepository.findByName(roleType)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleType));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + request.getDepartmentId()));

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .mobile(request.getMobile())
                .role(role)
                .department(department)
                .designation(request.getDesignation() != null ? request.getDesignation() : roleType.name().replace('_', ' '))
                .employeeCode(request.getEmployeeCode() != null ? request.getEmployeeCode() : "GOV-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .active(true)
                .build();

        user = userRepository.save(user);

        auditLogService.logAction(admin, "CREATE_STAFF", "USER", user.getId().toString(),
                "Created new " + roleType.name() + " account: " + user.getEmail() + " assigned to " + department.getName(), null);

        return mapUserToDTO(user);
    }

    @Transactional
    public UserDTO updateStaff(Long id, User admin, StaffCreateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff user not found with ID: " + id));

        user.setFullName(request.getFullName().trim());
        user.setMobile(request.getMobile());
        user.setDesignation(request.getDesignation());
        user.setEmployeeCode(request.getEmployeeCode());

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + request.getDepartmentId()));
            user.setDepartment(dept);
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        user = userRepository.save(user);

        auditLogService.logAction(admin, "UPDATE_STAFF", "USER", user.getId().toString(),
                "Updated staff account: " + user.getEmail(), null);

        return mapUserToDTO(user);
    }

    @Transactional
    public void toggleStaffStatus(Long id, User admin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        user.setActive(!user.getActive());
        userRepository.save(user);

        auditLogService.logAction(admin, "TOGGLE_STAFF_STATUS", "USER", user.getId().toString(),
                "Changed active status to " + user.getActive() + " for " + user.getEmail(), null);
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDTO getAdminDashboardStats() {
        long totalCitizens = userRepository.findByRoleName(RoleType.CITIZEN).size();
        long totalSupervisors = userRepository.findByRoleName(RoleType.DEPARTMENT_SUPERVISOR).size();
        long totalOfficers = userRepository.findByRoleName(RoleType.FIELD_OFFICER).size();
        long totalAdmins = userRepository.findByRoleName(RoleType.ADMIN).size();
        long totalStaff = totalSupervisors + totalOfficers + totalAdmins;

        long totalDepartments = departmentRepository.count();
        long totalServices = serviceRepository.count();
        long totalParcels = parcelRepository.count();

        long totalApps = serviceRequestRepository.count();
        long pending = serviceRequestRepository.countByStatus(ApplicationStatus.SUBMITTED)
                     + serviceRequestRepository.countByStatus(ApplicationStatus.UNDER_REVIEW)
                     + serviceRequestRepository.countByStatus(ApplicationStatus.FIELD_VERIFICATION);
        long approved = serviceRequestRepository.countByStatus(ApplicationStatus.APPROVED)
                      + serviceRequestRepository.countByStatus(ApplicationStatus.COMPLETED);
        long rejected = serviceRequestRepository.countByStatus(ApplicationStatus.REJECTED);

        Map<String, Long> statusMap = new HashMap<>();
        for (Object[] row : serviceRequestRepository.countApplicationsByStatus()) {
            statusMap.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Long> deptMap = new HashMap<>();
        for (Object[] row : serviceRequestRepository.countApplicationsByDepartment()) {
            deptMap.put(row[0].toString(), (Long) row[1]);
        }

        Map<String, Long> parcelVerif = new HashMap<>();
        parcelVerif.put("Verified", parcelRepository.countByVerificationStatus("Verified"));
        parcelVerif.put("Pending Verification", parcelRepository.countByVerificationStatus("Pending Verification"));
        parcelVerif.put("Disputed", parcelRepository.countByVerificationStatus("Disputed"));

        Map<String, Long> landUseMap = new HashMap<>();
        for (Object[] row : parcelRepository.countParcelsByLandUse()) {
            landUseMap.put(row[0].toString(), (Long) row[1]);
        }

        return AdminDashboardStatsDTO.builder()
                .totalCitizens(totalCitizens)
                .totalStaff(totalStaff)
                .totalDepartments(totalDepartments)
                .totalServices(totalServices)
                .totalParcels(totalParcels)
                .totalApplications(totalApps)
                .pendingApplications(pending)
                .approvedApplications(approved)
                .rejectedApplications(rejected)
                .activeOfficersCount(totalOfficers)
                .applicationsByDepartment(deptMap)
                .applicationsByStatus(statusMap)
                .parcelVerificationStats(parcelVerif)
                .landUseDistribution(landUseMap)
                .build();
    }

    @Transactional(readOnly = true)
    public SupervisorDashboardStatsDTO getSupervisorDashboardStats(User supervisor) {
        Department dept = supervisor.getDepartment();
        if (dept == null) {
            return SupervisorDashboardStatsDTO.builder().build();
        }

        List<ServiceRequest> deptApps = serviceRequestRepository.findByDepartmentOrderByCreatedAtDesc(dept);

        long submitted = deptApps.stream().filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED).count();
        long underReview = deptApps.stream().filter(a -> a.getStatus() == ApplicationStatus.UNDER_REVIEW).count();
        long pendingDocs = deptApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING_DOCUMENTS).count();
        long fieldVerif = deptApps.stream().filter(a -> a.getStatus() == ApplicationStatus.FIELD_VERIFICATION).count();
        long verified = deptApps.stream().filter(a -> a.getStatus() == ApplicationStatus.VERIFIED).count();
        long approved = deptApps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED || a.getStatus() == ApplicationStatus.COMPLETED).count();
        long rejected = deptApps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();

        long activeOfficers = userRepository.findByDepartmentAndRoleName(dept, RoleType.FIELD_OFFICER).size();

        Map<String, Long> statusBreakdown = new HashMap<>();
        statusBreakdown.put("SUBMITTED", submitted);
        statusBreakdown.put("UNDER_REVIEW", underReview);
        statusBreakdown.put("FIELD_VERIFICATION", fieldVerif);
        statusBreakdown.put("VERIFIED", verified);
        statusBreakdown.put("APPROVED", approved);
        statusBreakdown.put("REJECTED", rejected);

        return SupervisorDashboardStatsDTO.builder()
                .departmentName(dept.getName())
                .totalDepartmentApplications((long) deptApps.size())
                .submittedCount(submitted)
                .underReviewCount(underReview)
                .pendingDocumentsCount(pendingDocs)
                .fieldVerificationCount(fieldVerif)
                .verifiedCount(verified)
                .approvedCount(approved)
                .rejectedCount(rejected)
                .activeFieldOfficers(activeOfficers)
                .statusBreakdown(statusBreakdown)
                .build();
    }

    public UserDTO mapUserToDTO(User u) {
        return UserDTO.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .mobile(u.getMobile())
                .role(u.getRole().getName().name())
                .departmentId(u.getDepartment() != null ? u.getDepartment().getId() : null)
                .departmentName(u.getDepartment() != null ? u.getDepartment().getName() : null)
                .designation(u.getDesignation())
                .employeeCode(u.getEmployeeCode())
                .active(u.getActive())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
