-- Create the expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  project TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  billing TEXT NOT NULL CHECK (billing IN ('monthly', 'yearly')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on project for faster filtering
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project);

-- Create an index on category for faster filtering  
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
