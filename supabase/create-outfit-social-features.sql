-- Script for Phase 4: Social Sharing & Community Features
-- This script enhances the outfit tables with social sharing capabilities

-- Add likes functionality to outfits table
CREATE TABLE IF NOT EXISTS outfit_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  outfit_id UUID REFERENCES outfits(outfit_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(outfit_id, user_id)
);

-- Enable RLS on outfit likes
ALTER TABLE outfit_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for outfit likes
CREATE POLICY "Anyone can view outfit likes"
ON outfit_likes FOR SELECT
USING (TRUE);

CREATE POLICY "Users can like outfits"
ON outfit_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike outfits"
ON outfit_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create a function to count outfit likes
CREATE OR REPLACE FUNCTION get_outfit_likes(outfit_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  like_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO like_count
  FROM outfit_likes
  WHERE outfit_id = outfit_uuid;
  
  RETURN like_count;
END;
$$ LANGUAGE plpgsql;

-- Add outfit views tracking
CREATE TABLE IF NOT EXISTS outfit_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  outfit_id UUID REFERENCES outfits(outfit_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT, -- Where the view came from (e.g., 'feed', 'profile', 'search')
  UNIQUE(outfit_id, user_id)
);

-- Enable RLS on outfit views
ALTER TABLE outfit_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for outfit views
CREATE POLICY "Anyone can view outfit view stats"
ON outfit_views FOR SELECT
USING (TRUE);

CREATE POLICY "Anyone can insert outfit views"
ON outfit_views FOR INSERT
WITH CHECK (TRUE);

-- Create a function to count outfit views
CREATE OR REPLACE FUNCTION get_outfit_views(outfit_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM outfit_views
  WHERE outfit_id = outfit_uuid;
  
  RETURN view_count;
END;
$$ LANGUAGE plpgsql;

-- Add 'community' visibility option for outfits
ALTER TABLE outfits DROP CONSTRAINT IF EXISTS outfits_visibility_check;
ALTER TABLE outfits ADD CONSTRAINT outfits_visibility_check 
CHECK (visibility IN ('private', 'public', 'community'));

-- Create a 'trending' score function
CREATE OR REPLACE FUNCTION calculate_outfit_trending_score(outfit_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  like_weight NUMERIC := 5.0;
  view_weight NUMERIC := 1.0;
  comment_weight NUMERIC := 3.0;
  time_decay_factor NUMERIC := 0.8;
  
  outfit_age_hours NUMERIC;
  like_count INTEGER;
  view_count INTEGER;
  comment_count INTEGER;
  
  trending_score NUMERIC;
BEGIN
  -- Get outfit age in hours
  SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600
  INTO outfit_age_hours
  FROM outfits
  WHERE outfit_id = outfit_uuid;
  
  -- Get counts
  SELECT COUNT(*) INTO like_count
  FROM outfit_likes
  WHERE outfit_id = outfit_uuid;
  
  SELECT COUNT(*) INTO view_count
  FROM outfit_views
  WHERE outfit_id = outfit_uuid;
  
  SELECT COUNT(*) INTO comment_count
  FROM comments
  WHERE item_type = 'outfit' AND item_id = outfit_uuid;
  
  -- Calculate score with time decay
  trending_score := (
    (like_count * like_weight) +
    (view_count * view_weight) +
    (comment_count * comment_weight)
  ) * POW(time_decay_factor, outfit_age_hours / 24.0); -- Decay by day
  
  RETURN trending_score;
END;
$$ LANGUAGE plpgsql;

-- Create a view for outfit engagement metrics
CREATE OR REPLACE VIEW outfit_engagement AS
SELECT
  o.outfit_id,
  o.user_id,
  o.name,
  o.image_url,
  o.visibility,
  o.created_at,
  COALESCE(get_outfit_likes(o.outfit_id), 0) AS likes,
  COALESCE(get_outfit_views(o.outfit_id), 0) AS views,
  (SELECT COUNT(*) FROM comments WHERE item_type = 'outfit' AND item_id = o.outfit_id) AS comments,
  calculate_outfit_trending_score(o.outfit_id) AS trending_score
FROM outfits o
WHERE o.visibility IN ('public', 'community');

-- Set permissions on the view
GRANT SELECT ON outfit_engagement TO authenticated;

-- Create helper function for featured outfits
CREATE OR REPLACE FUNCTION get_featured_outfits(limit_count INTEGER DEFAULT 10)
RETURNS SETOF outfit_engagement AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM outfit_engagement
  ORDER BY trending_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update activity feed when outfit is shared
CREATE OR REPLACE FUNCTION update_outfit_share_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create activity for newly public outfits or community outfits
  IF NEW.visibility IN ('public', 'community') AND 
     (OLD.visibility IS NULL OR OLD.visibility = 'private') THEN
    
    INSERT INTO activity_feed (
      user_id,
      action_type,
      item_type,
      item_id,
      metadata,
      is_public
    ) VALUES (
      NEW.user_id,
      'share',
      'outfit',
      NEW.outfit_id,
      json_build_object(
        'outfit_name', NEW.name,
        'outfit_image', NEW.image_url,
        'visibility', NEW.visibility
      ),
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for outfit sharing activity
CREATE TRIGGER outfit_share_activity_trigger
AFTER INSERT OR UPDATE OF visibility ON outfits
FOR EACH ROW
EXECUTE FUNCTION update_outfit_share_activity();

-- Function to notify followers when outfit is shared
CREATE OR REPLACE FUNCTION notify_followers_of_outfit_share()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
BEGIN
  -- Only notify for newly public outfits
  IF NEW.visibility IN ('public', 'community') AND 
     (OLD.visibility IS NULL OR OLD.visibility = 'private') THEN
    
    -- Get all followers of this user
    FOR follower_record IN 
      SELECT follower_id 
      FROM wardrobe_follows 
      WHERE followed_id = NEW.user_id
    LOOP
      -- Create a notification for each follower
      INSERT INTO notifications (
        user_id,
        sender_id,
        notification_type,
        item_type,
        item_id,
        content
      ) VALUES (
        follower_record.follower_id,
        NEW.user_id,
        'outfit_share',
        'outfit',
        NEW.outfit_id,
        'shared a new outfit'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifying followers
CREATE TRIGGER notify_followers_outfit_share_trigger
AFTER INSERT OR UPDATE OF visibility ON outfits
FOR EACH ROW
EXECUTE FUNCTION notify_followers_of_outfit_share(); 