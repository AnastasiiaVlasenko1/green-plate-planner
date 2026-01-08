import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Ingredient {
  name: string;
  amount: string;
}

interface UpdateRecipeInput {
  id: string;
  name?: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  ingredients?: Ingredient[];
  instructions?: string[];
  tags?: string[];
  is_public?: boolean;
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ingredients, ...updates }: UpdateRecipeInput) => {
      // Build payload, casting ingredients if present
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...updates };
      if (ingredients !== undefined) {
        payload.ingredients = ingredients;
      }
      
      const { data, error } = await supabase
        .from('recipes')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
    },
    onError: (error) => {
      console.error('Error updating recipe:', error);
      toast.error('Failed to update recipe');
    },
  });
}
