-- Add INSERT policy for order_items table to allow checkout to create order items
-- Only allow inserts for pending orders (prevents manipulation after order creation)
CREATE POLICY "Anyone can create order items for pending orders"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.status = 'pending'
  )
);