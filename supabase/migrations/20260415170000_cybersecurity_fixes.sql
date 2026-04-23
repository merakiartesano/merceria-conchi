-- Fix 'products'
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin can manage products" ON public.products USING ( auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com' );

-- Fix 'product_categories'
DROP POLICY IF EXISTS "Categories are editable by authenticated users" ON public.product_categories;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.product_categories;
CREATE POLICY "Categories are viewable by everyone" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Categories are editable by admin" ON public.product_categories FOR ALL USING ( auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com' );

-- Fix 'shipping_zones'
DROP POLICY IF EXISTS "Admins can manage shipping zones" ON public.shipping_zones;
DROP POLICY IF EXISTS "Public profiles can read active shipping zones" ON public.shipping_zones;
CREATE POLICY "Public profiles can read active shipping zones" ON public.shipping_zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones FOR ALL USING ( auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com' );

-- Fix 'academy_settings'
DROP POLICY IF EXISTS "Allow anon update to academy settings" ON public.academy_settings;
DROP POLICY IF EXISTS "Allow public read access to academy settings" ON public.academy_settings;
CREATE POLICY "Allow public read access to academy settings" ON public.academy_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage academy settings" ON public.academy_settings FOR ALL USING ( auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com' );

-- Fix 'academy_videos'
DROP POLICY IF EXISTS "Enable all for public on academy_videos" ON public.academy_videos;
DROP POLICY IF EXISTS "Enable read for public on academy_videos" ON public.academy_videos;
CREATE POLICY "Enable read for public on academy_videos" ON public.academy_videos FOR SELECT USING (true);
CREATE POLICY "Admin can manage academy videos" ON public.academy_videos FOR ALL USING ( auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com' );

-- Fix 'profiles'
DROP POLICY IF EXISTS "Enable read access for all authenticated users to view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
CREATE POLICY "Admin can delete profiles" ON public.profiles FOR DELETE USING (auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');

-- Fix 'subscriptions'
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable read for all" ON public.subscriptions;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
CREATE POLICY "System can insert subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
CREATE POLICY "System can update subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
CREATE POLICY "Admin can delete subscriptions" ON public.subscriptions FOR DELETE USING (auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');

-- Add safety constraint for Admin checking orders (replacing the bad generic policy)
DROP POLICY IF EXISTS "Enable full access for admin on orders" ON public.orders;
CREATE POLICY "Admin can update orders" ON public.orders FOR UPDATE USING (auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
CREATE POLICY "Admin can delete orders" ON public.orders FOR DELETE USING (auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');

DROP POLICY IF EXISTS "Enable full access for admin on order_items" ON public.order_items;
CREATE POLICY "Admin can update order items" ON public.order_items FOR UPDATE USING (auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
CREATE POLICY "Admin can delete order items" ON public.order_items FOR DELETE USING (auth.jwt() ->> 'email' = 'web.merakiartesano@gmail.com');
