-- Check if transactions table exists, if not create it
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Check if categories table exists, if not create it
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add default categories if none exist
INSERT INTO categories (user_id, name)
SELECT 
    auth.uid(),
    category_name
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
) AS default_categories(category_name)
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE user_id = auth.uid()
);
