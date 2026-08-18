package com.trackwallet.repository;

import com.trackwallet.model.Subcategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubcategoryRepository extends JpaRepository<Subcategory, UUID> {
    List<Subcategory> findByCategoryIdAndIsActiveTrueOrderBySortOrderAscNameAsc(UUID categoryId);
    List<Subcategory> findByUserIdOrderByCategoryIdAscSortOrderAscNameAsc(UUID userId);
}
