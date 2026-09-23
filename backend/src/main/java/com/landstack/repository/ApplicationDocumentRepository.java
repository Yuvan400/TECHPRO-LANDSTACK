package com.landstack.repository;

import com.landstack.entity.ApplicationDocument;
import com.landstack.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, Long> {
    List<ApplicationDocument> findByServiceRequest(ServiceRequest serviceRequest);
}
