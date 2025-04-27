-- Add AI confidence score and tags to wardrobe_items table
ALTER TABLE wardrobe_items
ADD COLUMN IF NOT EXISTS ai_confidence_score FLOAT,
ADD COLUMN IF NOT EXISTS ai_tags JSONB;

-- Create table for logging AI analysis
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  mode TEXT NOT NULL,
  analysis_result TEXT NOT NULL,
  has_reference_item BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  feedback TEXT,
  accuracy_rating SMALLINT CHECK (accuracy_rating BETWEEN 1 AND 5)
);

-- Enable RLS for AI analysis logs
ALTER TABLE ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for AI analysis logs
CREATE POLICY "Users can view their own AI analysis logs" ON ai_analysis_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI analysis logs" ON ai_analysis_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI analysis logs" ON ai_analysis_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS ai_analysis_logs_user_id_idx ON ai_analysis_logs (user_id);
CREATE INDEX IF NOT EXISTS ai_analysis_logs_mode_idx ON ai_analysis_logs (mode);

-- Update existing stored function for AI tag processing (if needed)
CREATE OR REPLACE FUNCTION process_ai_tags()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract key information from AI tags to specific columns if available
  IF NEW.ai_tags IS NOT NULL THEN
    -- Extract category if not already set
    IF (NEW.category IS NULL OR NEW.category = 'other') AND NEW.ai_tags->>'category' IS NOT NULL THEN
      NEW.category = NEW.ai_tags->>'category';
    END IF;
    
    -- Extract color if not already set
    IF (NEW.color IS NULL) AND NEW.ai_tags->>'color' IS NOT NULL THEN
      NEW.color = NEW.ai_tags->>'color';
    END IF;
    
    -- Extract brand if not already set
    IF (NEW.brand IS NULL) AND NEW.ai_tags->>'brand' IS NOT NULL THEN
      NEW.brand = NEW.ai_tags->>'brand';
    END IF;

    -- Set creation timestamp
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for AI tag processing
DROP TRIGGER IF EXISTS process_ai_tags_trigger ON wardrobe_items;
CREATE TRIGGER process_ai_tags_trigger
BEFORE UPDATE ON wardrobe_items
FOR EACH ROW
WHEN (NEW.ai_tags IS DISTINCT FROM OLD.ai_tags)
EXECUTE FUNCTION process_ai_tags(); 