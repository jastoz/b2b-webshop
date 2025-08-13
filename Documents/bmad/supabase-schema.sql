-- Supabase PostgreSQL Schema for B2B Webshop
-- Based on existing JSON data structures

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table (normalized from products)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subcategories table
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table (normalized from products)
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    code INTEGER UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    alt_name TEXT,
    unit TEXT NOT NULL DEFAULT 'KOM',
    category_id INTEGER REFERENCES categories(id),
    subcategory_id INTEGER REFERENCES subcategories(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    weight DECIMAL(10,3) DEFAULT 0,
    pack_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts table (normalized from customers.contracts)
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    contract_id INTEGER NOT NULL,
    name TEXT,
    date_from DATE,
    date_to DATE,
    payment_terms INTEGER DEFAULT 0,
    payment_method TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, contract_id)
);

-- Customer Products relationship table
CREATE TABLE customer_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    product_code TEXT REFERENCES products(code) ON DELETE CASCADE,
    contract_id INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_code)
);

-- Orders table (for cart persistence and order history)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processing', 'completed', 'cancelled')),
    total_value DECIMAL(12,2) DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_code TEXT REFERENCES products(code),
    product_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customer_products_customer ON customer_products(customer_id);
CREATE INDEX idx_customer_products_product ON customer_products(product_code);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_active ON contracts(is_active);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Full-text search index for products
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('english', name || ' ' || COALESCE(alt_name, '')));

-- Row Level Security (RLS) Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Customers can only see their own data
CREATE POLICY "customers_select_own" ON customers
    FOR SELECT USING (auth.uid()::text = id);

-- Customer products - customers can only see products they have contracts for
CREATE POLICY "customer_products_select_own" ON customer_products
    FOR SELECT USING (auth.uid()::text = customer_id);

-- Orders - customers can only see their own orders
CREATE POLICY "orders_select_own" ON orders
    FOR SELECT USING (auth.uid()::text = customer_id);

CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT WITH CHECK (auth.uid()::text = customer_id);

CREATE POLICY "orders_update_own" ON orders
    FOR UPDATE USING (auth.uid()::text = customer_id);

-- Order items - customers can only see items from their orders
CREATE POLICY "order_items_select_own" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.customer_id = auth.uid()::text
        )
    );

CREATE POLICY "order_items_insert_own" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.customer_id = auth.uid()::text
        )
    );

-- Public access to products, categories, suppliers, subcategories (read-only)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_all" ON products FOR SELECT USING (TRUE);
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "subcategories_select_all" ON subcategories FOR SELECT USING (TRUE);
CREATE POLICY "suppliers_select_all" ON suppliers FOR SELECT USING (TRUE);

-- Functions for better querying
CREATE OR REPLACE FUNCTION get_customer_products(customer_id_param TEXT)
RETURNS TABLE (
    product_code TEXT,
    product_name TEXT,
    alt_name TEXT,
    unit TEXT,
    price DECIMAL(10,2),
    category_name TEXT,
    subcategory_name TEXT,
    supplier_name TEXT,
    weight DECIMAL(10,3),
    pack_size INTEGER,
    contract_id INTEGER,
    discount DECIMAL(5,2),
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.code,
        p.name,
        p.alt_name,
        p.unit,
        cp.price,
        c.name as category_name,
        sc.name as subcategory_name,
        s.name as supplier_name,
        p.weight,
        p.pack_size,
        cp.contract_id,
        cp.discount,
        cp.is_active
    FROM customer_products cp
    JOIN products p ON cp.product_code = p.code
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE cp.customer_id = customer_id_param
    AND cp.is_active = TRUE
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for product search
CREATE OR REPLACE FUNCTION search_customer_products(
    customer_id_param TEXT,
    search_term TEXT DEFAULT '',
    category_filter TEXT DEFAULT '',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    product_code TEXT,
    product_name TEXT,
    alt_name TEXT,
    unit TEXT,
    price DECIMAL(10,2),
    category_name TEXT,
    subcategory_name TEXT,
    supplier_name TEXT,
    weight DECIMAL(10,3)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.code,
        p.name,
        p.alt_name,
        p.unit,
        cp.price,
        c.name as category_name,
        sc.name as subcategory_name,
        s.name as supplier_name,
        p.weight
    FROM customer_products cp
    JOIN products p ON cp.product_code = p.code
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE cp.customer_id = customer_id_param
    AND cp.is_active = TRUE
    AND (
        search_term = '' OR 
        p.name ILIKE '%' || search_term || '%' OR
        p.alt_name ILIKE '%' || search_term || '%'
    )
    AND (
        category_filter = '' OR
        c.name = category_filter
    )
    ORDER BY p.name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_products_updated_at BEFORE UPDATE ON customer_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update contract active status
CREATE OR REPLACE FUNCTION update_contract_active_status()
RETURNS VOID AS $$
BEGIN
    UPDATE contracts 
    SET is_active = (
        date_from <= CURRENT_DATE AND 
        date_to >= CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Update active status on insert/update
CREATE OR REPLACE FUNCTION check_contract_active_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_active = (
        NEW.date_from <= CURRENT_DATE AND 
        NEW.date_to >= CURRENT_DATE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contract_active_status
    BEFORE INSERT OR UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION check_contract_active_status();