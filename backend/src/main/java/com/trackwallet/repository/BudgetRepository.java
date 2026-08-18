package com.trackwallet.repository;

import com.trackwallet.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    List<Budget> findByUserIdAndIsActiveTrueOrderByStartDateDesc(UUID userId);
    List<Budget> findByUserIdOrderByStartDateDesc(UUID userId);
    List<Budget> findByUserIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            UUID userId, LocalDate endDate, LocalDate startDate);
}
