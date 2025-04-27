-- Create outfit tables and RLS policies
-- This script creates the necessary tables for the outfit functionality
-- Execute this in the Supabase SQL Editor

-- Check if UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create outfits table
CREATE TABLE IF NOT EXISTS outfits (
  outfit_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_worn DATE,
  wear_count INTEGER DEFAULT 0,
  visibility VARCHAR(20) DEFAULT 'private',
  season TEXT[],
  occasion TEXT[],
  weather_conditions TEXT[],
  featured BOOLEAN DEFAULT false
);

-- Create outfit_items junction table
CREATE TABLE IF NOT EXISTS outfit_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  outfit_id UUID REFERENCES outfits(outfit_id) ON DELETE CASCADE,
  item_id UUID REFERENCES wardrobe(item_id) ON DELETE CASCADE,
  layer_order INTEGER DEFAULT 0, -- For layering visualization
  position_x INTEGER,
  position_y INTEGER,
  z_index INTEGER DEFAULT 0,
  scale DECIMAL(10,2) DEFAULT 1.0,
  rotation INTEGER DEFAULT 0,
  position_data JSONB, -- Additional positioning data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(outfit_id, item_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_item_id ON outfit_items(item_id);

-- Enable Row Level Security
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for outfits table

-- Users can view their own outfits
CREATE POLICY "Users can view their own outfits"
ON outfits FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public outfits
CREATE POLICY "Users can view public outfits"
ON outfits FOR SELECT
USING (visibility = 'public');

-- Users can insert their own outfits
CREATE POLICY "Users can insert their own outfits"
ON outfits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own outfits
CREATE POLICY "Users can update their own outfits"
ON outfits FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own outfits
CREATE POLICY "Users can delete their own outfits"
ON outfits FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for outfit_items table

-- Users can view items from outfits they can view
CREATE POLICY "Users can view outfit items they have access to"
ON outfit_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM outfits o
    WHERE o.outfit_id = outfit_items.outfit_id
    AND (
      o.user_id = auth.uid()
      OR o.visibility = 'public'
    )
  )
);

-- Users can insert items to their own outfits
CREATE POLICY "Users can insert items to their own outfits"
ON outfit_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM outfits o
    WHERE o.outfit_id = outfit_items.outfit_id
    AND o.user_id = auth.uid()
  )
);

-- Users can update items in their own outfits
CREATE POLICY "Users can update items in their own outfits"
ON outfit_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM outfits o
    WHERE o.outfit_id = outfit_items.outfit_id
    AND o.user_id = auth.uid()
  )
);

-- Users can delete items from their own outfits
CREATE POLICY "Users can delete items from their own outfits"
ON outfit_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM outfits o
    WHERE o.outfit_id = outfit_items.outfit_id
    AND o.user_id = auth.uid()
  )
);

-- Create function to update outfit updated_at timestamp
CREATE OR REPLACE FUNCTION update_outfit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamp
CREATE TRIGGER update_outfit_timestamp
BEFORE UPDATE ON outfits
FOR EACH ROW
EXECUTE FUNCTION update_outfit_timestamp();

-- Create function to increment outfit wear count
CREATE OR REPLACE FUNCTION log_outfit_wear()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE outfits
  SET 
    wear_count = wear_count + 1,
    last_worn = CURRENT_DATE
  WHERE outfit_id = NEW.outfit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create outfit wear logs table
CREATE TABLE IF NOT EXISTS outfit_wear_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  outfit_id UUID REFERENCES outfits(outfit_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  worn_date DATE DEFAULT CURRENT_DATE,
  occasion TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on wear logs
ALTER TABLE outfit_wear_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for outfit wear logs
CREATE POLICY "Users can view their own outfit wear logs"
ON outfit_wear_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outfit wear logs"
ON outfit_wear_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfit wear logs"
ON outfit_wear_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfit wear logs"
ON outfit_wear_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger to update outfit wear count when log is added
CREATE TRIGGER outfit_wear_log_trigger
AFTER INSERT ON outfit_wear_logs
FOR EACH ROW
EXECUTE FUNCTION log_outfit_wear();

-- Create function to check if a user has access to an outfit
CREATE OR REPLACE FUNCTION user_has_outfit_access(outfit_id UUID, checking_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM outfits o
    WHERE o.outfit_id = $1
    AND (
      o.user_id = $2
      OR o.visibility = 'public'
    )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql; 