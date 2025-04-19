-- Create a function to get rating statistics
CREATE OR REPLACE FUNCTION get_rating_stats()
RETURNS TABLE (
  total_looks BIGINT,
  rated_looks BIGINT,
  avg_ratings_per_look NUMERIC,
  max_ratings_on_look BIGINT,
  top_rated_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_looks,
    COUNT(*) FILTER (WHERE rating_count > 0)::BIGINT AS rated_looks,
    COALESCE(ROUND(AVG(rating_count) FILTER (WHERE rating_count > 0))::NUMERIC, 0) AS avg_ratings_per_look,
    COALESCE(MAX(rating_count)::BIGINT, 0) AS max_ratings_on_look,
    COUNT(*) FILTER (WHERE feature_in @> ARRAY['top_rated'])::BIGINT AS top_rated_count
  FROM looks;
END;
$$;

-- Grant access to function for authenticated users
GRANT EXECUTE ON FUNCTION get_rating_stats() TO authenticated;

-- Protect function with row level security
ALTER FUNCTION get_rating_stats() SET SEARCH_PATH = public; 