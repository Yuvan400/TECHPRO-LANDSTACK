package com.landstack.repository;

import com.landstack.entity.Department;
import com.landstack.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
    Optional<ServiceEntity> findByServiceCode(String serviceCode);
    List<ServiceEntity> findByActiveTrue();
    List<ServiceEntity> findByDepartmentAndActiveTrue(Department department);
    List<ServiceEntity> findByDepartmentId(Long departmentId);
}
