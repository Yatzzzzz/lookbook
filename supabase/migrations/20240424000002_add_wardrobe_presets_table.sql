-- Create wardrobe_presets table for predefined wardrobe items
CREATE TABLE IF NOT EXISTS wardrobe_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  color TEXT,
  image_url TEXT,
  material TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  preset_type TEXT NOT NULL,
  metadata JSONB
);

-- Insert some basic preset items
INSERT INTO wardrobe_presets (name, category, description, color, image_url, material, preset_type) VALUES
  ('White T-shirt', 'top', 'Classic white crew neck t-shirt', 'white', 'https://via.placeholder.com/150?text=WhiteTee', 'cotton', 'basic'),
  ('Black T-shirt', 'top', 'Classic black crew neck t-shirt', 'black', 'https://via.placeholder.com/150?text=BlackTee', 'cotton', 'basic'),
  ('Blue Jeans', 'bottom', 'Classic blue denim jeans', 'blue', 'https://via.placeholder.com/150?text=BlueJeans', 'denim', 'basic'),
  ('Black Dress Shoes', 'shoes', 'Classic black leather dress shoes', 'black', 'https://via.placeholder.com/150?text=DressShoes', 'leather', 'basic'),
  ('White Sneakers', 'shoes', 'Classic white sneakers', 'white', 'https://via.placeholder.com/150?text=WhiteSneakers', 'leather, rubber', 'basic')
ON CONFLICT DO NOTHING;

-- Create tracking table for preset usage
CREATE TABLE IF NOT EXISTS wardrobe_preset_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preset_id UUID REFERENCES wardrobe_presets(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  wardrobe_item_id UUID REFERENCES wardrobe_items(id)
);

-- Enable RLS for wardrobe_preset_usage table
ALTER TABLE wardrobe_preset_usage ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for preset usage
CREATE POLICY "Users can view their own preset usage" ON wardrobe_preset_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preset usage" ON wardrobe_preset_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id); 