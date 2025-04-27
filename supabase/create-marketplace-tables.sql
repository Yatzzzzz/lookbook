-- Create products table for marketplace items
CREATE TABLE IF NOT EXISTS public.products (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    brand TEXT,
    category TEXT NOT NULL,
    image_url TEXT,
    product_url TEXT NOT NULL,
    price DECIMAL(10, 2),
    affiliate_code TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::JSONB,
    similar_to_item_id UUID,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create wish_list table for saving desired products
CREATE TABLE IF NOT EXISTS public.wish_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    price_at_addition DECIMAL(10, 2),
    notify_price_drop BOOLEAN DEFAULT FALSE,
    target_price DECIMAL(10, 2),
    UNIQUE(user_id, product_id)
);

-- Create click_tracking table for affiliate link tracking
CREATE TABLE IF NOT EXISTS public.click_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(product_id) ON DELETE CASCADE,
    click_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT,
    session_id TEXT,
    converted BOOLEAN DEFAULT FALSE,
    conversion_time TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(10, 2)
);

-- Create product_recommendations table for suggested products
CREATE TABLE IF NOT EXISTS public.product_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    relevance_score DECIMAL(5, 2),
    is_viewed BOOLEAN DEFAULT FALSE,
    is_clicked BOOLEAN DEFAULT FALSE
);

-- Create price_history table for tracking product price changes
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by all authenticated users"
ON public.products FOR SELECT
TO authenticated
USING (true);

-- Create RLS policies for wish_list table
ALTER TABLE public.wish_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist items"
ON public.wish_list FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items"
ON public.wish_list FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items"
ON public.wish_list FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items"
ON public.wish_list FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for click_tracking table
ALTER TABLE public.click_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own click tracking"
ON public.click_tracking FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for product_recommendations table
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product recommendations"
ON public.product_recommendations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own product recommendations"
ON public.product_recommendations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create RLS policies for price_history table
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Price history is viewable by all authenticated users"
ON public.price_history FOR SELECT
TO authenticated
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_similar_to_item_id_idx ON public.products(similar_to_item_id);
CREATE INDEX IF NOT EXISTS wish_list_user_id_idx ON public.wish_list(user_id);
CREATE INDEX IF NOT EXISTS click_tracking_product_id_idx ON public.click_tracking(product_id);
CREATE INDEX IF NOT EXISTS product_recommendations_user_id_idx ON public.product_recommendations(user_id);
CREATE INDEX IF NOT EXISTS price_history_product_id_idx ON public.price_history(product_id); 