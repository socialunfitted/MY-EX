package com.trackwallet.repository;

import com.trackwallet.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LoanRepository extends JpaRepository<Loan, UUID> {
    List<Loan> findByUserIdOrderByNameAsc(UUID userId);
    List<Loan> findByUserIdAndStatusOrderByNextPaymentDateAsc(UUID userId, String status);
}
