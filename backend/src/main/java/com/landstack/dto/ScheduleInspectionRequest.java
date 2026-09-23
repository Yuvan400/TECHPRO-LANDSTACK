package com.landstack.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleInspectionRequest {
    @NotNull
    private Long applicationId;

    @NotNull
    private LocalDateTime inspectionDate;

    private String inspectionType;

    private String remarks;
}
