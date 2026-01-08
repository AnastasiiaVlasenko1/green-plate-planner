import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

export type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner' | 'snack3';

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  plan_date: string;
  meal_type: MealType;
  servings: number;
  is_consumed: boolean;
  consumed_at: string | null;
  created_at: string;
  recipe?: {
    id: string;
    name: string;
    image_url: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    prep_time: number;
  };
}

export function useMealPlans(weekStart?: Date) {
  const { user } = useAuth();
  const start = weekStart ? startOfWeek(weekStart, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(start, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ['mealPlans', user?.id, format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          recipe:recipes(id, name, image_url, calories, protein, carbs, fat, fiber, prep_time)
        `)
        .eq('user_id', user.id)
        .gte('plan_date', format(start, 'yyyy-MM-dd'))
        .lte('plan_date', format(end, 'yyyy-MM-dd'));
      
      if (error) throw error;
      return data as MealPlan[];
    },
    enabled: !!user?.id,
  });
}

export function useAddMealPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipeId,
      planDate,
      mealType,
      servings = 1,
    }: {
      recipeId: string;
      planDate: Date;
      mealType: MealType;
      servings?: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('meal_plans')
        .upsert({
          user_id: user.id,
          recipe_id: recipeId,
          plan_date: format(planDate, 'yyyy-MM-dd'),
          meal_type: mealType,
          servings,
        }, {
          onConflict: 'user_id,plan_date,meal_type',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    },
  });
}

export function useRemoveMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealPlanId: string) => {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    },
  });
}

export function useToggleMealConsumed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealPlanId, isConsumed }: { mealPlanId: string; isConsumed: boolean }) => {
      const { error } = await supabase
        .from('meal_plans')
        .update({
          is_consumed: isConsumed,
          consumed_at: isConsumed ? new Date().toISOString() : null,
        })
        .eq('id', mealPlanId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    },
  });
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}
