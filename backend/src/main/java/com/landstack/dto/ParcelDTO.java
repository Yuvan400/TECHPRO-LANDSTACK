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
public class ParcelDTO {
    private Long id;
    private String ulpin;
    private String surveyNumber;
    private String subDivision;
    private String district;
    private String taluk;
    private String village;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private Double areaAcre;
    private Double areaSqFt;
    private String landType;
    private String landUse;
    private String ownershipStatus;
    private String ownerName;
    private String ownerAadhaarMasked;
    private String propertyTaxStatus;
    private Integer lastTaxPaidYear;
    private String registrationStatus;
    private String verificationStatus;
    private String encumbranceStatus;
    private Double marketValuationInr;
    private String boundaryGeoJson;
    private Double aiRiskScore;
    private String aiRiskCategory;
    private String aiRiskNotes;
    private LocalDateTime createdAt;
}
