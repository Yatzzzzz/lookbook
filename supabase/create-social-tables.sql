-- Create tables for social features (activity feed, comments, notifications)

-- Activity Feed table to track user activities
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'add_item', 'add_outfit', 'follow_user', 'comment', etc.
  item_type TEXT NOT NULL, -- 'wardrobe_item', 'outfit', 'user', 'comment', etc.
  item_id UUID NOT NULL, -- The ID of the related item
  metadata JSONB, -- Additional data like item name, image, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT TRUE
);

-- Comment table for wardrobe items and outfits
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'wardrobe_item' or 'outfit'
  item_id UUID NOT NULL, -- The ID of the wardrobe item or outfit
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification table to store user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'follow', 'comment', 'like', etc.
  item_type TEXT, -- 'wardrobe_item', 'outfit', 'comment', etc.
  item_id UUID, -- The related item ID
  content TEXT, -- Notification text
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS activity_feed_user_id_idx ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS activity_feed_created_at_idx ON activity_feed(created_at);
CREATE INDEX IF NOT EXISTS comments_item_id_idx ON comments(item_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_feed
CREATE POLICY "Users can view public activity feed entries"
ON activity_feed FOR SELECT
USING (is_public = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can create their own activity feed entries"
ON activity_feed FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity feed entries"
ON activity_feed FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity feed entries"
ON activity_feed FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Users can view all comments"
ON comments FOR SELECT
USING (TRUE);

CREATE POLICY "Users can create their own comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create notifications"
ON notifications FOR INSERT
WITH CHECK (TRUE);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id); 