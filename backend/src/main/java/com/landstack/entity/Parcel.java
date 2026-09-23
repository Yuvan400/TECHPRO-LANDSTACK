package com.landstack.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "parcels", indexes = {
    @Index(name = "idx_ulpin", columnList = "ulpin", unique = true),
    @Index(name = "idx_survey", columnList = "district, taluk, surveyNumber")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parcel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String ulpin;

    @Column(nullable = false, length = 50)
    private String surveyNumber;

    @Column(length = 30)
    private String subDivision;

    @Column(nullable = false, length = 60)
    private String district;

    @Column(nullable = false, length = 60)
    private String taluk;

    @Column(nullable = false, length = 80)
    private String village;

    @Column(length = 10)
    private String pincode;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Double areaAcre;

    private Double areaSqFt;

    @Column(nullable = false, length = 50)
    private String landType;

    @Column(nullable = false, length = 100)
    private String landUse;

    @Column(nullable = false, length = 50)
    private String ownershipStatus;

    @Column(nullable = false, length = 120)
    private String ownerName;

    @Column(length = 30)
    private String ownerAadhaarMasked;

    @Column(nullable = false, length = 30)
    private String propertyTaxStatus;

    private Integer lastTaxPaidYear;

    @Column(nullable = false, length = 40)
    private String registrationStatus;

    @Column(nullable = false, length = 40)
    private String verificationStatus;

    @Column(nullable = false, length = 50)
    private String encumbranceStatus;

    private Double marketValuationInr;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String boundaryGeoJson;

    private Double aiRiskScore;

    @Column(length = 20)
    private String aiRiskCategory;

    @Column(length = 500)
    private String aiRiskNotes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
