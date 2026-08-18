package com.trackwallet.controller;

import com.trackwallet.model.*;
import com.trackwallet.repository.*;
import com.trackwallet.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final SubcategoryRepository subcategoryRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getCategories(@RequestHeader("Authorization") String authHeader) {
        UUID userId = getUserId(authHeader);
        List<Category> categories = categoryRepository.findByUserIdOrderBySortOrderAscNameAsc(userId);
        return ResponseEntity.ok(categories.stream().map(this::catToMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> createCategory(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();

        Category cat = Category.builder()
                .user(user)
                .name(request.get("name").toString())
                .type(request.getOrDefault("type", "EXPENSE").toString())
                .color(request.getOrDefault("color", "#6366f1").toString())
                .icon(request.getOrDefault("icon", "category").toString())
                .sortOrder(request.get("sortOrder") != null ? Integer.parseInt(request.get("sortOrder").toString()) : 0)
                .build();

        cat = categoryRepository.save(cat);
        return ResponseEntity.ok(catToMap(cat));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Category> existing = categoryRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        Category cat = existing.get();
        if (request.get("name") != null) cat.setName(request.get("name").toString());
        if (request.get("type") != null) cat.setType(request.get("type").toString());
        if (request.get("color") != null) cat.setColor(request.get("color").toString());
        if (request.get("icon") != null) cat.setIcon(request.get("icon").toString());
        cat = categoryRepository.save(cat);
        return ResponseEntity.ok(catToMap(cat));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Category> existing = categoryRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // Subcategories
    @GetMapping("/{categoryId}/subcategories")
    public ResponseEntity<?> getSubcategories(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID categoryId
    ) {
        List<Subcategory> subs = subcategoryRepository.findByCategoryIdAndIsActiveTrueOrderBySortOrderAscNameAsc(categoryId);
        return ResponseEntity.ok(subs.stream().map(this::subToMap).toList());
    }

    @PostMapping("/{categoryId}/subcategories")
    public ResponseEntity<?> createSubcategory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID categoryId,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        User user = userRepository.findById(userId).orElseThrow();
        Category category = categoryRepository.findById(categoryId).orElseThrow();

        Subcategory sub = Subcategory.builder()
                .user(user)
                .category(category)
                .name(request.get("name").toString())
                .color(request.get("color") != null ? request.get("color").toString() : null)
                .build();

        sub = subcategoryRepository.save(sub);
        return ResponseEntity.ok(subToMap(sub));
    }

    @PutMapping("/subcategories/{id}")
    public ResponseEntity<?> updateSubcategory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Subcategory> existing = subcategoryRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        Subcategory sub = existing.get();
        if (request.get("name") != null) sub.setName(request.get("name").toString());
        if (request.get("color") != null) sub.setColor(request.get("color").toString());
        sub = subcategoryRepository.save(sub);
        return ResponseEntity.ok(subToMap(sub));
    }

    @DeleteMapping("/subcategories/{id}")
    public ResponseEntity<?> deleteSubcategory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID id
    ) {
        UUID userId = getUserId(authHeader);
        Optional<Subcategory> existing = subcategoryRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        subcategoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    private Map<String, Object> catToMap(Category c) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("name", c.getName());
        map.put("type", c.getType());
        map.put("color", c.getColor());
        map.put("icon", c.getIcon());
        map.put("isActive", c.getIsActive());
        map.put("sortOrder", c.getSortOrder());
        return map;
    }

    private Map<String, Object> subToMap(Subcategory s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("name", s.getName());
        map.put("color", s.getColor());
        map.put("categoryId", s.getCategory().getId());
        map.put("categoryName", s.getCategory().getName());
        return map;
    }

    private UUID getUserId(String authHeader) {
        String token = authHeader.substring(7);
        String username = jwtService.extractUsername(token);
        return userRepository.findByUsername(username).orElseThrow().getId();
    }
}
