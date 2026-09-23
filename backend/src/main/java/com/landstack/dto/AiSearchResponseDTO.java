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
public class AiSearchResponseDTO {
    private String query;
    private String interpretedIntent;
    private String detectedDistrict;
    private String detectedLandUse;
    private Double minAreaAcre;
    private List<ParcelDTO> matchedParcels;
    private String aiExplanation;
}
