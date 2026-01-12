-- Drop existing INSERT and UPDATE policies on recipes table
DROP POLICY IF EXISTS "Authenticated users can insert recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;

-- Create new INSERT policy: only admins can set is_public = true
CREATE POLICY "Users can insert recipes" ON public.recipes 
  FOR INSERT TO authenticated 
  WITH CHECK (
    auth.uid() = created_by 
    AND (
      is_public = false 
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Create new UPDATE policy: only owners can update, and only admins can set is_public = true
CREATE POLICY "Users can update own recipes" ON public.recipes 
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (
    auth.uid() = created_by 
    AND (
      is_public = false 
      OR public.has_role(auth.uid(), 'admin')
    )
  );