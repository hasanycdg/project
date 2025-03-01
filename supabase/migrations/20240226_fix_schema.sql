-- Drop existing tables to recreate with correct schema
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;

-- Create categories table first
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table with proper foreign key
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view own categories"
ON categories FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
ON categories FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (user_id, name, type)
SELECT 
    auth.uid(),
    name,
    'expense' as type
FROM (
    VALUES 
        ('Food & Dining'),
        ('Transportation'),
        ('Shopping'),
        ('Bills & Utilities'),
        ('Entertainment'),
        ('Health'),
        ('Travel'),
        ('Other')
) AS default_categories(name)
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE user_id = auth.uid()
);
