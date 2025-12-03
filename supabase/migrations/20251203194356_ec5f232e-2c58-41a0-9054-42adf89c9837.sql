-- Drop and recreate with explicit anon role
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create permissive INSERT policy for both anon and authenticated users
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);