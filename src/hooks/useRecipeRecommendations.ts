import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useRecipes, Recipe } from './useRecipes';
import { useMealPlans } from './useMealPlans';
import { isToday } from 'date-fns';

export interface RecipeRecommendation {
  recipe: Recipe;
  reason: string;
  nutrition_highlight: string;
}

export function useRecipeRecommendations() {
  const { profile } = useProfile();
  const { data: recipes } = useRecipes();
  const { data: mealPlans } = useMealPlans();

  // Calculate today's nutrition from meal plans
  const todaysMeals = mealPlans?.filter(
    (plan) => isToday(new Date(plan.plan_date))
  ) || [];

  const todayNutrition = todaysMeals.reduce(
    (acc, plan) => {
      if (plan.recipe) {
        acc.calories += plan.recipe.calories * plan.servings;
        acc.protein += plan.recipe.protein * plan.servings;
        acc.carbs += plan.recipe.carbs * plan.servings;
        acc.fat += plan.recipe.fat * plan.servings;
        acc.fiber += plan.recipe.fiber * plan.servings;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const goals = {
    calories: profile?.daily_calories || 2000,
    protein: profile?.protein_goal || 150,
    carbs: profile?.carbs_goal || 200,
    fat: profile?.fat_goal || 65,
    fiber: profile?.fiber_goal || 30,
  };

  // Calculate nutritional gaps
  const nutritionGaps = {
    calories: { current: todayNutrition.calories, goal: goals.calories, gap: goals.calories - todayNutrition.calories },
    protein: { current: todayNutrition.protein, goal: goals.protein, gap: goals.protein - todayNutrition.protein },
    carbs: { current: todayNutrition.carbs, goal: goals.carbs, gap: goals.carbs - todayNutrition.carbs },
    fat: { current: todayNutrition.fat, goal: goals.fat, gap: goals.fat - todayNutrition.fat },
    fiber: { current: todayNutrition.fiber, goal: goals.fiber, gap: goals.fiber - todayNutrition.fiber },
  };

  return useQuery({
    queryKey: ['recipe-recommendations', profile?.id, todayNutrition, recipes?.length],
    queryFn: async (): Promise<RecipeRecommendation[]> => {
      if (!recipes || recipes.length === 0) {
        return [];
      }

      const { data, error } = await supabase.functions.invoke('recommend-recipes', {
        body: {
          nutritionGaps,
          preferences: profile?.dietary_preferences || [],
          allergies: profile?.allergies || [],
          availableRecipes: recipes,
        },
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Map recommendations to full recipe objects
      const recommendations: RecipeRecommendation[] = [];
      for (const rec of data.recommendations || []) {
        const recipe = recipes.find((r) => r.id === rec.recipe_id);
        if (recipe) {
          recommendations.push({
            recipe,
            reason: rec.reason,
            nutrition_highlight: rec.nutrition_highlight,
          });
        }
      }

      return recommendations;
    },
    enabled: !!profile && !!recipes && recipes.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}
