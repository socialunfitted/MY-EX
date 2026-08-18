package com.trackwallet.controller;

import com.trackwallet.model.*;
import com.trackwallet.repository.*;
import com.trackwallet.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAccounts(@RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserId(authHeader);
        List<Account> accounts = accountRepository.findByUserIdOrderByNameAsc(userId);
        return ResponseEntity.ok(accounts.stream().map(this::accountToMap).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAccount(@RequestHeader("Authorization") String authHeader, @PathVariable UUID id) {
        UUID userId = getUserId(authHeader);
        return accountRepository.findById(id)
                .filter(a -> a.getUser().getId().equals(userId))
                .map(a -> ResponseEntity.ok(accountToMap(a)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createAccount(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();

        Account account = Account.builder()
                .user(user)
                .name(request.get("name").toString())
                .accountType(request.getOrDefault("accountType", "CASH").toString())
                .openingBalance(request.get("openingBalance") != null
                        ? new BigDecimal(request.get("openingBalance").toString()) : BigDecimal.ZERO)
                .currentBalance(request.get("openingBalance") != null
                        ? new BigDecimal(request.get("openingBalance").toString()) : BigDecimal.ZERO)
                .institution(request.get("institution") != null ? request.get("institution").toString() : null)
                .color(request.getOrDefault("color", "#6366f1").toString())
                .icon(request.getOrDefault("icon", "account_balance_wallet").toString())
                .notes(request.get("notes") != null ? request.get("notes").toString() : null)
                .build();

        account = accountRepository.save(account);
        return ResponseEntity.ok(accountToMap(account));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAccount(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Account> existing = accountRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        Account account = existing.get();
        if (request.get("name") != null) account.setName(request.get("name").toString());
        if (request.get("accountType") != null) account.setAccountType(request.get("accountType").toString());
        if (request.get("institution") != null) account.setInstitution(request.get("institution").toString());
        if (request.get("color") != null) account.setColor(request.get("color").toString());
        if (request.get("icon") != null) account.setIcon(request.get("icon").toString());
        if (request.get("notes") != null) account.setNotes(request.get("notes").toString());
        if (request.get("isActive") != null) account.setIsActive(Boolean.parseBoolean(request.get("isActive").toString()));
        if (request.get("includeInTotal") != null) account.setIncludeInTotal(Boolean.parseBoolean(request.get("includeInTotal").toString()));

        account = accountRepository.save(account);
        return ResponseEntity.ok(accountToMap(account));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAccount(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Account> existing = accountRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        accountRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PostMapping("/{id}/recalculate")
    public ResponseEntity<?> recalculateBalance(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Account> existing = accountRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        Account account = existing.get();
        BigDecimal credits = transactionRepository.sumCreditsForAccount(id);
        BigDecimal debits = transactionRepository.sumDebitsForAccount(id);
        account.setCurrentBalance(account.getOpeningBalance().add(credits).subtract(debits));
        account = accountRepository.save(account);
        return ResponseEntity.ok(accountToMap(account));
    }

    private Map<String, Object> accountToMap(Account a) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", a.getId());
        map.put("name", a.getName());
        map.put("accountType", a.getAccountType());
        map.put("openingBalance", a.getOpeningBalance());
        map.put("currentBalance", a.getCurrentBalance());
        map.put("institution", a.getInstitution());
        map.put("color", a.getColor());
        map.put("icon", a.getIcon());
        map.put("isActive", a.getIsActive());
        map.put("includeInTotal", a.getIncludeInTotal());
        map.put("notes", a.getNotes());
        map.put("createdAt", a.getCreatedAt());
        return map;
    }

    private UUID getUserId(String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow().getId();
    }
}
