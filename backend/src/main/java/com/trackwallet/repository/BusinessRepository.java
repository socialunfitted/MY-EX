package com.trackwallet.repository;

import com.trackwallet.model.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusinessRepository extends JpaRepository<Business, UUID> {
    List<Business> findByUserIdOrderByNameAsc(UUID userId);
    List<Business> findByUserIdAndStatusOrderByNameAsc(UUID userId, String status);
}
