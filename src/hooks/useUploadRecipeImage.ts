import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUploadRecipeImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, file }: { recipeId: string; file: File }) => {
      // Get current user for folder structure
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to upload images');
      }

      const fileExt = file.name.split('.').pop();
      // Use user-folder structure for ownership enforcement
      const fileName = `${user.id}/${recipeId}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update recipe with new image URL
      const { error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: publicUrl })
        .eq('id', recipeId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
    },
  });
}
