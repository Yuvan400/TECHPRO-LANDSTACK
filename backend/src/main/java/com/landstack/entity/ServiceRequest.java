package com.landstack.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_requests", indexes = {
    @Index(name = "idx_app_no", columnList = "applicationNumber", unique = true),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_dept", columnList = "department_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String applicationNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "citizen_id", nullable = false)
    private User citizen;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parcel_id", nullable = false)
    private Parcel parcel;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supervisor_id")
    private User supervisor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "field_officer_id")
    private User fieldOfficer;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 40, columnDefinition = "VARCHAR(40)")
    private ApplicationStatus status;

    @Column(length = 1000)
    private String citizenRemarks;

    @Column(length = 1000)
    private String supervisorRemarks;

    @Column(length = 1000)
    private String fieldOfficerRemarks;

    @Column(length = 500)
    private String rejectionReason;

    @Column(length = 60)
    private String certificateNumber;

    @Column(length = 255)
    private String certificateUrl;

    private LocalDateTime certificateGeneratedAt;

    @OneToMany(mappedBy = "serviceRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ApplicationDocument> documents = new ArrayList<>();

    @OneToOne(mappedBy = "serviceRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private FieldVerification fieldVerification;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
