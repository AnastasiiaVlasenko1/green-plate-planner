import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ingredient } from './useRecipes';

interface GenerateImageParams {
  recipeId: string;
  recipeName: string;
  ingredients: Ingredient[];
}

export function useGenerateRecipeImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, recipeName, ingredients }: GenerateImageParams) => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to generate images');
      }

      // Check recipe ownership before generating
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('created_by')
        .eq('id', recipeId)
        .maybeSingle();

      if (recipeError) throw recipeError;
      if (!recipe) throw new Error('Recipe not found');
      if (!recipe.created_by || recipe.created_by !== user.id) {
        throw new Error('You can only generate images for your own recipes');
      }

      const { data, error } = await supabase.functions.invoke('generate-recipe-image', {
        body: { recipeId, recipeName, ingredients },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.imageUrl as string;
    },
    onSuccess: () => {
      // Invalidate recipes query to refetch with new image
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
    },
  });
}
