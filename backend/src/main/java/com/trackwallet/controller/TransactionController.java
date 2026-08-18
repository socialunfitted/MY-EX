package com.trackwallet.controller;

import com.trackwallet.model.*;
import com.trackwallet.repository.*;
import com.trackwallet.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;
    private final BusinessRepository businessRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getTransactions(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) Boolean needsReview,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        UUID userId = getUserId(authHeader);
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Transaction> txPage = transactionRepository.findByUserIdOrderByTransactionDateDescCreatedAtDesc(userId, pageable);

        List<Map<String, Object>> content = new ArrayList<>();
        for (Transaction tx : txPage.getContent()) {
            if (type != null && !tx.getType().equalsIgnoreCase(type)) continue;
            if (accountId != null && (tx.getAccount() == null || !tx.getAccount().getId().equals(accountId))) continue;
            if (categoryId != null && (tx.getCategory() == null || !tx.getCategory().getId().equals(categoryId))) continue;
            if (needsReview != null && !needsReview.equals(tx.getNeedsReview())) continue;
            if (startDate != null && tx.getTransactionDate().isBefore(startDate)) continue;
            if (endDate != null && tx.getTransactionDate().isAfter(endDate)) continue;
            if (search != null && !search.isBlank()) {
                String q = search.toLowerCase();
                boolean match = (tx.getDescription() != null && tx.getDescription().toLowerCase().contains(q)) ||
                                (tx.getOriginalDescription() != null && tx.getOriginalDescription().toLowerCase().contains(q)) ||
                                (tx.getRawText() != null && tx.getRawText().toLowerCase().contains(q));
                if (!match) continue;
            }
            content.add(txToMap(tx));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalElements", txPage.getTotalElements());
        response.put("totalPages", txPage.getTotalPages());
        response.put("currentPage", page);
        response.put("size", size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTransaction(@RequestHeader("Authorization") String authHeader, @PathVariable UUID id) {
        UUID userId = getUserId(authHeader);
        return transactionRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(userId))
                .map(t -> ResponseEntity.ok(txToMap(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createTransaction(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();

        Transaction tx = buildTransactionFromRequest(user, request, null);
        tx = transactionRepository.save(tx);

        if (tx.getAccount() != null) updateAccountBalance(tx.getAccount());

        return ResponseEntity.ok(txToMap(tx));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTransaction(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();

        Optional<Transaction> existing = transactionRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        Transaction tx = buildTransactionFromRequest(user, request, existing.get());
        tx.setId(id);
        tx = transactionRepository.save(tx);

        if (tx.getAccount() != null) updateAccountBalance(tx.getAccount());

        return ResponseEntity.ok(txToMap(tx));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Transaction> existing = transactionRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        Account account = existing.get().getAccount();
        transactionRepository.deleteById(id);
        if (account != null) updateAccountBalance(account);

        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    private Transaction buildTransactionFromRequest(User user, Map<String, Object> req, Transaction existing) {
        Transaction.TransactionBuilder builder = existing != null ? existing.toBuilder() : Transaction.builder().user(user);

        if (req.get("description") != null) {
            String desc = req.get("description").toString();
            builder.description(desc);
            if (existing == null || existing.getOriginalDescription() == null) {
                builder.originalDescription(req.getOrDefault("originalDescription", desc).toString());
            }
            if (existing == null || existing.getRawText() == null) {
                builder.rawText(req.getOrDefault("rawText", desc).toString());
            }
        }

        if (req.get("amount") != null) {
            BigDecimal amt = new BigDecimal(req.get("amount").toString());
            builder.amount(amt);
        }

        if (req.get("moneyOut") != null) {
            builder.moneyOut(new BigDecimal(req.get("moneyOut").toString()));
        }
        if (req.get("moneyIn") != null) {
            builder.moneyIn(new BigDecimal(req.get("moneyIn").toString()));
        }

        if (req.get("transactionDate") != null) {
            builder.transactionDate(LocalDate.parse(req.get("transactionDate").toString()));
        }

        if (req.get("type") != null) builder.type(req.get("type").toString());
        if (req.get("context") != null) builder.context(req.get("context").toString());
        if (req.get("sourcePage") != null) builder.sourcePage(Integer.parseInt(req.get("sourcePage").toString()));
        if (req.get("sourceRow") != null) builder.sourceRow(Integer.parseInt(req.get("sourceRow").toString()));
        if (req.get("needsReview") != null) builder.needsReview(Boolean.parseBoolean(req.get("needsReview").toString()));
        if (req.get("status") != null) builder.status(req.get("status").toString());

        if (req.get("accountId") != null) {
            accountRepository.findById(UUID.fromString(req.get("accountId").toString())).ifPresent(builder::account);
        }
        if (req.get("categoryId") != null) {
            categoryRepository.findById(UUID.fromString(req.get("categoryId").toString())).ifPresent(builder::category);
        }

        return builder.build();
    }

    private void updateAccountBalance(Account account) {
        if (account == null) return;
        BigDecimal credits = transactionRepository.sumCreditsForAccount(account.getId());
        BigDecimal debits = transactionRepository.sumDebitsForAccount(account.getId());
        account.setCurrentBalance(account.getOpeningBalance().add(credits).subtract(debits));
        accountRepository.save(account);
    }

    private Map<String, Object> txToMap(Transaction tx) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", tx.getId());
        map.put("transactionDate", tx.getTransactionDate());
        map.put("description", tx.getDescription());
        map.put("originalDescription", tx.getOriginalDescription());
        map.put("rawText", tx.getRawText());
        map.put("sourceFile", tx.getSourceFile());
        map.put("sourcePage", tx.getSourcePage());
        map.put("sourceRow", tx.getSourceRow());
        map.put("moneyOut", tx.getMoneyOut());
        map.put("moneyIn", tx.getMoneyIn());
        map.put("amount", tx.getAmount());
        map.put("type", tx.getType());
        map.put("context", tx.getContext());
        map.put("needsReview", tx.getNeedsReview());
        map.put("status", tx.getStatus());
        map.put("createdAt", tx.getCreatedAt());

        if (tx.getAccount() != null) {
            map.put("accountId", tx.getAccount().getId());
            map.put("accountName", tx.getAccount().getName());
        }
        if (tx.getCategory() != null) {
            map.put("categoryId", tx.getCategory().getId());
            map.put("categoryName", tx.getCategory().getName());
            map.put("categoryColor", tx.getCategory().getColor());
        }
        return map;
    }

    private UUID getUserId(String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow().getId();
    }
}
