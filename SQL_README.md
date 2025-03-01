# SQL Commands for Budget Tracking App

## Table Creation Commands

### 1. Profiles Table
```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    full_name TEXT,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);
```

### 2. Transactions Table
```sql
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions" 
    ON transactions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
    ON transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
    ON transactions FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
    ON transactions FOR DELETE 
    USING (auth.uid() = user_id);
```

### 3. Categories Table
```sql
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_default BOOLEAN DEFAULT false,
    UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own categories and default categories" 
    ON categories FOR SELECT 
    USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can create their own categories" 
    ON categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own categories" 
    ON categories FOR UPDATE 
    USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own categories" 
    ON categories FOR DELETE 
    USING (auth.uid() = user_id AND is_default = false);
```

## Useful Queries

### 1. Get Monthly Summary
```sql
SELECT 
    DATE_TRUNC('month', date) as month,
    type,
    SUM(amount) as total
FROM transactions
WHERE user_id = auth.uid()
GROUP BY DATE_TRUNC('month', date), type
ORDER BY month DESC;
```

### 2. Get Category Summary
```sql
SELECT 
    category,
    type,
    SUM(amount) as total
FROM transactions
WHERE user_id = auth.uid()
    AND date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY category, type
ORDER BY total DESC;
```

### 3. Get Daily Transactions
```sql
SELECT 
    t.*,
    c.icon as category_icon,
    c.color as category_color
FROM transactions t
LEFT JOIN categories c ON t.category = c.name AND (c.user_id = t.user_id OR c.is_default = true)
WHERE t.user_id = auth.uid()
    AND t.date = CURRENT_DATE
ORDER BY t.created_at DESC;
```

### 4. Insert Default Categories
```sql
INSERT INTO categories (name, type, icon, color, is_default) VALUES
    ('Salary', 'income', '💰', '#2ecc71', true),
    ('Investments', 'income', '📈', '#27ae60', true),
    ('Gifts', 'income', '🎁', '#3498db', true),
    ('Food', 'expense', '🍽️', '#e74c3c', true),
    ('Transport', 'expense', '🚗', '#e67e22', true),
    ('Shopping', 'expense', '🛍️', '#9b59b6', true),
    ('Bills', 'expense', '📃', '#f1c40f', true),
    ('Entertainment', 'expense', '🎮', '#1abc9c', true),
    ('Health', 'expense', '🏥', '#c0392b', true),
    ('Education', 'expense', '📚', '#8e44ad', true);
```

## Database Functions

### 1. Update Updated_at Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

## Notes

1. All tables have Row Level Security (RLS) enabled to ensure data privacy
2. Timestamps are stored in UTC (TIMESTAMPTZ)
3. Monetary values are stored with 2 decimal places (DECIMAL(12,2))
4. UUIDs are used as primary keys for better security and distribution
5. Foreign keys ensure referential integrity
6. Check constraints ensure data validity
7. Default categories are marked with `is_default = true` and are visible to all users

Remember to execute these commands in order, as some tables reference others through foreign keys.
