-- Create a wardrobes table to track wardrobe statistics by user
CREATE TABLE IF NOT EXISTS wardrobes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_count INTEGER NOT NULL DEFAULT 0,
    top_count INTEGER NOT NULL DEFAULT 0,
    bottom_count INTEGER NOT NULL DEFAULT 0,
    shoes_count INTEGER NOT NULL DEFAULT 0,
    dress_count INTEGER NOT NULL DEFAULT 0,
    accessories_count INTEGER NOT NULL DEFAULT 0,
    outerwear_count INTEGER NOT NULL DEFAULT 0,
    bags_count INTEGER NOT NULL DEFAULT 0,
    other_count INTEGER NOT NULL DEFAULT 0,
    ranking_score INTEGER NOT NULL DEFAULT 0,
    ranking_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Enable RLS for the wardrobes table
ALTER TABLE wardrobes ENABLE ROW LEVEL SECURITY;

-- Anyone can view wardrobes (they're public)
CREATE POLICY "Anyone can view wardrobes" 
ON wardrobes FOR SELECT 
USING (true);

-- Only the owner can update their wardrobe
CREATE POLICY "Users can update their own wardrobe stats" 
ON wardrobes FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to sync wardrobe counts from the wardrobe items table
CREATE OR REPLACE FUNCTION sync_wardrobe_counts()
RETURNS TRIGGER AS $$
DECLARE
    uid UUID;
    total_count INTEGER;
    top_count INTEGER;
    bottom_count INTEGER;
    shoes_count INTEGER;
    dress_count INTEGER;
    accessories_count INTEGER;
    outerwear_count INTEGER;
    bags_count INTEGER;
    other_count INTEGER;
    score INTEGER;
BEGIN
    -- Different logic based on INSERT, UPDATE, or DELETE
    IF TG_OP = 'INSERT' THEN
        uid := NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        uid := OLD.user_id;
    ELSE
        uid := NEW.user_id;
    END IF;
    
    -- Count items by category
    SELECT COUNT(*) INTO total_count FROM wardrobe WHERE user_id = uid;
    SELECT COUNT(*) INTO top_count FROM wardrobe WHERE user_id = uid AND category = 'top';
    SELECT COUNT(*) INTO bottom_count FROM wardrobe WHERE user_id = uid AND category = 'bottom';
    SELECT COUNT(*) INTO shoes_count FROM wardrobe WHERE user_id = uid AND category = 'shoes';
    SELECT COUNT(*) INTO dress_count FROM wardrobe WHERE user_id = uid AND category = 'dress';
    SELECT COUNT(*) INTO accessories_count FROM wardrobe WHERE user_id = uid AND category = 'accessories';
    SELECT COUNT(*) INTO outerwear_count FROM wardrobe WHERE user_id = uid AND category = 'outerwear';
    SELECT COUNT(*) INTO bags_count FROM wardrobe WHERE user_id = uid AND category = 'bags';
    SELECT COUNT(*) INTO other_count FROM wardrobe 
        WHERE user_id = uid AND category NOT IN ('top', 'bottom', 'shoes', 'dress', 'accessories', 'outerwear', 'bags');
    
    -- Calculate ranking score
    -- Formula: total items * 10 + categories variety score (bonus for having items in multiple categories)
    score := total_count * 10;
    score := score + CASE WHEN top_count > 0 THEN 5 ELSE 0 END;
    score := score + CASE WHEN bottom_count > 0 THEN 5 ELSE 0 END;
    score := score + CASE WHEN shoes_count > 0 THEN 5 ELSE 0 END;
    score := score + CASE WHEN dress_count > 0 THEN 5 ELSE 0 END;
    score := score + CASE WHEN accessories_count > 0 THEN 5 ELSE 0 END;
    score := score + CASE WHEN outerwear_count > 0 THEN 5 ELSE 0 END;
    score := score + CASE WHEN bags_count > 0 THEN 5 ELSE 0 END;
    score := score + CASE WHEN other_count > 0 THEN 5 ELSE 0 END;
    
    -- Insert or update the wardrobes table
    INSERT INTO wardrobes (
        user_id, 
        item_count, 
        top_count, 
        bottom_count, 
        shoes_count, 
        dress_count, 
        accessories_count, 
        outerwear_count, 
        bags_count, 
        other_count, 
        ranking_score,
        updated_at
    ) VALUES (
        uid, 
        total_count, 
        top_count, 
        bottom_count, 
        shoes_count, 
        dress_count, 
        accessories_count, 
        outerwear_count, 
        bags_count, 
        other_count, 
        score,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        item_count = EXCLUDED.item_count,
        top_count = EXCLUDED.top_count,
        bottom_count = EXCLUDED.bottom_count,
        shoes_count = EXCLUDED.shoes_count,
        dress_count = EXCLUDED.dress_count,
        accessories_count = EXCLUDED.accessories_count,
        outerwear_count = EXCLUDED.outerwear_count,
        bags_count = EXCLUDED.bags_count,
        other_count = EXCLUDED.other_count,
        ranking_score = EXCLUDED.ranking_score,
        updated_at = EXCLUDED.updated_at;
        
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on wardrobe items table to update wardrobe counts
DROP TRIGGER IF EXISTS update_wardrobe_counts ON wardrobe;
CREATE TRIGGER update_wardrobe_counts
AFTER INSERT OR UPDATE OR DELETE ON wardrobe
FOR EACH ROW
EXECUTE FUNCTION sync_wardrobe_counts();

-- Function to update wardrobe rankings (to be run periodically or on-demand)
CREATE OR REPLACE FUNCTION update_wardrobe_rankings()
RETURNS VOID AS $$
BEGIN
    -- Update ranking positions based on ranking_score
    UPDATE wardrobes w
    SET ranking_position = rankings.position
    FROM (
        SELECT 
            id, 
            ROW_NUMBER() OVER (ORDER BY ranking_score DESC) as position
        FROM wardrobes
    ) as rankings
    WHERE w.id = rankings.id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically run ranking updates when scores change
CREATE OR REPLACE FUNCTION trigger_update_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Run rankings update function
    PERFORM update_wardrobe_rankings();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_rankings ON wardrobes;
CREATE TRIGGER auto_update_rankings
AFTER INSERT OR UPDATE OF ranking_score ON wardrobes
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_update_rankings();

-- Initialize the rankings
SELECT update_wardrobe_rankings(); 