package com.trackwallet.repository;

import com.trackwallet.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID>,
        JpaSpecificationExecutor<Transaction> {

    Page<Transaction> findByUserIdOrderByTransactionDateDescCreatedAtDesc(UUID userId, Pageable pageable);

    List<Transaction> findByUserIdAndTransactionDateBetweenOrderByTransactionDateDesc(
            UUID userId, LocalDate start, LocalDate end);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type IN ('INCOME','LOAN_RECEIVED','REFUND') " +
           "AND t.transactionDate BETWEEN :start AND :end AND t.status != 'VOID'")
    BigDecimal sumIncomeByDateRange(@Param("userId") UUID userId,
                                    @Param("start") LocalDate start,
                                    @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.type IN ('EXPENSE','LOAN_PAYMENT','INTEREST') " +
           "AND t.transactionDate BETWEEN :start AND :end AND t.status != 'VOID'")
    BigDecimal sumExpenseByDateRange(@Param("userId") UUID userId,
                                     @Param("start") LocalDate start,
                                     @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.account.id = :accountId AND t.type IN ('INCOME','TRANSFER_IN','LOAN_RECEIVED','REFUND') " +
           "AND t.status != 'VOID'")
    BigDecimal sumCreditsForAccount(@Param("accountId") UUID accountId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.account.id = :accountId AND t.type IN ('EXPENSE','TRANSFER_OUT','LOAN_PAYMENT','INTEREST','ADJUSTMENT') " +
           "AND t.status != 'VOID'")
    BigDecimal sumDebitsForAccount(@Param("accountId") UUID accountId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.business.id = :businessId " +
           "AND t.type = 'INCOME' AND t.transactionDate BETWEEN :start AND :end AND t.status != 'VOID'")
    BigDecimal sumBusinessRevenue(@Param("userId") UUID userId,
                                   @Param("businessId") UUID businessId,
                                   @Param("start") LocalDate start,
                                   @Param("end") LocalDate end);

    @Query("SELECT t.category.name as category, COALESCE(SUM(t.amount), 0) as total " +
           "FROM Transaction t WHERE t.user.id = :userId " +
           "AND t.type IN ('EXPENSE','LOAN_PAYMENT','INTEREST') " +
           "AND t.transactionDate BETWEEN :start AND :end AND t.status != 'VOID' " +
           "GROUP BY t.category.name ORDER BY total DESC")
    List<Object[]> sumExpenseByCategory(@Param("userId") UUID userId,
                                         @Param("start") LocalDate start,
                                         @Param("end") LocalDate end);

    @Query("SELECT MONTH(t.transactionDate) as month, YEAR(t.transactionDate) as year, " +
           "COALESCE(SUM(CASE WHEN t.type IN ('INCOME','REFUND','LOAN_RECEIVED') THEN t.amount ELSE 0 END), 0) as income, " +
           "COALESCE(SUM(CASE WHEN t.type IN ('EXPENSE','LOAN_PAYMENT','INTEREST') THEN t.amount ELSE 0 END), 0) as expense " +
           "FROM Transaction t WHERE t.user.id = :userId AND t.status != 'VOID' " +
           "AND t.transactionDate BETWEEN :start AND :end " +
           "GROUP BY YEAR(t.transactionDate), MONTH(t.transactionDate) " +
           "ORDER BY YEAR(t.transactionDate), MONTH(t.transactionDate)")
    List<Object[]> getMonthlyBreakdown(@Param("userId") UUID userId,
                                        @Param("start") LocalDate start,
                                        @Param("end") LocalDate end);
}
