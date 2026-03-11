-- Create the academy_settings table
CREATE TABLE IF NOT EXISTS public.academy_settings (
    id integer PRIMARY KEY DEFAULT 1,
    live_link text,
    welcome_text text,
    stripe_payment_link text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow ANYONE to READ the academy settings (like welcome text and Stripe link)
CREATE POLICY "Allow public read access to academy settings"
    ON public.academy_settings
    FOR SELECT
    USING (true);

-- Create policy to allow ANYONE to UPDATE/INSERT the academy settings 
-- (Note: In production with real auth, this should only be allowed for the admin UID. 
-- For now, since the admin panel uses a local pin, we allow anonymous updates from our code)
CREATE POLICY "Allow anon update to academy settings"
    ON public.academy_settings
    FOR ALL
    USING (true);

-- Insert the default row so we always update row id=1
INSERT INTO public.academy_settings (id, welcome_text) 
VALUES (1, '¡Bienvenidos a la Academia Meraki! Estamos preparando el próximo proyecto.') 
ON CONFLICT (id) DO NOTHING;
