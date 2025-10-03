-- Add INSERT policy for authenticated users to create their own profile
CREATE POLICY "Authenticated users can create their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());