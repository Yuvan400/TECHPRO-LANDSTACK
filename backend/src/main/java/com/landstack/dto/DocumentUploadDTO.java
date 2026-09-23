package com.landstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadDTO {
    private String documentType;
    private String documentName;
    private String documentUrl;
    private String fileSize;
}
