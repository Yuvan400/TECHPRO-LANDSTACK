package com.landstack.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user", columnList = "userId"),
    @Index(name = "idx_audit_entity", columnList = "entityType, entityId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(nullable = false, length = 120)
    private String userEmail;

    @Column(nullable = false, length = 40)
    private String role;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(nullable = false, length = 60)
    private String entityType;

    @Column(length = 60)
    private String entityId;

    @Column(length = 1000)
    private String description;

    @Column(length = 50)
    private String ipAddress;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime timestamp;
}
