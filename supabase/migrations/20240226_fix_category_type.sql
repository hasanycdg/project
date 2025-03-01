ALTER TABLE categories
ADD COLUMN IF NOT EXISTS type VARCHAR(7) NOT NULL DEFAULT 'expense';

ALTER TABLE transactions
ADD CONSTRAINT valid_category_type 
FOREIGN KEY (category_id) REFERENCES categories(id)
ON DELETE RESTRICT;
