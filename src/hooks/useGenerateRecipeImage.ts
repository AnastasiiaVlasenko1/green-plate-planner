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
