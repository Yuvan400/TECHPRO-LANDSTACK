package com.landstack.service;

import com.landstack.dto.DepartmentDTO;
import com.landstack.entity.Department;
import com.landstack.exception.BadRequestException;
import com.landstack.exception.ResourceNotFoundException;
import com.landstack.repository.DepartmentRepository;
import com.landstack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getActiveDepartments() {
        return departmentRepository.findByActiveTrue().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        return mapToDTO(dept);
    }

    @Transactional
    public DepartmentDTO createDepartment(DepartmentDTO dto) {
        if (departmentRepository.findByCode(dto.getCode().trim().toUpperCase()).isPresent()) {
            throw new BadRequestException("Department code already exists: " + dto.getCode());
        }

        Department department = Department.builder()
                .name(dto.getName().trim())
                .code(dto.getCode().trim().toUpperCase())
                .description(dto.getDescription())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();

        department = departmentRepository.save(department);
        return mapToDTO(department);
    }

    @Transactional
    public DepartmentDTO updateDepartment(Long id, DepartmentDTO dto) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        dept.setName(dto.getName().trim());
        dept.setDescription(dto.getDescription());
        if (dto.getActive() != null) {
            dept.setActive(dto.getActive());
        }

        dept = departmentRepository.save(dept);
        return mapToDTO(dept);
    }

    @Transactional
    public void toggleActiveStatus(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));
        dept.setActive(!dept.getActive());
        departmentRepository.save(dept);
    }

    public DepartmentDTO mapToDTO(Department dept) {
        Long staffCount = (long) userRepository.findByDepartmentId(dept.getId()).size();
        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .code(dept.getCode())
                .description(dept.getDescription())
                .active(dept.getActive())
                .createdAt(dept.getCreatedAt())
                .activeStaffCount(staffCount)
                .build();
    }
}
