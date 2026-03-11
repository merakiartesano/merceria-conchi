-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    status TEXT NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We need a unique constraint on user_id to easily update it or fetch it "1 to 1". 
-- But a user might have multiple subscriptions over time if they cancel and resubscribe. 
-- We will just query the most recent active one.

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Enable read for users based on user_id"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Admins / Service Role can insert/update (Service Role bypasses RLS)
-- We will allow authenticated users to update their own row just in case, but webhooks use service_role.
CREATE POLICY "Enable update for users based on user_id"
    ON public.subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users"
    ON public.subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Create academy_settings table (store live class link)
CREATE TABLE IF NOT EXISTS public.academy_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    live_class_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default row
INSERT INTO public.academy_settings (id, live_class_url) VALUES (1, '') ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Enable read for public on academy_settings"
    ON public.academy_settings
    FOR SELECT
    TO public
    USING (true);

-- Anyone can update settings (secured by frontend admin PIN)
CREATE POLICY "Enable update for public on academy_settings"
    ON public.academy_settings
    FOR UPDATE
    TO public
    USING (true);

-- Create academy_videos table
CREATE TABLE IF NOT EXISTS public.academy_videos (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.academy_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can read videos
CREATE POLICY "Enable read for public on academy_videos"
    ON public.academy_videos
    FOR SELECT
    TO public
    USING (true);

-- Anyone can insert/update/delete videos (secured by frontend admin PIN)
CREATE POLICY "Enable all for public on academy_videos"
    ON public.academy_videos
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
