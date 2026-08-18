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
@RequestMapping("/api/businesses")
@RequiredArgsConstructor
public class BusinessController {

    private final BusinessRepository businessRepository;
    private final TransactionRepository transactionRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getBusinesses(@RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserId(authHeader);
        List<Business> businesses = businessRepository.findByUserIdOrderByNameAsc(userId);
        return ResponseEntity.ok(businesses.stream().map(this::bizToMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> createBusiness(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();

        Business biz = Business.builder()
                .user(user)
                .name(request.get("name").toString())
                .businessType(request.get("businessType") != null ? request.get("businessType").toString() : null)
                .description(request.get("description") != null ? request.get("description").toString() : null)
                .startDate(request.get("startDate") != null ? LocalDate.parse(request.get("startDate").toString()) : null)
                .monthlyTarget(request.get("monthlyTarget") != null
                        ? new BigDecimal(request.get("monthlyTarget").toString()) : BigDecimal.ZERO)
                .color(request.getOrDefault("color", "#10b981").toString())
                .build();

        biz = businessRepository.save(biz);
        return ResponseEntity.ok(bizToMap(biz));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBusiness(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Business> existing = businessRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        Business biz = existing.get();
        if (request.get("name") != null) biz.setName(request.get("name").toString());
        if (request.get("businessType") != null) biz.setBusinessType(request.get("businessType").toString());
        if (request.get("description") != null) biz.setDescription(request.get("description").toString());
        if (request.get("status") != null) biz.setStatus(request.get("status").toString());
        if (request.get("monthlyTarget") != null) biz.setMonthlyTarget(new BigDecimal(request.get("monthlyTarget").toString()));
        biz = businessRepository.save(biz);
        return ResponseEntity.ok(bizToMap(biz));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBusiness(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Business> existing = businessRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        businessRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<?> getBusinessSummary(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Business> existing = businessRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }

        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();

        BigDecimal revenue = transactionRepository.sumBusinessRevenue(userId, id, start, end);
        BigDecimal profit = revenue; // expense tracking can be added

        Map<String, Object> summary = new HashMap<>();
        summary.put("revenue", revenue);
        summary.put("expense", BigDecimal.ZERO);
        summary.put("profit", profit);
        summary.put("profitMargin", revenue.compareTo(BigDecimal.ZERO) > 0
                ? profit.divide(revenue, 4, BigDecimal.ROUND_HALF_UP).multiply(new BigDecimal("100")) : BigDecimal.ZERO);
        return ResponseEntity.ok(summary);
    }

    private Map<String, Object> bizToMap(Business b) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", b.getId());
        map.put("name", b.getName());
        map.put("businessType", b.getBusinessType());
        map.put("description", b.getDescription());
        map.put("startDate", b.getStartDate());
        map.put("monthlyTarget", b.getMonthlyTarget());
        map.put("status", b.getStatus());
        map.put("color", b.getColor());
        return map;
    }

    private UUID getUserId(String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow().getId();
    }
}
