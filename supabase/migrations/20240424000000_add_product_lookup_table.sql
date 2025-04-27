-- Create product_lookup table for barcode scanning
CREATE TABLE IF NOT EXISTS product_lookup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT NOT NULL UNIQUE,
  product_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  lookup_count INTEGER DEFAULT 1 NOT NULL
);

-- Add barcode field to wardrobe_items table
ALTER TABLE wardrobe_items
ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS product_lookup_barcode_idx ON product_lookup (barcode);

-- Enable RLS for product_lookup table
ALTER TABLE product_lookup ENABLE ROW LEVEL SECURITY;

-- Define RLS policies for product_lookup table
CREATE POLICY "Product lookups are viewable by everyone" ON product_lookup
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own product lookups" ON product_lookup
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product lookups" ON product_lookup
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on product_lookup
CREATE TRIGGER update_product_lookup_updated_at
BEFORE UPDATE ON product_lookup
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column(); 