package com.landstack.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "field_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id", nullable = false, unique = true)
    @JsonIgnore
    private ServiceRequest serviceRequest;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_officer_id", nullable = false)
    private User fieldOfficer;

    private LocalDateTime inspectionDate;

    private LocalDateTime scheduledDate;

    @Column(length = 40)
    private String inspectionNumber; // e.g. "INSP-2026-00421"

    @Column(length = 50)
    private String inspectionType; // e.g. "Site Inspection", "Boundary Verification"

    private Double gpsLatitude;

    private Double gpsLongitude;

    private Double gpsAccuracy;

    @Builder.Default
    private Boolean gpsCoordinatesVerified = true;

    @Builder.Default
    private Boolean boundaryMatchesRecord = true;

    @Builder.Default
    private Boolean encroachmentDetected = false;

    @Column(length = 2000)
    private String remarks;

    @Column(columnDefinition = "TEXT")
    private String photoUrls;

    @Column(length = 50)
    private String officerFinding; // e.g. "Verified", "Verified with Remarks", "Clarification Required", "Further Inspection Required", "Not Verified"

    @Column(length = 30)
    private String status; // DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, FORWARDED

    @Column(columnDefinition = "LONGTEXT")
    private String reportData; // Full JSON payload preserving measurements, photos, boundary verification, and observations

    @Column(nullable = false, length = 40)
    private String verificationResult; // e.g. "VERIFIED_COMPLIANT", "ENCROACHMENT_FLAGGED", "DISCREPANCY_FOUND"

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime submittedAt;
}
