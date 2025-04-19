-- Backfill script to populate the wardrobes table with existing wardrobe data
-- This helps ensure all existing users will immediately have rankings

-- First, ensure the required functions exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_wardrobe_counts') THEN
    RAISE EXCEPTION 'sync_wardrobe_counts function does not exist. Run the wardrobes-ranking-tables.sql script first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_wardrobe_rankings') THEN
    RAISE EXCEPTION 'update_wardrobe_rankings function does not exist. Run the wardrobes-ranking-tables.sql script first.';
  END IF;
END $$;

-- Get distinct user_ids from the wardrobe table
WITH distinct_users AS (
  SELECT DISTINCT user_id
  FROM wardrobe
)

-- Insert one record per user into the wardrobes table if it doesn't exist
INSERT INTO wardrobes (user_id)
SELECT user_id FROM distinct_users
ON CONFLICT (user_id) DO NOTHING;

-- For each user, update their wardrobe counts
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN (SELECT DISTINCT user_id FROM wardrobe) LOOP
    -- Calculate item counts for each category for this user
    WITH counts AS (
      SELECT 
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE category = 'top') AS top_count,
        COUNT(*) FILTER (WHERE category = 'bottom') AS bottom_count,
        COUNT(*) FILTER (WHERE category = 'shoes') AS shoes_count,
        COUNT(*) FILTER (WHERE category = 'dress') AS dress_count,
        COUNT(*) FILTER (WHERE category = 'accessories') AS accessories_count,
        COUNT(*) FILTER (WHERE category = 'outerwear') AS outerwear_count,
        COUNT(*) FILTER (WHERE category = 'bags') AS bags_count,
        COUNT(*) FILTER (WHERE category NOT IN ('top', 'bottom', 'shoes', 'dress', 'accessories', 'outerwear', 'bags')) AS other_count
      FROM wardrobe
      WHERE user_id = user_record.user_id
    ),
    -- Calculate ranking score using the same formula as in the trigger
    scores AS (
      SELECT 
        total_count * 10 +
        CASE WHEN top_count > 0 THEN 5 ELSE 0 END +
        CASE WHEN bottom_count > 0 THEN 5 ELSE 0 END +
        CASE WHEN shoes_count > 0 THEN 5 ELSE 0 END +
        CASE WHEN dress_count > 0 THEN 5 ELSE 0 END +
        CASE WHEN accessories_count > 0 THEN 5 ELSE 0 END +
        CASE WHEN outerwear_count > 0 THEN 5 ELSE 0 END +
        CASE WHEN bags_count > 0 THEN 5 ELSE 0 END +
        CASE WHEN other_count > 0 THEN 5 ELSE 0 END AS ranking_score
      FROM counts
    )
    
    -- Update the wardrobes table for this user
    UPDATE wardrobes
    SET 
      item_count = counts.total_count,
      top_count = counts.top_count,
      bottom_count = counts.bottom_count,
      shoes_count = counts.shoes_count,
      dress_count = counts.dress_count,
      accessories_count = counts.accessories_count,
      outerwear_count = counts.outerwear_count,
      bags_count = counts.bags_count,
      other_count = counts.other_count,
      ranking_score = scores.ranking_score,
      updated_at = NOW()
    FROM counts, scores
    WHERE wardrobes.user_id = user_record.user_id;
    
    RAISE NOTICE 'Updated wardrobe counts for user %', user_record.user_id;
  END LOOP;
END $$;

-- Finally, update all the ranking positions
SELECT update_wardrobe_rankings();

-- Output some stats about the ranking
SELECT 
  COUNT(*) AS total_wardrobes,
  COUNT(*) FILTER (WHERE ranking_position IS NOT NULL) AS ranked_wardrobes,
  MIN(ranking_score) AS min_score,
  MAX(ranking_score) AS max_score,
  AVG(ranking_score)::numeric(10,2) AS avg_score
FROM wardrobes; 