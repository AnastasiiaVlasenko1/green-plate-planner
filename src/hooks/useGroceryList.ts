import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, startOfWeek } from 'date-fns';

export interface GroceryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: string;
  category: string;
  is_checked: boolean;
  week_start: string;
  created_at: string;
}

export function useGroceryList(weekStart?: Date) {
  const { user } = useAuth();
  const start = weekStart ? startOfWeek(weekStart, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 });

  return useQuery({
    queryKey: ['groceryList', user?.id, format(start, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', format(start, 'yyyy-MM-dd'))
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data as GroceryItem[];
    },
    enabled: !!user?.id,
  });
}

export function useToggleGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isChecked }: { id: string; isChecked: boolean }) => {
      const { error } = await supabase
        .from('grocery_items')
        .update({ is_checked: isChecked })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryList'] });
    },
  });
}

export function useGenerateGroceryList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weekStart: Date) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const start = startOfWeek(weekStart, { weekStartsOn: 1 });
      const weekStartStr = format(start, 'yyyy-MM-dd');
      
      // Delete existing grocery items for this week
      await supabase
        .from('grocery_items')
        .delete()
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr);
      
      // Get all meal plans for the week with recipe details
      const { data: mealPlans, error: mealPlansError } = await supabase
        .from('meal_plans')
        .select(`
          servings,
          recipe:recipes(ingredients)
        `)
        .eq('user_id', user.id)
        .gte('plan_date', weekStartStr)
        .lte('plan_date', format(addDays(start, 6), 'yyyy-MM-dd'));
      
      if (mealPlansError) throw mealPlansError;
      
      // Aggregate ingredients
      const ingredientMap = new Map<string, { quantity: string; category: string }>();
      
      for (const plan of mealPlans || []) {
        const ingredients = (plan.recipe?.ingredients as any[]) || [];
        for (const ing of ingredients) {
          const key = ing.name.toLowerCase();
          if (!ingredientMap.has(key)) {
            ingredientMap.set(key, {
              quantity: ing.amount,
              category: ing.category || 'Other',
            });
          }
        }
      }
      
      // Insert grocery items
      const groceryItems = Array.from(ingredientMap.entries()).map(([name, { quantity, category }]) => ({
        user_id: user.id,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        quantity,
        category,
        is_checked: false,
        week_start: weekStartStr,
      }));
      
      if (groceryItems.length > 0) {
        const { error: insertError } = await supabase
          .from('grocery_items')
          .insert(groceryItems);
        
        if (insertError) throw insertError;
      }
      
      return groceryItems;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groceryList'] });
    },
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
