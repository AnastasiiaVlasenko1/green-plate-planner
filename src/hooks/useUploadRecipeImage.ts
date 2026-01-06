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

      // Check recipe ownership before uploading
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('created_by')
        .eq('id', recipeId)
        .maybeSingle();

      if (recipeError) throw recipeError;
      if (!recipe) throw new Error('Recipe not found');
      if (!recipe.created_by || recipe.created_by !== user.id) {
        throw new Error('You can only upload images for your own recipes');
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
      const { data: updateData, error: updateError } = await supabase
        .from('recipes')
        .update({ image_url: publicUrl })
        .eq('id', recipeId)
        .select();

      if (updateError) throw updateError;
      if (!updateData || updateData.length === 0) {
        throw new Error('Failed to update recipe - you may not have permission');
      }

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
    },
  });
}
