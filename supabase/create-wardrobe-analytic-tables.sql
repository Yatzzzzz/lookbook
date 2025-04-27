-- Script for Phase 3: Wardrobe Analytics & Insights
-- This script creates the necessary tables and functions for detailed wardrobe analytics

-- Enable uuid-ossp for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table for detailed wear logs (extends the existing outfit_wear_logs)
CREATE TABLE IF NOT EXISTS wardrobe_wear_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES wardrobe(item_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  worn_date DATE DEFAULT CURRENT_DATE,
  weather_conditions TEXT,
  temperature NUMERIC,
  occasion TEXT,
  outfit_id UUID REFERENCES outfits(outfit_id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE wardrobe_wear_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wardrobe_wear_logs
CREATE POLICY "Users can view their own wear logs" 
ON wardrobe_wear_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wear logs" 
ON wardrobe_wear_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wear logs" 
ON wardrobe_wear_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wear logs" 
ON wardrobe_wear_logs FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for seasonal efficiency tracking
CREATE TABLE IF NOT EXISTS wardrobe_season_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  year INT NOT NULL,
  total_items INT DEFAULT 0,
  active_items INT DEFAULT 0, -- Items worn at least once in season
  wear_count INT DEFAULT 0,
  utilization_percentage NUMERIC DEFAULT 0, -- active_items / total_items
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, season, year)
);

-- Enable Row Level Security
ALTER TABLE wardrobe_season_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wardrobe_season_metrics
CREATE POLICY "Users can view their own season metrics" 
ON wardrobe_season_metrics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Application can manage season metrics" 
ON wardrobe_season_metrics FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to update wardrobe item wear count and last_worn
CREATE OR REPLACE FUNCTION log_wardrobe_wear()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the wardrobe item's wear count and last_worn date
  UPDATE wardrobe
  SET 
    wear_count = COALESCE(wear_count, 0) + 1,
    last_worn = NEW.worn_date
  WHERE item_id = NEW.item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update wardrobe item when wear log is added
CREATE TRIGGER wardrobe_wear_log_trigger
AFTER INSERT ON wardrobe_wear_logs
FOR EACH ROW
EXECUTE FUNCTION log_wardrobe_wear();

-- Create function to calculate seasonal metrics
CREATE OR REPLACE FUNCTION calculate_season_metrics(user_uuid UUID, target_season TEXT, target_year INT)
RETURNS VOID AS $$
DECLARE
  season_start DATE;
  season_end DATE;
  total_items_count INT;
  active_items_count INT;
  total_wears INT;
BEGIN
  -- Determine season date range
  CASE target_season
    WHEN 'winter' THEN 
      season_start := make_date(target_year, 12, 21);
      season_end := make_date(target_year + 1, 3, 20);
    WHEN 'spring' THEN 
      season_start := make_date(target_year, 3, 21);
      season_end := make_date(target_year, 6, 20);
    WHEN 'summer' THEN 
      season_start := make_date(target_year, 6, 21);
      season_end := make_date(target_year, 9, 22);
    WHEN 'fall' THEN 
      season_start := make_date(target_year, 9, 23);
      season_end := make_date(target_year, 12, 20);
    ELSE
      RAISE EXCEPTION 'Invalid season: %', target_season;
  END CASE;

  -- Count all items where the season matches
  SELECT COUNT(*) INTO total_items_count
  FROM wardrobe w
  WHERE 
    w.user_id = user_uuid AND 
    target_season = ANY(w.season);

  -- Count all items worn at least once in this season
  SELECT COUNT(DISTINCT w.item_id) INTO active_items_count
  FROM wardrobe w
  JOIN wardrobe_wear_logs l ON w.item_id = l.item_id
  WHERE 
    w.user_id = user_uuid AND
    target_season = ANY(w.season) AND
    l.worn_date BETWEEN season_start AND season_end;

  -- Count total wears in this season
  SELECT COUNT(*) INTO total_wears
  FROM wardrobe_wear_logs l
  JOIN wardrobe w ON l.item_id = w.item_id
  WHERE 
    w.user_id = user_uuid AND
    target_season = ANY(w.season) AND
    l.worn_date BETWEEN season_start AND season_end;

  -- Insert or update the metrics
  INSERT INTO wardrobe_season_metrics (
    user_id, season, year, total_items, active_items, 
    wear_count, utilization_percentage, updated_at
  )
  VALUES (
    user_uuid, target_season, target_year, total_items_count, active_items_count,
    total_wears, 
    CASE WHEN total_items_count > 0 THEN (active_items_count * 100.0 / total_items_count) ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, season, year) 
  DO UPDATE SET
    total_items = EXCLUDED.total_items,
    active_items = EXCLUDED.active_items,
    wear_count = EXCLUDED.wear_count,
    utilization_percentage = EXCLUDED.utilization_percentage,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Create a view for item utilization metrics
CREATE OR REPLACE VIEW wardrobe_item_metrics AS
SELECT
  w.item_id,
  w.user_id,
  w.name,
  w.category,
  w.purchase_price,
  COALESCE(w.wear_count, 0) as wear_count,
  w.last_worn,
  w.purchase_date,
  CASE 
    WHEN w.purchase_price IS NOT NULL AND COALESCE(w.wear_count, 0) > 0 
    THEN w.purchase_price / w.wear_count
    ELSE w.purchase_price
  END as cost_per_wear,
  CASE
    WHEN w.purchase_date IS NOT NULL AND w.last_worn IS NOT NULL
    THEN (w.last_worn - w.purchase_date)
    ELSE NULL
  END as days_owned,
  CASE
    WHEN w.purchase_date IS NOT NULL AND COALESCE(w.wear_count, 0) > 0
    THEN (CURRENT_DATE - w.purchase_date) / GREATEST(w.wear_count, 1)
    ELSE NULL
  END as days_per_wear
FROM wardrobe w;

-- Set permissions on the view
GRANT SELECT ON wardrobe_item_metrics TO authenticated;

-- Create a view for category metrics
CREATE OR REPLACE VIEW wardrobe_category_metrics AS
SELECT
  w.user_id,
  w.category,
  COUNT(*) as total_items,
  SUM(COALESCE(w.purchase_price, 0)) as total_investment,
  SUM(COALESCE(w.wear_count, 0)) as total_wears,
  CASE 
    WHEN SUM(COALESCE(w.wear_count, 0)) > 0 
    THEN SUM(COALESCE(w.purchase_price, 0)) / SUM(COALESCE(w.wear_count, 0))
    ELSE NULL
  END as category_cost_per_wear,
  COUNT(*) FILTER (WHERE w.wear_count > 0) as active_items,
  ROUND((COUNT(*) FILTER (WHERE w.wear_count > 0) * 100.0 / NULLIF(COUNT(*), 0)), 1) as utilization_percentage
FROM wardrobe w
GROUP BY w.user_id, w.category;

-- Set permissions on the view
GRANT SELECT ON wardrobe_category_metrics TO authenticated;

-- Create a function to calculate wardrobe health score
CREATE OR REPLACE FUNCTION calculate_wardrobe_health_score(user_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_items INT;
  active_items INT;
  coverage_score NUMERIC;
  utilization_score NUMERIC;
  balanced_score NUMERIC;
  health_score NUMERIC;
  category_count INT;
  expected_categories INT := 5; -- Expected minimum number of categories
  category_balance NUMERIC;
BEGIN
  -- Get total and active items
  SELECT COUNT(*), COUNT(*) FILTER (WHERE wear_count > 0)
  INTO total_items, active_items
  FROM wardrobe
  WHERE user_id = user_uuid;
  
  -- Calculate utilization score (percentage of items worn at least once)
  utilization_score := CASE 
    WHEN total_items > 0 THEN (active_items * 100.0 / total_items)
    ELSE 0
  END;
  
  -- Calculate category coverage
  SELECT COUNT(DISTINCT category) INTO category_count
  FROM wardrobe
  WHERE user_id = user_uuid;
  
  coverage_score := LEAST(category_count * 100.0 / expected_categories, 100);
  
  -- Calculate category balance
  WITH category_distribution AS (
    SELECT 
      category,
      COUNT(*) as count,
      COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0) as percentage
    FROM wardrobe
    WHERE user_id = user_uuid
    GROUP BY category
  )
  SELECT 100 - COALESCE(STDDEV(percentage), 0)
  INTO category_balance
  FROM category_distribution;
  
  -- Calculate overall health score (weighted average)
  health_score := (utilization_score * 0.5) + (coverage_score * 0.3) + (category_balance * 0.2);
  
  RETURN ROUND(health_score, 1);
END;
$$ LANGUAGE plpgsql;

-- Add column to track wardrobe_health_score in users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wardrobe_health_score NUMERIC DEFAULT 0;

-- Create triggers to recalculate metrics when wardrobe is modified
CREATE OR REPLACE FUNCTION update_wardrobe_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Perform any operations asynchronously in a future implementation
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wardrobe_after_change
AFTER INSERT OR UPDATE OR DELETE ON wardrobe
FOR EACH STATEMENT
EXECUTE FUNCTION update_wardrobe_metrics(); 