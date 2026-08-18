package com.trackwallet.repository;

import com.trackwallet.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByUserIdAndIsActiveTrueOrderBySortOrderAscNameAsc(UUID userId);
    List<Category> findByUserIdOrderBySortOrderAscNameAsc(UUID userId);
    List<Category> findByUserIdAndTypeInOrderBySortOrderAscNameAsc(UUID userId, List<String> types);
}
