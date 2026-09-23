package com.landstack.service;

import com.landstack.dto.AuthResponse;
import com.landstack.dto.LoginRequest;
import com.landstack.dto.RegisterRequest;
import com.landstack.entity.Role;
import com.landstack.entity.RoleType;
import com.landstack.entity.User;
import com.landstack.exception.BadRequestException;
import com.landstack.exception.ResourceNotFoundException;
import com.landstack.exception.UnauthorizedException;
import com.landstack.repository.RoleRepository;
import com.landstack.repository.UserRepository;
import com.landstack.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    @Transactional
    public AuthResponse loginCitizen(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (!user.getActive()) {
            throw new UnauthorizedException("Your account has been deactivated. Please contact administration.");
        }

        if (user.getRole().getName() != RoleType.CITIZEN) {
            throw new UnauthorizedException("This login portal is exclusively for Citizens. Staff must use the Staff Portal.");
        }

        String token = jwtService.generateToken(user);
        auditLogService.logAction(user, "CITIZEN_LOGIN", "USER", user.getId().toString(), "Citizen logged into citizen portal", null);

        return buildAuthResponse(user, token);
    }

    @Transactional
    public AuthResponse loginStaff(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid credentials");
        }

        if (!user.getActive()) {
            throw new UnauthorizedException("Your staff account is inactive. Please contact your Department Administrator.");
        }

        RoleType role = user.getRole().getName();
        if (role != RoleType.ADMIN && role != RoleType.DEPARTMENT_SUPERVISOR && role != RoleType.FIELD_OFFICER) {
            throw new UnauthorizedException("This portal is exclusively for Government Staff and Administrators.");
        }

        String token = jwtService.generateToken(user);
        auditLogService.logAction(user, "STAFF_LOGIN", "USER", user.getId().toString(), "Staff logged into staff portal as " + role.name(), null);

        return buildAuthResponse(user, token);
    }

    @Transactional
    public AuthResponse registerCitizen(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        Role citizenRole = roleRepository.findByName(RoleType.CITIZEN)
                .orElseThrow(() -> new ResourceNotFoundException("Citizen role not initialized"));

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .mobile(request.getMobile())
                .role(citizenRole)
                .active(true)
                .build();

        user = userRepository.save(user);

        String token = jwtService.generateToken(user);
        auditLogService.logAction(user, "CITIZEN_REGISTER", "USER", user.getId().toString(), "New citizen account registered", null);

        return buildAuthResponse(user, token);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName().name())
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .designation(user.getDesignation())
                .employeeCode(user.getEmployeeCode())
                .build();
    }
}
