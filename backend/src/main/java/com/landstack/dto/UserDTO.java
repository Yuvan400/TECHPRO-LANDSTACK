package com.landstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String fullName;
    private String email;
    private String mobile;
    private String role;
    private Long departmentId;
    private String departmentName;
    private String designation;
    private String employeeCode;
    private Boolean active;
    private LocalDateTime createdAt;
}
