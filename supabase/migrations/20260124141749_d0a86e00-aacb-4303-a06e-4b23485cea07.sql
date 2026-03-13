-- Drop existing restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;

CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update products" 
ON public.products 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete products" 
ON public.products 
FOR DELETE 
USING (true);

-- Also fix sale_items and sales policies
DROP POLICY IF EXISTS "Anyone can view sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Anyone can insert sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Anyone can update sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Anyone can delete sale_items" ON public.sale_items;

CREATE POLICY "Anyone can view sale_items" 
ON public.sale_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert sale_items" 
ON public.sale_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sale_items" 
ON public.sale_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete sale_items" 
ON public.sale_items 
FOR DELETE 
USING (true);

DROP POLICY IF EXISTS "Anyone can view sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can update sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can delete sales" ON public.sales;

CREATE POLICY "Anyone can view sales" 
ON public.sales 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sales" 
ON public.sales 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete sales" 
ON public.sales 
FOR DELETE 
USING (true);