-- Create the instruments table
CREATE TABLE IF NOT EXISTS instruments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL
);

-- Insert some sample data into the table
INSERT INTO instruments (name)
VALUES
  ('violin'),
  ('viola'),
  ('cello');

-- Enable Row Level Security
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access
CREATE POLICY "public can read instruments"
  ON instruments
  FOR SELECT TO anon
  USING (true); 