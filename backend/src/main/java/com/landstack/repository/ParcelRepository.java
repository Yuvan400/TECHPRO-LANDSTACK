package com.landstack.repository;

import com.landstack.entity.Parcel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParcelRepository extends JpaRepository<Parcel, Long> {

    Optional<Parcel> findByUlpin(String ulpin);

    Optional<Parcel> findByUlpinIgnoreCase(String ulpin);

    List<Parcel> findBySurveyNumberContainingIgnoreCase(String surveyNumber);

    List<Parcel> findByDistrictIgnoreCase(String district);

    @Query("SELECT p FROM Parcel p WHERE " +
           "LOWER(p.ulpin) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.surveyNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.ownerName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.ownerAadhaarMasked) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.village) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.taluk) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.district) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Parcel> searchParcels(@Param("query") String query);

    @Query("SELECT COUNT(p) FROM Parcel p WHERE p.verificationStatus = :status")
    Long countByVerificationStatus(@Param("status") String status);

    @Query("SELECT p.landUse, COUNT(p) FROM Parcel p GROUP BY p.landUse")
    List<Object[]> countParcelsByLandUse();
}
