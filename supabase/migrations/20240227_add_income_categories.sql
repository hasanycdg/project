-- Add both expense and income categories
INSERT INTO categories (user_id, name, type)
SELECT 
    auth.uid(),
    name,
    category_type
FROM (
    VALUES 
        ('Salary', 'income'),
        ('Freelance Income', 'income'),
        ('Investment Returns', 'income'),
        ('Other Income', 'income'),
        ('Food & Dining', 'expense'),
        ('Transportation', 'expense'),
        ('Shopping', 'expense'),
        ('Bills & Utilities', 'expense'),
        ('Entertainment', 'expense'),
        ('Health', 'expense'),
        ('Travel', 'expense'),
        ('Other', 'expense')
) AS default_categories(name, category_type)
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE user_id = auth.uid()
);
