-- Add discount columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_id text;

-- Add discount columns to sale_items table
ALTER TABLE public.sale_items 
ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percent numeric NOT NULL DEFAULT 0;

-- Create function to generate order ID in format DDMMYYYY + unique number
CREATE OR REPLACE FUNCTION public.generate_order_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  date_prefix text;
  daily_count integer;
  new_order_id text;
BEGIN
  -- Format: DDMMYYYY
  date_prefix := to_char(now(), 'DDMMYYYY');
  
  -- Count today's orders to get unique number
  SELECT COUNT(*) + 1 INTO daily_count
  FROM sales
  WHERE order_id LIKE date_prefix || '%'
    AND id != NEW.id;
  
  -- Create order ID: DDMMYYYY + 4-digit sequential number
  new_order_id := date_prefix || lpad(daily_count::text, 4, '0');
  
  NEW.order_id := new_order_id;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate order ID
DROP TRIGGER IF EXISTS generate_order_id_trigger ON public.sales;
CREATE TRIGGER generate_order_id_trigger
  BEFORE INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_id();