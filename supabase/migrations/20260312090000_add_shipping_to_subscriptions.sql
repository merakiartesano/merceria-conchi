-- Add shipping_details column to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS shipping_details JSONB;

-- Update the secure function to fetch subscribers including shipping_details for the Admin Panel
CREATE OR REPLACE FUNCTION get_admin_subscribers(admin_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic security check matching the frontend PIN
  IF admin_pin != 'meraki2026' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT 
        p.id, 
        p.email, 
        p.first_name, 
        p.last_name, 
        p.phone, 
        p.created_at,
        s.status, 
        s.stripe_customer_id, 
        s.current_period_end,
        s.shipping_details
      FROM public.profiles p
      LEFT JOIN (
          -- Get the most recent active subscription per user, or just the most recent one
          SELECT DISTINCT ON (user_id) *
          FROM public.subscriptions
          ORDER BY user_id, created_at DESC
      ) s ON p.id = s.user_id
      ORDER BY p.created_at DESC
    ) t
  );
END;
$$;
