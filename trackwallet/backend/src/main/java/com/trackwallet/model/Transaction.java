package com.trackwallet.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "import_batch_id")
    private UUID importBatchId;

    @Column(name = "source_file", length = 500)
    @Builder.Default
    private String sourceFile = "twallet-statement_all_time.pdf";

    @Column(name = "source_page")
    @Builder.Default
    private Integer sourcePage = 1;

    @Column(name = "source_row")
    @Builder.Default
    private Integer sourceRow = 1;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "original_account_name", length = 255)
    private String originalAccountName;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "original_description", nullable = false, columnDefinition = "TEXT")
    private String originalDescription;

    @Column(name = "raw_text", nullable = false, columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "money_out", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal moneyOut = BigDecimal.ZERO;

    @Column(name = "money_in", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal moneyIn = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String type; // INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT, LOAN, LOAN_PAYMENT, INTEREST, EMI, REFUND, ADJUSTMENT, OTHER

    @Column(length = 20)
    @Builder.Default
    private String context = "PERSONAL";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcategory_id")
    private Subcategory subcategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id")
    private Business business;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "needs_review")
    @Builder.Default
    private Boolean needsReview = false;

    @Column(name = "extraction_status", length = 50)
    @Builder.Default
    private String extractionStatus = "SUCCESS";

    @Column(length = 20)
    @Builder.Default
    private String status = "CLEARED";

    @Column(length = 255)
    private String fingerprint;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
