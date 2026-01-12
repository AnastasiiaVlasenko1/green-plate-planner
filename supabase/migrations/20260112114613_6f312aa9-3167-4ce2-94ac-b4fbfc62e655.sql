-- Add DELETE policy for profiles table to allow users to delete their own profile data
-- This enables GDPR compliance (Right to Erasure) and allows users to remove their personal information

CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);