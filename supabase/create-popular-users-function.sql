-- Function to get popular users based on follower count
CREATE OR REPLACE FUNCTION get_popular_users(limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  followers_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    COUNT(wf.id) as followers_count
  FROM profiles p
  LEFT JOIN wardrobe_follows wf ON p.id = wf.followed_id
  GROUP BY p.id, p.username, p.avatar_url
  ORDER BY followers_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql; 