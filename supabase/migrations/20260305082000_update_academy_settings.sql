ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS live_title TEXT DEFAULT '';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS welcome_text TEXT DEFAULT '';
ALTER TABLE public.academy_settings ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT DEFAULT '';
