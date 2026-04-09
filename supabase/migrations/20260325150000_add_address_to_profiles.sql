-- Añadir nuevos campos de dirección y preferencia de recogida a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS zip TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'España',
ADD COLUMN IF NOT EXISTS pickup_pref BOOLEAN DEFAULT false;

-- Actualizar la función handle_new_user para capturar los nuevos campos desde raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    phone, 
    address, 
    zip, 
    city, 
    state, 
    country,
    pickup_pref
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'zip',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'country',
    (new.raw_user_meta_data->>'pickup_pref')::boolean
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Añadir método de entrega a la tabla de pedidos
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'shipping';

