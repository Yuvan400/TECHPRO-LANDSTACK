package com.landstack.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "application_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id", nullable = false)
    @JsonIgnore
    private ServiceRequest serviceRequest;

    @Column(nullable = false, length = 100)
    private String documentType;

    @Column(nullable = false, length = 150)
    private String documentName;

    @Column(length = 255)
    private String documentUrl;

    @Column(length = 30)
    private String fileSize;

    @Builder.Default
    private Boolean verified = false;

    @Column(length = 30)
    private String verificationStatus; // VERIFIED, NOT_VERIFIED, REQUIRES_CLARIFICATION

    @Column(length = 1000)
    private String officerRemark;

    @Column(length = 100)
    private String verifiedBy;

    private LocalDateTime verifiedAt;

    @Column(length = 50)
    private String aiDocumentClassification; // e.g. "SALE_DEED_MATCH_98%"

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}
