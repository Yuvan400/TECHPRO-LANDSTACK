package com.landstack.service;

import com.landstack.dto.ParcelDTO;
import com.landstack.entity.Parcel;
import com.landstack.exception.ResourceNotFoundException;
import com.landstack.repository.ParcelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParcelService {

    private final ParcelRepository parcelRepository;

    @Transactional(readOnly = true)
    public List<ParcelDTO> getAllParcels() {
        return parcelRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ParcelDTO getParcelByUlpin(String ulpin) {
        Parcel parcel = parcelRepository.findByUlpinIgnoreCase(ulpin.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Land parcel not found for ULPIN: " + ulpin));
        return mapToDTO(parcel);
    }

    @Transactional(readOnly = true)
    public Parcel getParcelEntityByUlpin(String ulpin) {
        return parcelRepository.findByUlpinIgnoreCase(ulpin.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Land parcel not found for ULPIN: " + ulpin));
    }

    @Transactional(readOnly = true)
    public List<ParcelDTO> searchParcels(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllParcels();
        }
        return parcelRepository.searchParcels(query.trim()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ParcelDTO mapToDTO(Parcel p) {
        return ParcelDTO.builder()
                .id(p.getId())
                .ulpin(p.getUlpin())
                .surveyNumber(p.getSurveyNumber())
                .subDivision(p.getSubDivision())
                .district(p.getDistrict())
                .taluk(p.getTaluk())
                .village(p.getVillage())
                .pincode(p.getPincode())
                .latitude(p.getLatitude())
                .longitude(p.getLongitude())
                .areaAcre(p.getAreaAcre())
                .areaSqFt(p.getAreaSqFt())
                .landType(p.getLandType())
                .landUse(p.getLandUse())
                .ownershipStatus(p.getOwnershipStatus())
                .ownerName(p.getOwnerName())
                .ownerAadhaarMasked(p.getOwnerAadhaarMasked())
                .propertyTaxStatus(p.getPropertyTaxStatus())
                .lastTaxPaidYear(p.getLastTaxPaidYear())
                .registrationStatus(p.getRegistrationStatus())
                .verificationStatus(p.getVerificationStatus())
                .encumbranceStatus(p.getEncumbranceStatus())
                .marketValuationInr(p.getMarketValuationInr())
                .boundaryGeoJson(p.getBoundaryGeoJson())
                .aiRiskScore(p.getAiRiskScore())
                .aiRiskCategory(p.getAiRiskCategory())
                .aiRiskNotes(p.getAiRiskNotes())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
