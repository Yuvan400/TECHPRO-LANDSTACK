package com.landstack.service;

import com.landstack.dto.ServiceDTO;
import com.landstack.entity.Department;
import com.landstack.entity.ServiceEntity;
import com.landstack.exception.BadRequestException;
import com.landstack.exception.ResourceNotFoundException;
import com.landstack.repository.DepartmentRepository;
import com.landstack.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GovernmentService {

    private final ServiceRepository serviceRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public List<ServiceDTO> getAllActiveServices() {
        return serviceRepository.findByActiveTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceDTO> getAllServicesAdmin() {
        return serviceRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceDTO getServiceById(Long id) {
        ServiceEntity entity = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));
        return mapToDTO(entity);
    }

    @Transactional
    public ServiceDTO createService(ServiceDTO dto) {
        if (serviceRepository.findByServiceCode(dto.getServiceCode().trim().toUpperCase()).isPresent()) {
            throw new BadRequestException("Service code already exists: " + dto.getServiceCode());
        }

        Department dept = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + dto.getDepartmentId()));

        ServiceEntity entity = ServiceEntity.builder()
                .serviceCode(dto.getServiceCode().trim().toUpperCase())
                .serviceName(dto.getServiceName().trim())
                .description(dto.getDescription())
                .department(dept)
                .requiredDocuments(dto.getRequiredDocuments())
                .processingDays(dto.getProcessingDays() != null ? dto.getProcessingDays() : 7)
                .feeInr(dto.getFeeInr() != null ? dto.getFeeInr() : 0.0)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();

        entity = serviceRepository.save(entity);
        return mapToDTO(entity);
    }

    @Transactional
    public ServiceDTO updateService(Long id, ServiceDTO dto) {
        ServiceEntity entity = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));

        if (dto.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + dto.getDepartmentId()));
            entity.setDepartment(dept);
        }

        entity.setServiceName(dto.getServiceName().trim());
        entity.setDescription(dto.getDescription());
        entity.setRequiredDocuments(dto.getRequiredDocuments());
        if (dto.getProcessingDays() != null) entity.setProcessingDays(dto.getProcessingDays());
        if (dto.getFeeInr() != null) entity.setFeeInr(dto.getFeeInr());
        if (dto.getActive() != null) entity.setActive(dto.getActive());

        entity = serviceRepository.save(entity);
        return mapToDTO(entity);
    }

    @Transactional
    public void deleteService(Long id) {
        ServiceEntity entity = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));
        entity.setActive(false);
        serviceRepository.save(entity);
    }

    public ServiceDTO mapToDTO(ServiceEntity s) {
        return ServiceDTO.builder()
                .id(s.getId())
                .serviceCode(s.getServiceCode())
                .serviceName(s.getServiceName())
                .description(s.getDescription())
                .departmentId(s.getDepartment().getId())
                .departmentName(s.getDepartment().getName())
                .requiredDocuments(s.getRequiredDocuments())
                .processingDays(s.getProcessingDays())
                .feeInr(s.getFeeInr())
                .active(s.getActive())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
