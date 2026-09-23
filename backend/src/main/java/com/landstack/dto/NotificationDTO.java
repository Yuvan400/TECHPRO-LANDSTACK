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
public class NotificationDTO {
    private Long id;
    private Long recipientId;
    private String title;
    private String message;
    private String type;
    private String referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
