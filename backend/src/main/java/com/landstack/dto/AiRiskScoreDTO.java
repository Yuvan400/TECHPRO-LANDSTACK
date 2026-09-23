package com.landstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiRiskScoreDTO {
    private String ulpin;
    private Double overallRiskScore; // 0.0 (safest) to 100.0 (risky)
    private String riskCategory;     // Low, Moderate, High
    private Double titleClearanceConfidence;
    private Double zoningComplianceScore;
    private Double encumbranceRiskScore;
    private Double environmentalBufferScore;
    private List<String> flaggedAnomalies;
    private List<String> recommendations;
    private String aiModelVersion;
    private String disclaimer;
}
