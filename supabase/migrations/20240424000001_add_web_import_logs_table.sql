-- Create web_import_logs table for tracking web imports
CREATE TABLE IF NOT EXISTS web_import_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  extracted_metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  retailer TEXT,
  success BOOLEAN DEFAULT true
);

-- Enable RLS for web_import_logs table
ALTER TABLE web_import_logs ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for web_import_logs table
CREATE POLICY "Users can view their own import logs" ON web_import_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import logs" ON web_import_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add URL field to wardrobe_items table
ALTER TABLE wardrobe_items
ADD COLUMN IF NOT EXISTS url TEXT; 