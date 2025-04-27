-- create-social-interaction-tables.sql
-- Script to create and configure tables for social interaction features in Phase 4

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

------------------------------
-- WARDROBE FOLLOWS TABLE
------------------------------
CREATE TABLE IF NOT EXISTS wardrobe_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, followed_id)
);

-- Create indexes for faster follow relationship retrieval
CREATE INDEX IF NOT EXISTS idx_wardrobe_follows_follower_id ON wardrobe_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_follows_followed_id ON wardrobe_follows(followed_id);

-- Add RLS policies for wardrobe_follows
ALTER TABLE wardrobe_follows ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view follow relationships
CREATE POLICY wardrobe_follows_select_policy ON wardrobe_follows
FOR SELECT USING (true);

-- Policy: Users can follow others
CREATE POLICY wardrobe_follows_insert_policy ON wardrobe_follows
FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can unfollow (delete their follow relationship)
CREATE POLICY wardrobe_follows_delete_policy ON wardrobe_follows
FOR DELETE USING (auth.uid() = follower_id);

------------------------------
-- OUTFIT LIKES TABLE
------------------------------
CREATE TABLE IF NOT EXISTS outfit_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outfit_id UUID NOT NULL REFERENCES outfits(outfit_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(outfit_id, user_id)
);

-- Create index for faster like retrieval
CREATE INDEX IF NOT EXISTS idx_outfit_likes_outfit_id ON outfit_likes(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_likes_user_id ON outfit_likes(user_id);

-- Add RLS policies for outfit_likes
ALTER TABLE outfit_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view likes on outfits they have access to
CREATE POLICY outfit_likes_select_policy ON outfit_likes
FOR SELECT USING (
    (SELECT visibility FROM outfits WHERE outfit_id = outfit_likes.outfit_id) IN ('public', 'community')
    OR
    outfit_likes.user_id = auth.uid()
    OR
    (SELECT user_id FROM outfits WHERE outfit_id = outfit_likes.outfit_id) = auth.uid()
);

-- Policy: Users can like outfits they have access to
CREATE POLICY outfit_likes_insert_policy ON outfit_likes
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND
    (
        (SELECT visibility FROM outfits WHERE outfit_id = outfit_id) IN ('public', 'community')
        OR
        (SELECT user_id FROM outfits WHERE outfit_id = outfit_id) = auth.uid()
    )
);

-- Policy: Users can unlike (delete their like)
CREATE POLICY outfit_likes_delete_policy ON outfit_likes
FOR DELETE USING (
    auth.uid() = user_id
);

------------------------------
-- OUTFIT COLLECTIONS TABLE
------------------------------
CREATE TABLE IF NOT EXISTS outfit_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    visibility VARCHAR(50) DEFAULT 'private',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster collection retrieval
CREATE INDEX IF NOT EXISTS idx_outfit_collections_user_id ON outfit_collections(user_id);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_outfit_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER outfit_collections_updated_at
BEFORE UPDATE ON outfit_collections
FOR EACH ROW
EXECUTE FUNCTION update_outfit_collections_updated_at();

-- Add RLS policies for outfit_collections
ALTER TABLE outfit_collections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view collections based on visibility
CREATE POLICY outfit_collections_select_policy ON outfit_collections
FOR SELECT USING (
    visibility IN ('public', 'community')
    OR
    user_id = auth.uid()
);

-- Policy: Users can create their own collections
CREATE POLICY outfit_collections_insert_policy ON outfit_collections
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- Policy: Users can update their own collections
CREATE POLICY outfit_collections_update_policy ON outfit_collections
FOR UPDATE USING (
    auth.uid() = user_id
) WITH CHECK (
    auth.uid() = user_id
);

-- Policy: Users can delete their own collections
CREATE POLICY outfit_collections_delete_policy ON outfit_collections
FOR DELETE USING (
    auth.uid() = user_id
);

------------------------------
-- COLLECTION ITEMS TABLE
------------------------------
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES outfit_collections(id) ON DELETE CASCADE,
    outfit_id UUID NOT NULL REFERENCES outfits(outfit_id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(collection_id, outfit_id)
);

-- Create index for faster collection item retrieval
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_outfit_id ON collection_items(outfit_id);

-- Add RLS policies for collection_items
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view collection items they have access to
CREATE POLICY collection_items_select_policy ON collection_items
FOR SELECT USING (
    (SELECT user_id FROM outfit_collections WHERE id = collection_items.collection_id) = auth.uid()
    OR
    (SELECT visibility FROM outfit_collections WHERE id = collection_items.collection_id) IN ('public', 'community')
);

-- Policy: Users can add items to their own collections
CREATE POLICY collection_items_insert_policy ON collection_items
FOR INSERT WITH CHECK (
    (SELECT user_id FROM outfit_collections WHERE id = collection_id) = auth.uid()
    AND
    (
        (SELECT visibility FROM outfits WHERE outfit_id = outfit_id) IN ('public', 'community')
        OR
        (SELECT user_id FROM outfits WHERE outfit_id = outfit_id) = auth.uid()
    )
);

-- Policy: Users can update items in their own collections
CREATE POLICY collection_items_update_policy ON collection_items
FOR UPDATE USING (
    (SELECT user_id FROM outfit_collections WHERE id = collection_id) = auth.uid()
) WITH CHECK (
    (SELECT user_id FROM outfit_collections WHERE id = collection_id) = auth.uid()
);

-- Policy: Users can remove items from their own collections
CREATE POLICY collection_items_delete_policy ON collection_items
FOR DELETE USING (
    (SELECT user_id FROM outfit_collections WHERE id = collection_id) = auth.uid()
);

------------------------------
-- FUNCTION: Get Like Count for an Outfit
------------------------------
CREATE OR REPLACE FUNCTION get_outfit_like_count(outfit_id UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER FROM outfit_likes 
    WHERE outfit_likes.outfit_id = $1;
$$ LANGUAGE SQL;

------------------------------
-- FUNCTION: Check if User Liked an Outfit
------------------------------
CREATE OR REPLACE FUNCTION has_user_liked_outfit(outfit_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM outfit_likes
        WHERE outfit_likes.outfit_id = $1
        AND outfit_likes.user_id = $2
    );
$$ LANGUAGE SQL;

------------------------------
-- TRIGGERS for Activity Feed Updates
------------------------------

-- Function to add activity when an outfit is liked
CREATE OR REPLACE FUNCTION update_like_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Don't create activity if the user likes their own outfit
    IF NEW.user_id = (SELECT user_id FROM outfits WHERE outfit_id = NEW.outfit_id) THEN
        RETURN NEW;
    END IF;

    -- Insert activity feed item
    INSERT INTO activity_feed (
        user_id,
        action_type,
        item_type,
        item_id,
        is_public,
        metadata
    ) VALUES (
        NEW.user_id,
        'like',
        'outfit',
        NEW.outfit_id,
        TRUE,
        jsonb_build_object(
            'outfit_id', NEW.outfit_id,
            'outfit_owner_id', (SELECT user_id FROM outfits WHERE outfit_id = NEW.outfit_id),
            'outfit_name', (SELECT name FROM outfits WHERE outfit_id = NEW.outfit_id),
            'outfit_image', (SELECT image_url FROM outfits WHERE outfit_id = NEW.outfit_id)
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER outfit_like_activity_trigger
AFTER INSERT ON outfit_likes
FOR EACH ROW
EXECUTE FUNCTION update_like_activity();

------------------------------
-- TRIGGERS for Notification Creation
------------------------------

-- Function to notify outfit owner when someone likes their outfit
CREATE OR REPLACE FUNCTION notify_outfit_owner_of_like()
RETURNS TRIGGER AS $$
DECLARE
    outfit_owner_id UUID;
BEGIN
    -- Get the outfit owner ID
    SELECT user_id INTO outfit_owner_id FROM outfits WHERE outfit_id = NEW.outfit_id;
    
    -- Don't notify if liking own outfit
    IF NEW.user_id = outfit_owner_id THEN
        RETURN NEW;
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
        user_id,
        notification_type,
        item_type,
        item_id,
        actor_id,
        metadata,
        is_read
    ) VALUES (
        outfit_owner_id,
        'like',
        'outfit',
        NEW.outfit_id,
        NEW.user_id,
        jsonb_build_object(
            'outfit_id', NEW.outfit_id,
            'outfit_name', (SELECT name FROM outfits WHERE outfit_id = NEW.outfit_id),
            'outfit_image', (SELECT image_url FROM outfits WHERE outfit_id = NEW.outfit_id)
        ),
        FALSE
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_outfit_owner_like_trigger
AFTER INSERT ON outfit_likes
FOR EACH ROW
EXECUTE FUNCTION notify_outfit_owner_of_like();

------------------------------
-- FUNCTION: Get Trending Outfits
------------------------------
CREATE OR REPLACE FUNCTION get_trending_outfits(
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    outfit_id UUID,
    name TEXT,
    description TEXT,
    image_url TEXT,
    user_id UUID,
    username TEXT,
    user_avatar TEXT,
    visibility TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER,
    trending_score FLOAT
) AS $$
DECLARE
    current_time TIMESTAMP WITH TIME ZONE := NOW();
    -- Time decay factors (more recent = higher score)
    time_24h INTERVAL := INTERVAL '24 hours';
    time_7d INTERVAL := INTERVAL '7 days';
    time_30d INTERVAL := INTERVAL '30 days';
BEGIN
    RETURN QUERY
    SELECT 
        o.outfit_id,
        o.name,
        o.description,
        o.image_url,
        o.user_id,
        (SELECT username FROM public.users WHERE id = o.user_id),
        (SELECT avatar_url FROM public.users WHERE id = o.user_id),
        o.visibility,
        o.created_at,
        (SELECT COUNT(*)::INTEGER FROM outfit_likes WHERE outfit_id = o.outfit_id) AS likes_count,
        -- Trending score calculation
        (
            -- Base score from likes (each like = 1 point)
            (SELECT COUNT(*)::FLOAT FROM outfit_likes WHERE outfit_id = o.outfit_id) + 
            -- Time decay factor - newer posts get higher score
            CASE
                WHEN o.created_at > (current_time - time_24h) THEN 10 -- Last 24 hours
                WHEN o.created_at > (current_time - time_7d) THEN 5 -- Last week
                WHEN o.created_at > (current_time - time_30d) THEN 2 -- Last month
                ELSE 0
            END
        ) AS trending_score
    FROM 
        outfits o
    WHERE 
        o.visibility IN ('public', 'community')
    ORDER BY 
        trending_score DESC,
        o.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

------------------------------
-- FUNCTION: Get User Recommendations
------------------------------
CREATE OR REPLACE FUNCTION get_user_recommendations(
    current_user_id UUID,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    is_following BOOLEAN,
    shared_interests INTEGER,
    followers_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Users the current user is already following
    following AS (
        SELECT followed_id 
        FROM wardrobe_follows 
        WHERE follower_id = current_user_id
    ),
    -- Get users with popular outfits and good engagement
    popular_users AS (
        SELECT 
            u.id,
            u.username,
            u.display_name,
            u.avatar_url,
            COUNT(DISTINCT ol.user_id) AS engagement_count,
            COUNT(DISTINCT wf.follower_id) AS followers_count
        FROM 
            users u
        LEFT JOIN 
            outfits o ON u.id = o.user_id
        LEFT JOIN 
            outfit_likes ol ON o.outfit_id = ol.outfit_id
        LEFT JOIN
            wardrobe_follows wf ON u.id = wf.followed_id
        WHERE 
            u.id != current_user_id AND
            o.visibility IN ('public', 'community')
        GROUP BY 
            u.id, u.username, u.display_name, u.avatar_url
        HAVING 
            COUNT(DISTINCT o.outfit_id) >= 3 -- Users with at least 3 public outfits
    )
    SELECT 
        pu.id,
        pu.username,
        pu.display_name,
        pu.avatar_url,
        FALSE AS is_following, -- Not following since we're filtering those out
        -- Shared interests based on similar outfit styles, categories, or tags
        (
            SELECT COUNT(DISTINCT o1.outfit_id)
            FROM outfits o1
            JOIN outfits o2 ON 
                o1.user_id = current_user_id AND
                o2.user_id = pu.id AND
                -- Some logic to determine similarity - using tags, occasion or style
                (o1.occasion && o2.occasion OR o1.style = o2.style)
        ) AS shared_interests,
        pu.followers_count
    FROM 
        popular_users pu
    WHERE 
        pu.id NOT IN (SELECT followed_id FROM following)
    ORDER BY 
        shared_interests DESC,
        pu.engagement_count DESC,
        pu.followers_count DESC
    LIMIT 
        limit_count;
END;
$$ LANGUAGE plpgsql; 