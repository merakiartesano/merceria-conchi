-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendiente',
    total_amount DECIMAL(10, 2) NOT NULL,
    stripe_session_id TEXT UNIQUE
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for orders
CREATE POLICY "Enable insert for everyone on orders"
    ON public.orders
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow public to select their own orders
CREATE POLICY "Enable read for public by id"
    ON public.orders
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated (admin) full access to orders
CREATE POLICY "Enable full access for admin on orders"
    ON public.orders
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL
);

-- Enable RLS for order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow public inserts for order_items
CREATE POLICY "Enable insert for everyone on order_items"
    ON public.order_items
    AS PERMISSIVE
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow public to select their own order items
CREATE POLICY "Enable read for public on order_items"
    ON public.order_items
    FOR SELECT
    TO public
    USING (true);

-- Allow authenticated (admin) full access to order_items
CREATE POLICY "Enable full access for admin on order_items"
    ON public.order_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
