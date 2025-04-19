-- Create the look_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS look_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    look_id UUID NOT NULL REFERENCES looks(look_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, look_id)
);

-- Enable RLS for the look_ratings table
ALTER TABLE look_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view all ratings
CREATE POLICY "Anyone can view ratings" 
ON look_ratings FOR SELECT 
USING (true);

-- Create policy: Users can only rate once per look
CREATE POLICY "Users can only create/update their own ratings" 
ON look_ratings FOR ALL
USING (auth.uid() = user_id);

-- Add rating_count and avg_rating columns to looks table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'looks' AND column_name = 'rating_count') THEN
        ALTER TABLE looks ADD COLUMN rating_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'looks' AND column_name = 'avg_rating') THEN
        ALTER TABLE looks ADD COLUMN avg_rating NUMERIC(3,2) DEFAULT 0;
    END IF;
END$$;

-- Function to update look rating statistics
CREATE OR REPLACE FUNCTION update_look_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    look_id_val UUID;
    rating_count_val INTEGER;
    avg_rating_val NUMERIC(3,2);
BEGIN
    -- Determine which look_id to update
    IF (TG_OP = 'DELETE') THEN
        look_id_val := OLD.look_id;
    ELSE
        look_id_val := NEW.look_id;
    END IF;
    
    -- Calculate new rating statistics for this look
    SELECT 
        COUNT(*) AS rating_count,
        COALESCE(AVG(rating)::NUMERIC(3,2), 0) AS avg_rating
    INTO rating_count_val, avg_rating_val
    FROM look_ratings
    WHERE look_id = look_id_val;
    
    -- Update the looks table with new statistics
    UPDATE looks
    SET 
        rating_count = rating_count_val,
        avg_rating = avg_rating_val
    WHERE look_id = look_id_val;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update look statistics when ratings change
DROP TRIGGER IF EXISTS update_look_rating_stats_trigger ON look_ratings;
CREATE TRIGGER update_look_rating_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON look_ratings
FOR EACH ROW
EXECUTE FUNCTION update_look_rating_stats();

-- Function to update the top_rated_look flag in the looks table
CREATE OR REPLACE FUNCTION update_top_rated_flags()
RETURNS VOID AS $$
BEGIN
    -- Reset all flags first
    UPDATE looks
    SET feature_in = array_remove(feature_in, 'top_rated');
    
    -- Add top_rated flag to the top 50 rated looks (with minimum 5 ratings)
    WITH top_rated AS (
        SELECT look_id
        FROM looks
        WHERE rating_count >= 5
        ORDER BY avg_rating DESC, rating_count DESC
        LIMIT 50
    )
    UPDATE looks
    SET feature_in = array_append(feature_in, 'top_rated')
    FROM top_rated
    WHERE looks.look_id = top_rated.look_id;
END;
$$ LANGUAGE plpgsql;

-- Create function that runs periodically to update top rated flags
CREATE OR REPLACE FUNCTION trigger_update_top_rated_flags()
RETURNS TRIGGER AS $$
BEGIN
    -- Run update function when threshold of changes is reached
    IF (TG_OP = 'UPDATE' AND (NEW.rating_count >= 5 OR OLD.rating_count >= 5)) THEN
        PERFORM update_top_rated_flags();
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update top rated flags when significant rating changes occur
DROP TRIGGER IF EXISTS update_top_rated_trigger ON looks;
CREATE TRIGGER update_top_rated_trigger
AFTER UPDATE OF rating_count, avg_rating ON looks
FOR EACH ROW
WHEN (NEW.rating_count <> OLD.rating_count OR NEW.avg_rating <> OLD.avg_rating)
EXECUTE FUNCTION trigger_update_top_rated_flags();

-- Run initial update to set correct flags
SELECT update_top_rated_flags(); 