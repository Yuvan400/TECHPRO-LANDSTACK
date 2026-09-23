package com.landstack.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupervisorAssignRequest {
    @NotNull
    private Long applicationId;

    @NotNull
    private Long fieldOfficerId;

    private String assignmentReason;

    private String priority; // NORMAL, HIGH, URGENT
}
