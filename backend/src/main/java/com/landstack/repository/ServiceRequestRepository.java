package com.landstack.repository;

import com.landstack.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    Optional<ServiceRequest> findByApplicationNumber(String applicationNumber);

    List<ServiceRequest> findByCitizenOrderByCreatedAtDesc(User citizen);

    List<ServiceRequest> findByDepartmentOrderByCreatedAtDesc(Department department);

    List<ServiceRequest> findByDepartmentAndStatus(Department department, ApplicationStatus status);

    List<ServiceRequest> findByFieldOfficerOrderByCreatedAtDesc(User fieldOfficer);

    List<ServiceRequest> findByFieldOfficerAndStatus(User fieldOfficer, ApplicationStatus status);

    List<ServiceRequest> findBySupervisorOrderByCreatedAtDesc(User supervisor);

    List<ServiceRequest> findByParcel(Parcel parcel);

    @Query("SELECT r.status, COUNT(r) FROM ServiceRequest r GROUP BY r.status")
    List<Object[]> countApplicationsByStatus();

    @Query("SELECT r.department.name, COUNT(r) FROM ServiceRequest r GROUP BY r.department.name")
    List<Object[]> countApplicationsByDepartment();

    @Query("SELECT COUNT(r) FROM ServiceRequest r WHERE r.status = :status")
    Long countByStatus(@Param("status") ApplicationStatus status);
}
