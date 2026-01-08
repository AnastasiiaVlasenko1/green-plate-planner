import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Ingredient {
  amount: string;
  name: string;
}

interface CreateRecipeInput {
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions?: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  tags?: string[];
  image?: File;
}

interface CompletedRecipeData {
  description: string;
  prep_time: number;
  cook_time: number;
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  tags: string[];
  allergens: string[];
}

const needsAiCompletion = (input: CreateRecipeInput): boolean => {
  return (
    !input.description ||
    !input.prep_time ||
    !input.cook_time ||
    !input.instructions || input.instructions.length === 0 ||
    !input.calories ||
    !input.protein ||
    !input.carbs ||
    !input.fat ||
    !input.fiber
  );
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRecipeInput) => {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("You must be logged in to create a recipe");
      }

      let completedData: Partial<CompletedRecipeData> = {};

      // Check if we need AI completion
      if (needsAiCompletion(input)) {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('complete-recipe', {
          body: {
            name: input.name,
            description: input.description,
            ingredients: input.ingredients,
            instructions: input.instructions,
            prep_time: input.prep_time,
            cook_time: input.cook_time,
            servings: input.servings || 2,
            calories: input.calories,
            protein: input.protein,
            carbs: input.carbs,
            fat: input.fat,
            fiber: input.fiber,
            tags: input.tags,
          }
        });

        if (functionError) {
          console.error("AI completion error:", functionError);
          throw new Error("Failed to generate recipe details. Please fill in all fields manually.");
        }

        if (functionData.error) {
          throw new Error(functionData.error);
        }

        completedData = functionData;
      }

      // Convert ingredients to the database format
      const ingredientsJson = input.ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        category: "Other"
      }));

      // Prepare recipe data
      const recipeData = {
        name: input.name,
        description: input.description || completedData.description || "",
        prep_time: input.prep_time || completedData.prep_time || 15,
        cook_time: input.cook_time || completedData.cook_time || 20,
        servings: input.servings || 2,
        calories: input.calories || completedData.calories || 0,
        protein: input.protein || completedData.protein || 0,
        carbs: input.carbs || completedData.carbs || 0,
        fat: input.fat || completedData.fat || 0,
        fiber: input.fiber || completedData.fiber || 0,
        ingredients: ingredientsJson,
        instructions: (input.instructions && input.instructions.length > 0) 
          ? input.instructions 
          : (completedData.instructions || []),
        tags: (input.tags && input.tags.length > 0) 
          ? input.tags 
          : (completedData.tags || []),
        allergens: completedData.allergens || [],
        created_by: user.id,
        is_public: false,
        image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop" // Placeholder
      };

      // Insert recipe
      const { data: recipe, error: insertError } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to save recipe");
      }

      // Handle image upload if provided
      if (input.image) {
        const fileExt = input.image.name.split('.').pop();
        const filePath = `${user.id}/${recipe.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(filePath, input.image, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('recipe-images')
            .getPublicUrl(filePath);

          await supabase
            .from('recipes')
            .update({ image_url: urlData.publicUrl })
            .eq('id', recipe.id);
        }
      } else {
        // Trigger AI image generation in background
        supabase.functions.invoke('generate-recipe-image', {
          body: {
            recipeId: recipe.id,
            recipeName: recipe.name,
            ingredients: recipe.ingredients
          }
        }).catch(err => console.error("Background image generation failed:", err));
      }

      return recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success("Recipe created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
