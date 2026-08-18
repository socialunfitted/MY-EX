package com.trackwallet.repository;

import com.trackwallet.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByUserIdOrderByNameAsc(UUID userId);
    List<Account> findByUserIdAndIsActiveTrueOrderByNameAsc(UUID userId);

    @Query("SELECT a FROM Account a WHERE a.user.id = :userId AND a.includeInTotal = true AND a.isActive = true")
    List<Account> findActiveAccountsForTotal(UUID userId);
}
