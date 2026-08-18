package com.trackwallet.controller;

import com.trackwallet.model.*;
import com.trackwallet.repository.*;
import com.trackwallet.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final LoanRepository loanRepository;
    private final BusinessRepository businessRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getDashboard(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        UUID userId = getUserId(authHeader);

        // Default to current month
        LocalDate now = LocalDate.now();
        if (startDate == null) startDate = now.withDayOfMonth(1);
        if (endDate == null) endDate = now;

        // Income & Expenses
        BigDecimal totalIncome = transactionRepository.sumIncomeByDateRange(userId, startDate, endDate);
        BigDecimal totalExpense = transactionRepository.sumExpenseByDateRange(userId, startDate, endDate);
        BigDecimal netCashFlow = totalIncome.subtract(totalExpense);

        // Account balances
        List<Account> accounts = accountRepository.findByUserIdAndIsActiveTrueOrderByNameAsc(userId);
        BigDecimal totalBalance = accounts.stream()
                .filter(Account::getIncludeInTotal)
                .filter(a -> !a.getAccountType().equals("LOAN"))
                .map(Account::getCurrentBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total Debt
        BigDecimal totalDebt = loanRepository.findByUserIdAndStatusOrderByNextPaymentDateAsc(userId, "ACTIVE")
                .stream()
                .map(Loan::getOutstanding)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Business summary
        List<Business> businesses = businessRepository.findByUserIdAndStatusOrderByNameAsc(userId, "ACTIVE");
        BigDecimal businessRevenue = BigDecimal.ZERO;
        BigDecimal businessExpense = BigDecimal.ZERO;
        for (Business b : businesses) {
            BigDecimal rev = transactionRepository.sumBusinessRevenue(userId, b.getId(), startDate, endDate);
            businessRevenue = businessRevenue.add(rev);
        }
        BigDecimal businessProfit = businessRevenue.subtract(businessExpense);

        // Category breakdown
        List<Object[]> categoryBreakdown = transactionRepository.sumExpenseByCategory(userId, startDate, endDate);
        List<Map<String, Object>> categories = new ArrayList<>();
        for (Object[] row : categoryBreakdown) {
            Map<String, Object> cat = new HashMap<>();
            cat.put("name", row[0]);
            cat.put("amount", row[1]);
            categories.add(cat);
        }

        // Account list
        List<Map<String, Object>> accountList = new ArrayList<>();
        for (Account acc : accounts) {
            Map<String, Object> a = new HashMap<>();
            a.put("id", acc.getId());
            a.put("name", acc.getName());
            a.put("type", acc.getAccountType());
            a.put("balance", acc.getCurrentBalance());
            a.put("color", acc.getColor());
            a.put("icon", acc.getIcon());
            accountList.add(a);
        }

        // Upcoming EMIs
        List<Loan> upcomingEmis = loanRepository.findByUserIdAndStatusOrderByNextPaymentDateAsc(userId, "ACTIVE");
        List<Map<String, Object>> emiList = new ArrayList<>();
        for (Loan loan : upcomingEmis) {
            if (loan.getNextPaymentDate() != null) {
                Map<String, Object> emi = new HashMap<>();
                emi.put("id", loan.getId());
                emi.put("name", loan.getName());
                emi.put("emiAmount", loan.getEmiAmount());
                emi.put("nextPaymentDate", loan.getNextPaymentDate());
                long daysLeft = now.until(loan.getNextPaymentDate(), java.time.temporal.ChronoUnit.DAYS);
                emi.put("daysRemaining", daysLeft);
                emi.put("outstanding", loan.getOutstanding());
                String status = daysLeft < 0 ? "OVERDUE" : daysLeft == 0 ? "DUE_TODAY" : "UPCOMING";
                emi.put("status", status);
                emiList.add(emi);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalBalance", totalBalance);
        response.put("totalIncome", totalIncome);
        response.put("totalExpense", totalExpense);
        response.put("netCashFlow", netCashFlow);
        response.put("totalDebt", totalDebt);
        response.put("businessRevenue", businessRevenue);
        response.put("businessExpense", businessExpense);
        response.put("businessProfit", businessProfit);
        response.put("expenseByCategory", categories);
        response.put("accounts", accountList);
        response.put("upcomingEmis", emiList);
        response.put("startDate", startDate);
        response.put("endDate", endDate);

        return ResponseEntity.ok(response);
    }

    private UUID getUserId(String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow().getId();
    }
}
