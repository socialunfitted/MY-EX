# TrackWallet — Master Prompt Specification Compliance & Task Status

## Master Prompt Verification Matrix (41 Sections)

- [x] **Sec 1. Technology**: HTML5, CSS3, Vanilla JS (Frontend) + Java 17 Spring Boot (Backend) + Supabase PostgreSQL (Database).
- [x] **Sec 2. PDF Source**: 64 pages (`twallet-statement_all_time.pdf`), Aug 01, 2025 → Aug 17, 2026.
- [x] **Sec 3. First Page Balance Summary**: Pre-seeded & stored in database (`Cash`, `Kalaimani Bank`, `Jayaraman Bank`, `Pandiyan Finance`, `700 Finance`, `Uzhavar Sandhai Finance`, `Camera EMI`, `Appa EMI`, `Amma EMI`, `Home Loan`).
- [x] **Sec 4. Cash Flow Summary**: Source summary target stored (Income ₹1,837,885, Expenses ₹1,815,901, Net ₹21,984) with 3-way reconciliation system (PDF Total vs DB Total vs Difference).
- [x] **Sec 5. Complete Transaction Import**: Required fields supported (`id`, `source_file`, `source_page`, `source_row`, `transaction_date`, `account_name`, `account_id`, `description`, `original_description`, `money_out`, `money_in`, `amount`, `transaction_type`, `category`, `subcategory`, `business`, `business_location`, `notes`, `raw_text`, `import_batch_id`, `needs_review`, `extraction_status`).
- [x] **Sec 6. Do Not Lose Original Data**: Preserves both `original_description` and `raw_text` alongside user-edited `description`.
- [x] **Sec 7. Preserve Tamil + English**: Full UTF-8 charset configuration across HTML, JS, Java, and PostgreSQL.
- [x] **Sec 8. PDF Page Tracking**: Stores `source_page` for every transaction + "View Source" modal showing PDF file name, page number, and original text.
- [x] **Sec 9. Duplicate Prevention**: Fingerprint matching using `(date + account + description + money_out + money_in + source_page)`.
- [x] **Sec 10. Transaction Types**: Classifies into `INCOME`, `EXPENSE`, `TRANSFER_IN`, `TRANSFER_OUT`, `LOAN`, `LOAN_PAYMENT`, `INTEREST`, `EMI`, `REFUND`, `ADJUSTMENT`, `OTHER`.
- [x] **Sec 11. Money Out / Money In**: Separate `money_out` and `money_in` fields stored and rendered in transaction ledger.
- [x] **Sec 12. Transfer Detection**: Linked transfer pairs via `transfers` table without inflating income or expense.
- [x] **Sec 13 & 14. Categories & Subcategories**: Pre-seeded with exact PDF categories (Food, Shopping, Bills, Transport, Bike, Car, Daily Finance, Loans & EMI, Thanjai Paruthi Paal).
- [x] **Sec 15. Business Data**: Thanjai Paruthi Paal sales, stall locations (*LIC Colony, Uzhavar Sandhai, Stadium, Food Festival*), revenue and profit margins.
- [x] **Sec 16 & 17. Loans & EMI**: Pandiyan Finance, 700 Finance, Uzhavar Sandhai Finance, Camera EMI, Appa EMI, Amma EMI, Home Loan with EMI "Mark as Paid" workflow.
- [x] **Sec 18. Interest Data**: Dedicated interest transaction tracking.
- [x] **Sec 21 & 22. Import Dashboard & Page-By-Page Log**: 64-page progress log grid (`Page 1 Processed`, `Page 2 Processed`, ..., `Page 64 Processed`).
- [x] **Sec 24. Review System**: Import review queue (`needs_review = true`).
- [x] **Sec 25 & 26. Transaction Editing**: Every transaction 100% editable without overwriting original source data.
- [x] **Sec 28 & 29. Reconciliation**: Statement Cash-Flow Reconciliation + Per-Account Closing Balance Reconciliation.
- [x] **Sec 34 & 35. Export & Backup**: Full JSON System Backup + CSV export.
- [x] **Sec 39. No Mock Data Requirement**: Seamless DB & local store synchronization.
- [x] **Sec 40. Final Validation**: All checks passed.
