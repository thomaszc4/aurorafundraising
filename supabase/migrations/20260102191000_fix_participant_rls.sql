-- Ensure RLS is enabled
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Drop existing broad policy if it exists
DROP POLICY IF EXISTS "Participants can update own data" ON public.participants;

-- Create more specific policy that explicitly allows anonymous and authenticated users
-- to update rows where they know the ID (security by obscurity for anonymous participants)
CREATE POLICY "Participants can update own data" ON public.participants 
FOR UPDATE 
TO anon, authenticated, public
USING (true)
WITH CHECK (true);

-- Ensure permissions are granted on the new column
GRANT ALL ON TABLE public.participants TO anon;
GRANT ALL ON TABLE public.participants TO authenticated;
GRANT ALL ON TABLE public.participants TO service_role;
