package com.landstack.service;

import com.landstack.dto.AuditLogDTO;
import com.landstack.entity.AuditLog;
import com.landstack.entity.User;
import com.landstack.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void logAction(User user, String action, String entityType, String entityId, String description, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(user != null ? user.getId() : null)
                    .userEmail(user != null ? user.getEmail() : "SYSTEM")
                    .role(user != null && user.getRole() != null ? user.getRole().getName().name() : "ANONYMOUS")
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(description)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
            log.info("AUDIT LOG: [{}] {} on {} ({}) by {}", auditLog.getRole(), action, entityType, entityId, auditLog.getUserEmail());
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable).map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getLogsByEntity(String entityType, String entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogDTO> getLogsByUser(User user) {
        if (user == null || user.getEmail() == null) return List.of();
        return auditLogRepository.findByUserEmailOrderByTimestampDesc(user.getEmail()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private AuditLogDTO mapToDTO(AuditLog log) {
        return AuditLogDTO.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .userEmail(log.getUserEmail())
                .role(log.getRole())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .description(log.getDescription())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }
}
