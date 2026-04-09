DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.subscriptions;

-- Allow reading all subscriptions so the frontend Admin Panel can fetch them and the Clases page can count them
CREATE POLICY "Enable read for all"
    ON public.subscriptions
    FOR SELECT
    USING (true);
