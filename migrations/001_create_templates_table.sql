-- Template Table Migration for kds_qwikplan
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Template metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  platform VARCHAR(50) NOT NULL,
  niche VARCHAR(255) NOT NULL,
  
  -- Saved plan data
  strategy TEXT,
  pro_tip TEXT,
  best_post_time VARCHAR(100),
  schedule JSONB,
  hashtags TEXT,
  
  -- Form inputs for quick-loading
  audience VARCHAR(255),
  goal VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- Indexes for better performance
CREATE INDEX idx_templates_user_platform ON templates(user_id, platform);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own templates
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own templates
CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own templates
CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to explain the table
COMMENT ON TABLE templates IS 'Stores reusable marketing plan templates created by users';
COMMENT ON COLUMN templates.name IS 'User-defined name for the template (unique per user)';
COMMENT ON COLUMN templates.description IS 'Optional description/note about the template';
COMMENT ON COLUMN templates.schedule IS 'JSON array of day-by-day tasks from the marketing plan';