-- Migración: Añadir campos Redsys a la tabla orders
-- Ejecutar cuando se cambie de Stripe a Redsys

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS redsys_order_id TEXT,
  ADD COLUMN IF NOT EXISTS redsys_response_code TEXT;

-- Índice para búsquedas rápidas por redsys_order_id (IPN notifications)
CREATE INDEX IF NOT EXISTS idx_orders_redsys_order_id ON public.orders (redsys_order_id);
