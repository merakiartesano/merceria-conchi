ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS redsys_order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_redsys_order_id ON public.subscriptions (redsys_order_id);
