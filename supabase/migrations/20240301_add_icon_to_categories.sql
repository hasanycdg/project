-- Add icon column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- Update RLS policies to include the new column
ALTER POLICY "Users can insert their own categories" ON categories
  USING (auth.uid() = user_id);

ALTER POLICY "Users can update their own categories" ON categories
  USING (auth.uid() = user_id);

ALTER POLICY "Users can delete their own categories" ON categories
  USING (auth.uid() = user_id);

ALTER POLICY "Users can select their own categories" ON categories
  USING (auth.uid() = user_id);
