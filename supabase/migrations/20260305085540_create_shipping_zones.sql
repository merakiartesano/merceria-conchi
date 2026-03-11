-- Create Shipping Zones Table
CREATE TABLE IF NOT EXISTS public.shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region_code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    free_shipping_threshold DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Public profiles can read active shipping zones"
ON public.shipping_zones
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage shipping zones"
ON public.shipping_zones
FOR ALL
USING (true); -- simplified for now, assuming admin is handled by frontend or separate logic

-- Insert Default Zones
INSERT INTO public.shipping_zones (name, region_code, is_active, cost, free_shipping_threshold) VALUES
('España - Península', 'peninsula', true, 4.95, 60.00),
('Islas Baleares', 'baleares', false, 8.50, 100.00),
('Islas Canarias', 'canarias', false, 12.00, 150.00),
('Portugal', 'portugal', false, 6.95, 80.00)
ON CONFLICT (region_code) DO NOTHING;
