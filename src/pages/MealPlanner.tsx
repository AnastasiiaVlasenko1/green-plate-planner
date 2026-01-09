import { useState } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Flame, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMealPlans, useAddMealPlan, useRemoveMealPlan, useToggleMealConsumed, MealType, getWeekDays, MealPlan } from '@/hooks/useMealPlans';
import { useRecipes, useRecipe, Recipe } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';

const mealTypes: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'snack1', label: 'Snack' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'snack2', label: 'Snack' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack3', label: 'Snack' },
];

export default function MealPlanner() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; mealType: MealType } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);

  // Fetch full recipe details when a meal is selected
  const { data: selectedRecipeDetails } = useRecipe(selectedMeal?.recipe_id);

  const { profile } = useProfile();
  const { data: mealPlans, isLoading: mealsLoading } = useMealPlans(weekStart);
  const { data: recipes } = useRecipes(recipeSearch);
  const addMealPlan = useAddMealPlan();
  const removeMealPlan = useRemoveMealPlan();
  const toggleConsumed = useToggleMealConsumed();

  const weekDays = getWeekDays(weekStart);

  const getMealForSlot = (date: Date, mealType: MealType) => {
    return mealPlans?.find(
      (plan) =>
        plan.plan_date === format(date, 'yyyy-MM-dd') &&
        plan.meal_type === mealType
    );
  };

  const getDayNutrition = (date: Date) => {
    const dayMeals = mealPlans?.filter(
      (plan) => plan.plan_date === format(date, 'yyyy-MM-dd')
    ) || [];

    return dayMeals.reduce(
      (acc, plan) => {
        if (plan.recipe) {
          acc.calories += plan.recipe.calories * plan.servings;
          acc.protein += plan.recipe.protein * plan.servings;
          acc.carbs += plan.recipe.carbs * plan.servings;
          acc.fat += plan.recipe.fat * plan.servings;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleAddRecipe = async (recipe: Recipe) => {
    if (!selectedSlot) return;

    try {
      await addMealPlan.mutateAsync({
        recipeId: recipe.id,
        planDate: selectedSlot.date,
        mealType: selectedSlot.mealType,
      });
      toast.success(`Added ${recipe.name}!`);
      setShowAddDialog(false);
      setSelectedSlot(null);
    } catch (error) {
      toast.error('Failed to add meal');
    }
  };

  const handleRemoveMeal = async (mealPlanId: string) => {
    try {
      await removeMealPlan.mutateAsync(mealPlanId);
      toast.success('Meal removed');
    } catch (error) {
      toast.error('Failed to remove meal');
    }
  };

  const openAddDialog = (date: Date, mealType: MealType) => {
    setSelectedSlot({ date, mealType });
    setShowAddDialog(true);
  };

  const handleMealClick = (meal: MealPlan) => {
    setSelectedMeal(meal);
  };

  const handleToggleConsumed = (e: React.MouseEvent, meal: MealPlan) => {
    e.stopPropagation();
    toggleConsumed.mutate({
      mealPlanId: meal.id,
      isConsumed: !meal.is_consumed,
    });
  };

  const handleRemoveFromDetail = async () => {
    if (selectedMeal) {
      await handleRemoveMeal(selectedMeal.id);
      setSelectedMeal(null);
    }
  };

  return (
    <>
      <AppHeader title="Meal Planner" showSearch={false} />

      <div className="flex-1 p-4 lg:p-6 space-y-4 animate-fade-in overflow-x-auto">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Planner Grid */}
        <div className="min-w-[800px]">
          {/* Header Row - Days */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="p-2"></div>
            {weekDays.map((day) => {
              const nutrition = getDayNutrition(day);
              const calorieGoal = profile?.daily_calories || 2000;
              const caloriePercent = Math.round((nutrition.calories / calorieGoal) * 100);

              return (
                <div key={day.toISOString()} className="text-center">
                  <p className="text-sm font-medium text-foreground">{format(day, 'EEE')}</p>
                  <p className="text-xs text-muted-foreground">{format(day, 'MMM d')}</p>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-calories" />
                    <span className={cn(
                      "text-xs font-medium",
                      caloriePercent >= 90 && caloriePercent <= 110 ? "text-primary" : "text-muted-foreground"
                    )}>
                      {nutrition.calories}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Meal Rows */}
          {mealsLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="grid grid-cols-8 gap-2">
                  <Skeleton className="h-24" />
                  {[...Array(7)].map((_, j) => (
                    <Skeleton key={j} className="h-24" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {mealTypes.map((mealType) => (
                <div key={mealType.key} className="grid grid-cols-8 gap-2">
                  {/* Meal Type Label */}
                  <div className="flex items-center justify-end p-2">
                    <span className="text-sm font-medium text-muted-foreground">{mealType.label}</span>
                  </div>

                  {/* Day Slots */}
                  {weekDays.map((day) => {
                    const meal = getMealForSlot(day, mealType.key);

                    return (
                      <Card
                        key={`${day.toISOString()}-${mealType.key}`}
                        className={cn(
                          "min-h-[100px] cursor-pointer transition-all",
                          meal 
                            ? meal.is_consumed 
                              ? "bg-primary/10 border-primary/30" 
                              : "bg-card"
                            : "bg-secondary/50 hover:bg-secondary"
                        )}
                        onClick={() => !meal && openAddDialog(day, mealType.key)}
                      >
                        <CardContent className="p-2 h-full">
                          {meal ? (
                            <div 
                              className="relative h-full group cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMealClick(meal);
                              }}
                            >
                              {/* Consumption toggle checkbox */}
                              <div 
                                className="absolute top-0 left-0 z-10 bg-background/80 rounded-br p-0.5"
                                onClick={(e) => handleToggleConsumed(e, meal)}
                              >
                                {toggleConsumed.isPending && toggleConsumed.variables?.mealPlanId === meal.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                ) : (
                                  <Checkbox
                                    checked={meal.is_consumed}
                                    className="w-4 h-4 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                )}
                              </div>
                              
                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-1 -right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMeal(meal.id);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              
                              {/* Image with conditional opacity */}
                              <img
                                src={meal.recipe?.image_url}
                                alt={meal.recipe?.name}
                                className={cn(
                                  "w-full h-12 object-cover rounded mb-1 transition-opacity",
                                  meal.is_consumed && "opacity-60"
                                )}
                              />
                              
                              {/* Name with conditional strikethrough */}
                              <p className={cn(
                                "text-xs font-medium line-clamp-2 transition-colors",
                                meal.is_consumed 
                                  ? "line-through text-muted-foreground" 
                                  : "text-foreground"
                              )}>
                                {meal.recipe?.name}
                              </p>
                              
                              <p className="text-xs text-muted-foreground">
                                {meal.recipe?.calories} cal
                              </p>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <Plus className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Recipe Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Add {selectedSlot && mealTypes.find(m => m.key === selectedSlot.mealType)?.label} for{' '}
              {selectedSlot && format(selectedSlot.date, 'EEEE, MMM d')}
            </DialogTitle>
          </DialogHeader>
          <input
            type="text"
            placeholder="Search recipes..."
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          />
          <div className="flex-1 overflow-y-auto space-y-2 mt-4">
            {recipes?.map((recipe) => (
              <div
                key={recipe.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                onClick={() => handleAddRecipe(recipe)}
              >
                <img
                  src={recipe.image_url}
                  alt={recipe.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{recipe.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {recipe.calories} cal • {recipe.protein}g protein
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {recipe.prep_time + recipe.cook_time} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        recipe={selectedRecipeDetails || null}
        open={!!selectedMeal}
        onOpenChange={(open) => !open && setSelectedMeal(null)}
        onRemoveFromPlan={handleRemoveFromDetail}
        showRemoveButton={true}
      />
    </>
  );
}
