package com.landstack.repository;

import com.landstack.entity.FieldVerification;
import com.landstack.entity.ServiceRequest;
import com.landstack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FieldVerificationRepository extends JpaRepository<FieldVerification, Long> {
    Optional<FieldVerification> findByServiceRequest(ServiceRequest serviceRequest);
    List<FieldVerification> findByFieldOfficer(User fieldOfficer);
}
