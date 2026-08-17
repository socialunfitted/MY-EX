-- ============================================================
-- TrackWallet - Complete Database Schema (Master Prompt Spec)
-- Database: Supabase PostgreSQL
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'INR',
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- IMPORT BATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_hash VARCHAR(100),
    import_date TIMESTAMPTZ DEFAULT NOW(),
    total_pages INTEGER DEFAULT 64,
    pages_processed INTEGER DEFAULT 0,
    transactions_found INTEGER DEFAULT 0,
    transactions_imported INTEGER DEFAULT 0,
    duplicates_found INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'COMPLETED', -- PENDING, PROCESSING, COMPLETED, FAILED
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('CASH','BANK','WALLET','LOAN','CREDIT','INVESTMENT','OTHER')),
    opening_balance NUMERIC(15,2) DEFAULT 0,
    source_money_out NUMERIC(15,2) DEFAULT 0,
    source_money_in NUMERIC(15,2) DEFAULT 0,
    source_closing_balance NUMERIC(15,2) DEFAULT 0,
    current_balance NUMERIC(15,2) DEFAULT 0,
    institution VARCHAR(255),
    account_number VARCHAR(100),
    color VARCHAR(20) DEFAULT '#6366f1',
    icon VARCHAR(50) DEFAULT 'account_balance_wallet',
    is_active BOOLEAN DEFAULT TRUE,
    include_in_total BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    source_name VARCHAR(255),
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME','EXPENSE','BOTH')),
    color VARCHAR(20) DEFAULT '#6366f1',
    icon VARCHAR(50) DEFAULT 'category',
    is_active BOOLEAN DEFAULT TRUE,
    editable BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBCATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source_name VARCHAR(255),
    color VARCHAR(20),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    description TEXT,
    start_date DATE,
    monthly_target NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    color VARCHAR(20) DEFAULT '#10b981',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUSINESS LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS business_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS (Master Specification)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
    source_file VARCHAR(500) DEFAULT 'twallet-statement_all_time.pdf',
    source_page INTEGER DEFAULT 1,
    source_row INTEGER DEFAULT 1,
    transaction_date DATE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    original_account_name VARCHAR(255),
    description VARCHAR(500) NOT NULL,
    original_description TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    money_out NUMERIC(15,2) DEFAULT 0,
    money_in NUMERIC(15,2) DEFAULT 0,
    amount NUMERIC(15,2) NOT NULL,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
        'INCOME','EXPENSE','TRANSFER_IN','TRANSFER_OUT',
        'LOAN','LOAN_PAYMENT','INTEREST','EMI',
        'REFUND','ADJUSTMENT','OTHER'
    )),
    context VARCHAR(20) DEFAULT 'PERSONAL',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    location_id UUID REFERENCES business_locations(id) ON DELETE SET NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    notes TEXT,
    needs_review BOOLEAN DEFAULT FALSE,
    extraction_status VARCHAR(50) DEFAULT 'SUCCESS',
    status VARCHAR(20) DEFAULT 'CLEARED',
    fingerprint VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    source_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    destination_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    from_account UUID REFERENCES accounts(id) ON DELETE SET NULL,
    to_account UUID REFERENCES accounts(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL,
    transfer_date DATE NOT NULL,
    source_page INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOANS
-- ============================================================
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    source_account VARCHAR(255),
    lender VARCHAR(255),
    loan_type VARCHAR(50) DEFAULT 'PERSONAL',
    opening_balance NUMERIC(15,2) DEFAULT 0,
    source_balance NUMERIC(15,2) DEFAULT 0,
    current_balance NUMERIC(15,2) DEFAULT 0,
    principal NUMERIC(15,2) DEFAULT 0,
    outstanding NUMERIC(15,2) DEFAULT 0,
    interest_rate NUMERIC(8,4) DEFAULT 0,
    emi_amount NUMERIC(15,2) DEFAULT 0,
    frequency VARCHAR(20) DEFAULT 'MONTHLY',
    next_payment_date DATE,
    total_paid NUMERIC(15,2) DEFAULT 0,
    principal_paid NUMERIC(15,2) DEFAULT 0,
    interest_paid NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOAN PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    amount NUMERIC(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    type VARCHAR(50) DEFAULT 'EMI',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    period VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget NUMERIC(15,2) DEFAULT 0,
    alert_threshold INTEGER DEFAULT 80,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAVINGS GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(15,2) NOT NULL,
    current_amount NUMERIC(15,2) DEFAULT 0,
    deadline DATE,
    priority VARCHAR(10) DEFAULT 'MEDIUM',
    color VARCHAR(20) DEFAULT '#6366f1',
    icon VARCHAR(50) DEFAULT 'savings',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SOURCE SUMMARY (Historical PDF Baseline Target)
-- ============================================================
CREATE TABLE IF NOT EXISTS source_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    statement_period VARCHAR(255) DEFAULT 'Aug 01, 2025 - Aug 17, 2026',
    pdf_income NUMERIC(15,2) DEFAULT 1837885.00,
    pdf_expense NUMERIC(15,2) DEFAULT 1815901.00,
    pdf_net NUMERIC(15,2) DEFAULT 21984.00,
    total_pages INTEGER DEFAULT 64,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_batch ON transactions(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source_page ON transactions(source_page);
CREATE INDEX IF NOT EXISTS idx_transactions_fingerprint ON transactions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
