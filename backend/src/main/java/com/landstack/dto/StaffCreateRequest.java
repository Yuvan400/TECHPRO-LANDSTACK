package com.landstack.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StaffCreateRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String mobile;

    @NotBlank(message = "Role is required (DEPARTMENT_SUPERVISOR or FIELD_OFFICER)")
    private String role; // DEPARTMENT_SUPERVISOR or FIELD_OFFICER

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private String designation;
    private String employeeCode;
}
