-- ============================================================================
-- AMAR DOKAN PRO - MASTER DATABASE SCHEMA & MIGRATION
-- Multi-Business, Multi-Branch, Cloud POS & Business Management
-- Target: PostgreSQL 14+ / Supabase
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. CORE BUSINESS & BRANCH TABLES
-- ============================================================================

-- Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    business_type VARCHAR(50) DEFAULT 'general',
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'BDT',
    vat_tax_rate NUMERIC(5,2) DEFAULT 0.00,
    logo_url TEXT,
    invoice_prefix VARCHAR(20) DEFAULT 'INV',
    invoice_format VARCHAR(20) DEFAULT 'thermal',
    language VARCHAR(10) DEFAULT 'bn',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(255),
    mobile VARCHAR(50),
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles (linked to auth.users if Supabase Auth is enabled)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(50),
    avatar_url TEXT,
    is_superadmin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Business Members & Roles (Multi-user, Multi-business, Multi-branch)
CREATE TABLE IF NOT EXISTS business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'salesman', 'storekeeper', 'accountant', 'hr')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, user_id)
);

-- ============================================================================
-- 3. PRODUCTS, CATEGORIES & INVENTORY
-- ============================================================================

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120),
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, name)
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    brand VARCHAR(100),
    description TEXT,
    image_url TEXT,
    purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    wholesale_price NUMERIC(12,2),
    min_sale_price NUMERIC(12,2),
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    min_stock_alert NUMERIC(12,2) DEFAULT 5.00,
    unit VARCHAR(20) DEFAULT 'pcs',
    business_type VARCHAR(50) DEFAULT 'clothing',
    has_variants BOOLEAN DEFAULT FALSE,
    model VARCHAR(100),
    serial_number VARCHAR(100),
    warranty_period VARCHAR(50),
    expiry_date DATE,
    batch_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    color VARCHAR(50),
    size VARCHAR(50),
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    stock NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    additional_price NUMERIC(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Product Stock per Branch
CREATE TABLE IF NOT EXISTS product_branch_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    min_alert NUMERIC(12,2) DEFAULT 5.00,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, product_id, variant_id)
);

-- Stock Movements (Auditable history)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('purchase_in', 'sale_out', 'purchase_return', 'sale_return', 'adjustment', 'transfer', 'opening_stock')),
    quantity NUMERIC(12,2) NOT NULL,
    previous_stock NUMERIC(12,2) NOT NULL,
    new_stock NUMERIC(12,2) NOT NULL,
    reference VARCHAR(100),
    note TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    adjusted_qty NUMERIC(12,2) NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('damaged', 'expired', 'lost', 'inventory_correction', 'sample')),
    note TEXT,
    adjusted_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    from_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    from_branch_name VARCHAR(150),
    to_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    to_branch_name VARCHAR(150),
    transferred_by VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. CUSTOMERS & SUPPLIERS
-- ============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    address TEXT,
    email VARCHAR(100),
    customer_type VARCHAR(20) DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
    opening_due NUMERIC(12,2) DEFAULT 0.00,
    current_due NUMERIC(12,2) DEFAULT 0.00,
    credit_limit NUMERIC(12,2) DEFAULT 10000.00,
    total_purchase NUMERIC(12,2) DEFAULT 0.00,
    total_paid NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Customer Transactions (Ledger)
CREATE TABLE IF NOT EXISTS customer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(150),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale_due', 'due_collection', 'return_adjustment', 'opening')),
    amount NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50),
    account_id UUID,
    reference_id VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(150) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    address TEXT,
    email VARCHAR(100),
    opening_due NUMERIC(12,2) DEFAULT 0.00,
    current_due NUMERIC(12,2) DEFAULT 0.00,
    total_purchase NUMERIC(12,2) DEFAULT 0.00,
    total_paid NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Transactions (Ledger)
CREATE TABLE IF NOT EXISTS supplier_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name VARCHAR(150),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase_due', 'due_payment', 'return_adjustment', 'opening')),
    amount NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50),
    account_id UUID,
    reference_id VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. ACCOUNTS & FINANCIAL TRANSACTIONS
-- ============================================================================

-- Accounts (Cash, Banks, Mobile Wallets)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('cash', 'bank', 'mobile_bank')),
    account_number VARCHAR(100),
    balance NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Account Transactions
CREATE TABLE IF NOT EXISTS account_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'sale_payment', 'purchase_payment', 'customer_payment', 'supplier_payment', 'transfer_in', 'transfer_out', 'refund', 'adjustment')),
    amount NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(14,2) NOT NULL,
    reference_id VARCHAR(100),
    note TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    paid_to VARCHAR(150),
    note TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. SALES, SALE ITEMS, PAYMENTS & RETURNS
-- ============================================================================

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_mobile VARCHAR(50),
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00,
    vat_tax_rate NUMERIC(5,2) DEFAULT 0.00,
    vat_tax_amount NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    paid NUMERIC(12,2) NOT NULL,
    due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'due', 'partial', 'returned', 'voided')),
    served_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, invoice_number)
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    variant_details VARCHAR(100),
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- for profit & COGS
    discount NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sale Payments (For Split / Mixed Payments)
CREATE TABLE IF NOT EXISTS sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    trx_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales Returns
CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150),
    total_refund_amount NUMERIC(12,2) NOT NULL,
    refund_type VARCHAR(50) NOT NULL CHECK (refund_type IN ('cash', 'adjust_due')),
    returned_by VARCHAR(100),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Sales Return Items
CREATE TABLE IF NOT EXISTS sales_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_refund NUMERIC(12,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. PURCHASES, PURCHASE ITEMS & RETURNS
-- ============================================================================

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(150) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0.00,
    transport_cost NUMERIC(12,2) DEFAULT 0.00,
    other_cost NUMERIC(12,2) DEFAULT 0.00,
    total NUMERIC(12,2) NOT NULL,
    paid NUMERIC(12,2) NOT NULL,
    due NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, invoice_number)
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    purchase_price NUMERIC(12,2) NOT NULL,
    total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Returns
CREATE TABLE IF NOT EXISTS purchase_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(150),
    total_amount NUMERIC(12,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Return Items
CREATE TABLE IF NOT EXISTS purchase_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_return_id UUID NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. EMPLOYEES & SALARY
-- ============================================================================

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    position VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'salesman',
    salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    joining_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'resigned')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Salary Payments
CREATE TABLE IF NOT EXISTS salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(150) NOT NULL,
    month VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    paid_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. AUDIT LOGS & NOTIFICATIONS
-- ============================================================================

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'danger')),
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. DATABASE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_branches_biz ON branches(business_id);
CREATE INDEX IF NOT EXISTS idx_products_biz ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_prod ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_branch_stock_lookup ON product_branch_stock(branch_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_biz_branch ON stock_movements(business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_biz ON sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_cust ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_purchases_biz ON purchases(business_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supp ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_customers_biz ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_suppliers_biz ON suppliers(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_biz_created ON audit_logs(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_account_txns_acc ON account_transactions(account_id);

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_branch_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check if authenticated user belongs to business
CREATE OR REPLACE FUNCTION user_belongs_to_business(p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM business_users
        WHERE business_id = p_business_id
        AND user_id = auth.uid()
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Businesses Policy
CREATE POLICY "Users can view businesses they belong to"
ON businesses FOR SELECT
USING (user_belongs_to_business(id));

CREATE POLICY "Owners and admins can update business details"
ON businesses FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM business_users
        WHERE business_id = id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Products Policies
CREATE POLICY "Users can view products of their business"
ON products FOR SELECT
USING (user_belongs_to_business(business_id));

CREATE POLICY "Authorized users can insert products"
ON products FOR INSERT
WITH CHECK (user_belongs_to_business(business_id));

CREATE POLICY "Authorized users can update products"
ON products FOR UPDATE
USING (user_belongs_to_business(business_id));

-- Sales Policies
CREATE POLICY "Users can view sales of their business"
ON sales FOR SELECT
USING (user_belongs_to_business(business_id));

CREATE POLICY "Users can insert sales in their business"
ON sales FOR INSERT
WITH CHECK (user_belongs_to_business(business_id));

-- Customers Policies
CREATE POLICY "Users can view customers of their business"
ON customers FOR SELECT
USING (user_belongs_to_business(business_id));

CREATE POLICY "Users can insert/update customers"
ON customers FOR ALL
USING (user_belongs_to_business(business_id));

-- Suppliers Policies
CREATE POLICY "Users can access suppliers of their business"
ON suppliers FOR ALL
USING (user_belongs_to_business(business_id));

-- Accounts Policies
CREATE POLICY "Users can access accounts of their business"
ON accounts FOR ALL
USING (user_belongs_to_business(business_id));

-- ============================================================================
-- 12. STORED PROCEDURE / RPC FOR ATOMIC SALE CHECKOUT
-- Ensures atomicity: sale, items, payments, stock movement, ledger, account.
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_sale_transaction(
    p_sale JSONB,
    p_items JSONB,
    p_payments JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_sale_id UUID;
    v_business_id UUID;
    v_branch_id UUID;
    v_invoice_num VARCHAR(100);
    v_item RECORD;
    v_payment RECORD;
    v_prev_stock NUMERIC;
    v_new_stock NUMERIC;
    v_prod_name VARCHAR(255);
BEGIN
    v_business_id := (p_sale->>'business_id')::UUID;
    v_branch_id := (p_sale->>'branch_id')::UUID;
    v_invoice_num := p_sale->>'invoice_number';

    -- 1. Insert Master Sale Record
    INSERT INTO sales (
        business_id, branch_id, invoice_number, customer_id, customer_name,
        customer_mobile, subtotal, discount, vat_tax_rate, vat_tax_amount,
        total, paid, due, payment_method, status, served_by, notes
    ) VALUES (
        v_business_id,
        v_branch_id,
        v_invoice_num,
        NULLIF(p_sale->>'customer_id', '')::UUID,
        p_sale->>'customer_name',
        p_sale->>'customer_mobile',
        (p_sale->>'subtotal')::NUMERIC,
        COALESCE((p_sale->>'discount')::NUMERIC, 0),
        COALESCE((p_sale->>'vat_tax_rate')::NUMERIC, 0),
        COALESCE((p_sale->>'vat_tax_amount')::NUMERIC, 0),
        (p_sale->>'total')::NUMERIC,
        (p_sale->>'paid')::NUMERIC,
        (p_sale->>'due')::NUMERIC,
        p_sale->>'payment_method',
        p_sale->>'status',
        p_sale->>'served_by',
        p_sale->>'notes'
    ) RETURNING id INTO v_sale_id;

    -- 2. Insert Sale Items & Deduct Stock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID, variant_id UUID, product_name VARCHAR, sku VARCHAR,
        variant_details VARCHAR, quantity NUMERIC, unit_price NUMERIC,
        purchase_price NUMERIC, discount NUMERIC, total NUMERIC
    )
    LOOP
        INSERT INTO sale_items (
            sale_id, product_id, variant_id, product_name, sku,
            variant_details, quantity, unit_price, purchase_price, discount, total
        ) VALUES (
            v_sale_id, v_item.product_id, v_item.variant_id, v_item.product_name,
            v_item.sku, v_item.variant_details, v_item.quantity, v_item.unit_price,
            v_item.purchase_price, v_item.discount, v_item.total
        );

        -- Get current stock
        SELECT current_stock, name INTO v_prev_stock, v_prod_name FROM products WHERE id = v_item.product_id FOR UPDATE;
        v_new_stock := GREATEST(0, v_prev_stock - v_item.quantity);

        -- Update Product stock
        UPDATE products SET current_stock = v_new_stock, updated_at = CURRENT_TIMESTAMP WHERE id = v_item.product_id;

        -- Record Stock Movement
        INSERT INTO stock_movements (
            business_id, branch_id, product_id, variant_id, product_name,
            movement_type, quantity, previous_stock, new_stock, reference, note
        ) VALUES (
            v_business_id, v_branch_id, v_item.product_id, v_item.variant_id, v_prod_name,
            'sale_out', -v_item.quantity, v_prev_stock, v_new_stock, v_invoice_num, 'বিক্রি ইনভয়েস: ' || v_invoice_num
        );
    END LOOP;

    -- 3. Insert Payments & Credit Accounts
    FOR v_payment IN SELECT * FROM jsonb_to_recordset(p_payments) AS p(
        account_id UUID, payment_method VARCHAR, amount NUMERIC, trx_id VARCHAR
    )
    LOOP
        IF v_payment.amount > 0 THEN
            INSERT INTO sale_payments (
                sale_id, account_id, payment_method, amount, trx_id
            ) VALUES (
                v_sale_id, v_payment.account_id, v_payment.payment_method, v_payment.amount, v_payment.trx_id
            );

            -- Update account balance
            IF v_payment.account_id IS NOT NULL THEN
                UPDATE accounts
                SET balance = balance + v_payment.amount, updated_at = CURRENT_TIMESTAMP
                WHERE id = v_payment.account_id;

                INSERT INTO account_transactions (
                    business_id, account_id, transaction_type, amount, balance_after, reference_id, note
                )
                SELECT v_business_id, v_payment.account_id, 'sale_payment', v_payment.amount, balance, v_invoice_num, 'বিক্রি আদায়: ' || v_invoice_num
                FROM accounts WHERE id = v_payment.account_id;
            END IF;
        END IF;
    END LOOP;

    -- 4. Customer Due Ledger Update
    IF (p_sale->>'customer_id') IS NOT NULL AND (p_sale->>'due')::NUMERIC > 0 THEN
        UPDATE customers
        SET current_due = current_due + (p_sale->>'due')::NUMERIC,
            total_purchase = total_purchase + (p_sale->>'total')::NUMERIC,
            total_paid = total_paid + (p_sale->>'paid')::NUMERIC,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (p_sale->>'customer_id')::UUID;

        INSERT INTO customer_transactions (
            business_id, customer_id, customer_name, transaction_type,
            amount, balance_after, payment_method, reference_id, note
        )
        SELECT v_business_id, id, name, 'sale_due', (p_sale->>'due')::NUMERIC, current_due, p_sale->>'payment_method', v_invoice_num, 'বিক্রি বাকি: ' || v_invoice_num
        FROM customers WHERE id = (p_sale->>'customer_id')::UUID;
    END IF;

    -- 5. Audit Log
    INSERT INTO audit_logs (
        business_id, branch_id, action, entity_type, entity_id, details
    ) VALUES (
        v_business_id, v_branch_id, 'SALE_COMPLETED', 'sale', v_sale_id::TEXT,
        'বিক্রি সম্পন্ন: ' || v_invoice_num || ', মোট: ৳' || (p_sale->>'total')
    );

    RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'invoice_number', v_invoice_num);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
