import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ingredient {
  name: string;
  amount: string;
  category: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  allergens: string[];
  created_by: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useRecipes(search?: string, tags?: string[]) {
  return useQuery({
    queryKey: ['recipes', search, tags],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('*')
        .order('name');
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Parse ingredients from JSONB
      return (data || []).map(recipe => ({
        ...recipe,
        ingredients: (recipe.ingredients as unknown as Ingredient[]) || [],
      })) as Recipe[];
    },
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        ingredients: (data.ingredients as unknown as Ingredient[]) || [],
      } as Recipe;
    },
    enabled: !!id,
  });
}
