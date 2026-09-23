package com.landstack.controller;

import com.landstack.dto.AuthResponse;
import com.landstack.dto.LoginRequest;
import com.landstack.dto.RegisterRequest;
import com.landstack.dto.UserDTO;
import com.landstack.entity.User;
import com.landstack.service.AdminService;
import com.landstack.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AdminService adminService;

    @PostMapping("/citizen/login")
    public ResponseEntity<AuthResponse> loginCitizen(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginCitizen(request));
    }

    @PostMapping("/staff/login")
    public ResponseEntity<AuthResponse> loginStaff(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.loginStaff(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerCitizen(@Valid @RequestBody RegisterRequest request) {
        return new ResponseEntity<>(authService.registerCitizen(request), HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = authService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(adminService.mapUserToDTO(user));
    }
}
