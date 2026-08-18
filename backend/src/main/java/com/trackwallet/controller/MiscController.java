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
@RequestMapping("/api")
@RequiredArgsConstructor
public class MiscController {

    private final BudgetRepository budgetRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    // ========== BUDGETS ==========
    @GetMapping("/budgets")
    public ResponseEntity<?> getBudgets(@RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserId(authHeader);
        return ResponseEntity.ok(budgetRepository.findByUserIdOrderByStartDateDesc(userId)
                .stream().map(this::budgetToMap).toList());
    }

    @PostMapping("/budgets")
    public ResponseEntity<?> createBudget(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> req
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();
        Budget budget = Budget.builder()
                .user(user)
                .name(req.get("name").toString())
                .period(req.getOrDefault("period", "MONTHLY").toString())
                .startDate(LocalDate.parse(req.get("startDate").toString()))
                .endDate(LocalDate.parse(req.get("endDate").toString()))
                .totalBudget(req.get("totalBudget") != null ? new BigDecimal(req.get("totalBudget").toString()) : BigDecimal.ZERO)
                .alertThreshold(req.get("alertThreshold") != null ? Integer.parseInt(req.get("alertThreshold").toString()) : 80)
                .notes(req.get("notes") != null ? req.get("notes").toString() : null)
                .build();
        budget = budgetRepository.save(budget);
        return ResponseEntity.ok(budgetToMap(budget));
    }

    @PutMapping("/budgets/{id}")
    public ResponseEntity<?> updateBudget(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> req
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Budget> existing = budgetRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        Budget budget = existing.get();
        if (req.get("name") != null) budget.setName(req.get("name").toString());
        if (req.get("totalBudget") != null) budget.setTotalBudget(new BigDecimal(req.get("totalBudget").toString()));
        if (req.get("alertThreshold") != null) budget.setAlertThreshold(Integer.parseInt(req.get("alertThreshold").toString()));
        budget = budgetRepository.save(budget);
        return ResponseEntity.ok(budgetToMap(budget));
    }

    @DeleteMapping("/budgets/{id}")
    public ResponseEntity<?> deleteBudget(
            @RequestHeader("Authorization") String authHeader, @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Budget> existing = budgetRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        budgetRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ========== GOALS ==========
    @GetMapping("/goals")
    public ResponseEntity<?> getGoals(@RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserId(authHeader);
        return ResponseEntity.ok(savingsGoalRepository.findByUserIdOrderByPriorityDescNameAsc(userId)
                .stream().map(this::goalToMap).toList());
    }

    @PostMapping("/goals")
    public ResponseEntity<?> createGoal(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> req
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();
        SavingsGoal goal = SavingsGoal.builder()
                .user(user)
                .name(req.get("name").toString())
                .targetAmount(new BigDecimal(req.get("targetAmount").toString()))
                .currentAmount(req.get("currentAmount") != null ? new BigDecimal(req.get("currentAmount").toString()) : BigDecimal.ZERO)
                .deadline(req.get("deadline") != null ? LocalDate.parse(req.get("deadline").toString()) : null)
                .monthlyTarget(req.get("monthlyTarget") != null ? new BigDecimal(req.get("monthlyTarget").toString()) : BigDecimal.ZERO)
                .priority(req.getOrDefault("priority", "MEDIUM").toString())
                .color(req.getOrDefault("color", "#6366f1").toString())
                .icon(req.getOrDefault("icon", "savings").toString())
                .notes(req.get("notes") != null ? req.get("notes").toString() : null)
                .build();
        goal = savingsGoalRepository.save(goal);
        return ResponseEntity.ok(goalToMap(goal));
    }

    @PutMapping("/goals/{id}")
    public ResponseEntity<?> updateGoal(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> req
    ) {
        UUID userId = getUserId(authHeader);
        Optional<SavingsGoal> existing = savingsGoalRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        SavingsGoal goal = existing.get();
        if (req.get("name") != null) goal.setName(req.get("name").toString());
        if (req.get("targetAmount") != null) goal.setTargetAmount(new BigDecimal(req.get("targetAmount").toString()));
        if (req.get("currentAmount") != null) goal.setCurrentAmount(new BigDecimal(req.get("currentAmount").toString()));
        if (req.get("status") != null) goal.setStatus(req.get("status").toString());
        if (req.get("priority") != null) goal.setPriority(req.get("priority").toString());
        goal = savingsGoalRepository.save(goal);
        return ResponseEntity.ok(goalToMap(goal));
    }

    @DeleteMapping("/goals/{id}")
    public ResponseEntity<?> deleteGoal(
            @RequestHeader("Authorization") String authHeader, @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<SavingsGoal> existing = savingsGoalRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        savingsGoalRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ========== NET WORTH ==========
    @GetMapping("/networth")
    public ResponseEntity<?> getNetWorth(@RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserId(authHeader);
        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);

        BigDecimal assets = accounts.stream()
                .filter(a -> !a.getAccountType().equals("LOAN") && !a.getAccountType().equals("CREDIT"))
                .filter(Account::getIncludeInTotal)
                .map(Account::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal liabilities = accounts.stream()
                .filter(a -> a.getAccountType().equals("LOAN") || a.getAccountType().equals("CREDIT"))
                .map(a -> a.getCurrentBalance().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netWorth = assets.subtract(liabilities);

        Map<String, Object> response = new HashMap<>();
        response.put("assets", assets);
        response.put("liabilities", liabilities);
        response.put("netWorth", netWorth);
        response.put("accounts", accounts.stream().map(a -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", a.getId());
            m.put("name", a.getName());
            m.put("type", a.getAccountType());
            m.put("balance", a.getCurrentBalance());
            return m;
        }).toList());
        return ResponseEntity.ok(response);
    }

    // ========== REPORTS ==========
    @GetMapping("/reports/monthly")
    public ResponseEntity<?> getMonthlyReport(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        UUID userId = getUserId(authHeader);
        int reportYear = year != null ? year : LocalDate.now().getYear();
        
        LocalDate start;
        LocalDate end;
        if (month != null && month >= 1 && month <= 12) {
            start = LocalDate.of(reportYear, month, 1);
            end = start.withDayOfMonth(start.lengthOfMonth());
        } else {
            start = LocalDate.of(reportYear, 1, 1);
            end = LocalDate.of(reportYear, 12, 31);
        }

        List<Object[]> breakdown = transactionRepository.getMonthlyBreakdown(userId, start, end);
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        for (Object[] row : breakdown) {
            Map<String, Object> m = new HashMap<>();
            m.put("month", row[0]);
            m.put("year", row[1]);
            m.put("income", row[2]);
            m.put("expense", row[3]);
            BigDecimal income = (BigDecimal) row[2];
            BigDecimal expense = (BigDecimal) row[3];
            m.put("net", income.subtract(expense));
            monthlyData.add(m);
        }

        BigDecimal totalIncome = transactionRepository.sumIncomeByDateRange(userId, start, end);
        BigDecimal totalExpense = transactionRepository.sumExpenseByDateRange(userId, start, end);

        Map<String, Object> response = new HashMap<>();
        response.put("year", reportYear);
        response.put("month", month);
        response.put("monthlyBreakdown", monthlyData);
        response.put("totalIncome", totalIncome);
        response.put("totalExpense", totalExpense);
        response.put("netSavings", totalIncome.subtract(totalExpense));
        return ResponseEntity.ok(response);
    }

    // ========== TRANSFERS ==========
    @PostMapping("/transfers")
    public ResponseEntity<?> createTransfer(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> req
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();

        UUID fromAccountId = UUID.fromString(req.get("fromAccountId").toString());
        UUID toAccountId = UUID.fromString(req.get("toAccountId").toString());
        BigDecimal amount = new BigDecimal(req.get("amount").toString());
        LocalDate date = req.get("date") != null ? LocalDate.parse(req.get("date").toString()) : LocalDate.now();
        String description = req.getOrDefault("description", "Transfer").toString();

        Account fromAccount = accountRepository.findById(fromAccountId).orElseThrow();
        Account toAccount = accountRepository.findById(toAccountId).orElseThrow();

        // Create debit from source
        Transaction debit = Transaction.builder()
                .user(user)
                .account(fromAccount)
                .transactionDate(date)
                .amount(amount)
                .type("TRANSFER_OUT")
                .context("OTHER")
                .description("Transfer to: " + toAccount.getName() + (description.isEmpty() ? "" : " - " + description))
                .status("CLEARED")
                .build();

        // Create credit to destination
        Transaction credit = Transaction.builder()
                .user(user)
                .account(toAccount)
                .transactionDate(date)
                .amount(amount)
                .type("TRANSFER_IN")
                .context("OTHER")
                .description("Transfer from: " + fromAccount.getName() + (description.isEmpty() ? "" : " - " + description))
                .status("CLEARED")
                .build();

        debit = transactionRepository.save(debit);
        credit = transactionRepository.save(credit);

        // Link them
        debit.setTransferId(credit.getId());
        credit.setTransferId(debit.getId());
        transactionRepository.save(debit);
        transactionRepository.save(credit);

        // Update balances
        BigDecimal fromCredits = transactionRepository.sumCreditsForAccount(fromAccountId);
        BigDecimal fromDebits = transactionRepository.sumDebitsForAccount(fromAccountId);
        fromAccount.setCurrentBalance(fromAccount.getOpeningBalance().add(fromCredits).subtract(fromDebits));
        accountRepository.save(fromAccount);

        BigDecimal toCredits = transactionRepository.sumCreditsForAccount(toAccountId);
        BigDecimal toDebits = transactionRepository.sumDebitsForAccount(toAccountId);
        toAccount.setCurrentBalance(toAccount.getOpeningBalance().add(toCredits).subtract(toDebits));
        accountRepository.save(toAccount);

        return ResponseEntity.ok(Map.of(
            "message", "Transfer completed",
            "debitTransactionId", debit.getId(),
            "creditTransactionId", credit.getId(),
            "fromAccount", fromAccount.getName(),
            "toAccount", toAccount.getName(),
            "amount", amount
        ));
    }

    private Map<String, Object> budgetToMap(Budget b) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", b.getId());
        m.put("name", b.getName());
        m.put("period", b.getPeriod());
        m.put("startDate", b.getStartDate());
        m.put("endDate", b.getEndDate());
        m.put("totalBudget", b.getTotalBudget());
        m.put("alertThreshold", b.getAlertThreshold());
        m.put("isActive", b.getIsActive());
        m.put("notes", b.getNotes());
        return m;
    }

    private Map<String, Object> goalToMap(SavingsGoal g) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", g.getId());
        m.put("name", g.getName());
        m.put("targetAmount", g.getTargetAmount());
        m.put("currentAmount", g.getCurrentAmount());
        m.put("deadline", g.getDeadline());
        m.put("monthlyTarget", g.getMonthlyTarget());
        m.put("priority", g.getPriority());
        m.put("color", g.getColor());
        m.put("icon", g.getIcon());
        m.put("status", g.getStatus());
        BigDecimal progress = g.getTargetAmount().compareTo(BigDecimal.ZERO) > 0
                ? g.getCurrentAmount().divide(g.getTargetAmount(), 4, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("100"))
                : BigDecimal.ZERO;
        m.put("progressPercent", progress);
        return m;
    }

    private UUID getUserId(String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow().getId();
    }
}
