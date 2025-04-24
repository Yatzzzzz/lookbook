-- Create the opinions table for storing user opinions on fashion looks
CREATE TABLE IF NOT EXISTS opinions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  look_id UUID REFERENCES looks(look_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  comment TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS) policies
ALTER TABLE opinions ENABLE ROW LEVEL SECURITY;

-- Anyone can view opinions
CREATE POLICY "Anyone can view opinions"
  ON opinions FOR SELECT
  USING (true);

-- Users can insert their own opinions
CREATE POLICY "Users can insert their own opinions"
  ON opinions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own opinions
CREATE POLICY "Users can update their own opinions"
  ON opinions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own opinions
CREATE POLICY "Users can delete their own opinions"
  ON opinions FOR DELETE
  USING (auth.uid() = user_id); 