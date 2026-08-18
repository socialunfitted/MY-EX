package com.trackwallet.controller;

import com.trackwallet.model.*;
import com.trackwallet.repository.*;
import com.trackwallet.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanRepository loanRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getLoans(@RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserId(authHeader);
        List<Loan> loans = loanRepository.findByUserIdOrderByNameAsc(userId);
        return ResponseEntity.ok(loans.stream().map(this::loanToMap).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLoan(@RequestHeader("Authorization") String authHeader, @PathVariable UUID id) {
        UUID userId = getUserId(authHeader);
        return loanRepository.findById(id)
                .filter(l -> l.getUser().getId().equals(userId))
                .map(l -> ResponseEntity.ok(loanToMap(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createLoan(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();

        Loan loan = buildLoan(user, request, null);
        loan = loanRepository.save(loan);
        return ResponseEntity.ok(loanToMap(loan));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLoan(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Loan> existing = loanRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        User user = userRepository.findById(userId).orElseThrow();
        Loan loan = buildLoan(user, request, existing.get());
        loan.setId(id);
        loan = loanRepository.save(loan);
        return ResponseEntity.ok(loanToMap(loan));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLoan(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Loan> existing = loanRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        loanRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<?> markAsPaid(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();
        Optional<Loan> loanOpt = loanRepository.findById(id);

        if (loanOpt.isEmpty() || !loanOpt.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        Loan loan = loanOpt.get();
        BigDecimal payAmount = request.get("amount") != null
                ? new BigDecimal(request.get("amount").toString())
                : loan.getEmiAmount();

        String payDateStr = request.get("paymentDate") != null
                ? request.get("paymentDate").toString()
                : LocalDate.now().toString();
        LocalDate payDate = LocalDate.parse(payDateStr);

        // Create payment transaction
        Transaction tx = Transaction.builder()
                .user(user)
                .account(loan.getAccount())
                .transactionDate(payDate)
                .amount(payAmount)
                .type("LOAN_PAYMENT")
                .context("DEBT")
                .description("EMI Payment: " + loan.getName())
                .status("CLEARED")
                .build();
        transactionRepository.save(tx);

        // Update loan
        loan.setTotalPaid(loan.getTotalPaid().add(payAmount));
        loan.setOutstanding(loan.getOutstanding().subtract(payAmount).max(BigDecimal.ZERO));
        if (loan.getNextPaymentDate() != null) {
            loan.setNextPaymentDate(loan.getNextPaymentDate().plusMonths(1));
        }
        if (loan.getOutstanding().compareTo(BigDecimal.ZERO) <= 0) {
            loan.setStatus("PAID");
        }
        loan = loanRepository.save(loan);

        // Update account balance
        if (loan.getAccount() != null) {
            BigDecimal credits = transactionRepository.sumCreditsForAccount(loan.getAccount().getId());
            BigDecimal debits = transactionRepository.sumDebitsForAccount(loan.getAccount().getId());
            Account acc = loan.getAccount();
            acc.setCurrentBalance(acc.getOpeningBalance().add(credits).subtract(debits));
            accountRepository.save(acc);
        }

        return ResponseEntity.ok(Map.of(
            "loan", loanToMap(loan),
            "transaction", tx.getId(),
            "message", "Payment recorded successfully"
        ));
    }

    private Loan buildLoan(User user, Map<String, Object> req, Loan existing) {
        Loan.LoanBuilder builder = existing != null ? existing.toBuilder() : Loan.builder().user(user);

        if (req.get("name") != null) builder.name(req.get("name").toString());
        if (req.get("lender") != null) builder.lender(req.get("lender").toString());
        if (req.get("loanType") != null) builder.loanType(req.get("loanType").toString());
        if (req.get("principal") != null) builder.principal(new BigDecimal(req.get("principal").toString()));
        if (req.get("outstanding") != null) builder.outstanding(new BigDecimal(req.get("outstanding").toString()));
        if (req.get("interestRate") != null) builder.interestRate(new BigDecimal(req.get("interestRate").toString()));
        if (req.get("emiAmount") != null) builder.emiAmount(new BigDecimal(req.get("emiAmount").toString()));
        if (req.get("frequency") != null) builder.frequency(req.get("frequency").toString());
        if (req.get("startDate") != null) builder.startDate(LocalDate.parse(req.get("startDate").toString()));
        if (req.get("endDate") != null) builder.endDate(LocalDate.parse(req.get("endDate").toString()));
        if (req.get("nextPaymentDate") != null) builder.nextPaymentDate(LocalDate.parse(req.get("nextPaymentDate").toString()));
        if (req.get("status") != null) builder.status(req.get("status").toString());
        if (req.get("notes") != null) builder.notes(req.get("notes").toString());

        if (req.get("accountId") != null) {
            accountRepository.findById(UUID.fromString(req.get("accountId").toString()))
                    .ifPresent(builder::account);
        }

        return builder.build();
    }

    private Map<String, Object> loanToMap(Loan l) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", l.getId());
        map.put("name", l.getName());
        map.put("lender", l.getLender());
        map.put("loanType", l.getLoanType());
        map.put("principal", l.getPrincipal());
        map.put("outstanding", l.getOutstanding());
        map.put("interestRate", l.getInterestRate());
        map.put("emiAmount", l.getEmiAmount());
        map.put("frequency", l.getFrequency());
        map.put("startDate", l.getStartDate());
        map.put("endDate", l.getEndDate());
        map.put("nextPaymentDate", l.getNextPaymentDate());
        map.put("totalPaid", l.getTotalPaid());
        map.put("principalPaid", l.getPrincipalPaid());
        map.put("interestPaid", l.getInterestPaid());
        map.put("status", l.getStatus());
        map.put("notes", l.getNotes());
        if (l.getAccount() != null) {
            map.put("accountId", l.getAccount().getId());
            map.put("accountName", l.getAccount().getName());
        }
        return map;
    }

    private UUID getUserId(String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow().getId();
    }
}
