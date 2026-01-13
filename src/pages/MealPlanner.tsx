import { useState, useRef, useEffect } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Flame, Loader2, Search } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useMealPlans, useAddMealPlan, useRemoveMealPlan, useToggleMealConsumed, MealType, getWeekDays, MealPlan } from '@/hooks/useMealPlans';
import { useRecipes, useRecipe, Recipe } from '@/hooks/useRecipes';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { useIsMobile } from '@/hooks/use-mobile';

// Group recipes by suggested meal type based on tags
const groupRecipesByMealType = (recipes: Recipe[] | undefined) => {
  if (!recipes) return { breakfast: [], lunch: [], dinner: [], other: [] };
  
  const groups: { breakfast: Recipe[]; lunch: Recipe[]; dinner: Recipe[]; other: Recipe[] } = {
    breakfast: [],
    lunch: [],
    dinner: [],
    other: []
  };
  
  recipes.forEach(recipe => {
    const tags = recipe.tags?.map(t => t.toLowerCase()) || [];
    const name = recipe.name.toLowerCase();
    
    if (tags.includes('breakfast') || name.includes('breakfast') || name.includes('oatmeal') || name.includes('pancake') || name.includes('egg')) {
      groups.breakfast.push(recipe);
    } else if (tags.includes('lunch') || name.includes('salad') || name.includes('sandwich') || name.includes('wrap')) {
      groups.lunch.push(recipe);
    } else if (tags.includes('dinner') || name.includes('steak') || name.includes('chicken') || name.includes('salmon') || name.includes('pasta')) {
      groups.dinner.push(recipe);
    } else {
      groups.other.push(recipe);
    }
  });
  
  return groups;
};

const mealTypes: {
  key: MealType;
  label: string;
}[] = [{
  key: 'breakfast',
  label: 'Breakfast'
}, {
  key: 'snack1',
  label: 'Snack'
}, {
  key: 'lunch',
  label: 'Lunch'
}, {
  key: 'snack2',
  label: 'Snack'
}, {
  key: 'dinner',
  label: 'Dinner'
}, {
  key: 'snack3',
  label: 'Snack'
}];

export default function MealPlanner() {
  const isMobile = useIsMobile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), {
    weekStartsOn: 1
  }));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    mealType: MealType;
  } | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);

  // Fetch full recipe details when a meal is selected
  const {
    data: selectedRecipeDetails
  } = useRecipe(selectedMeal?.recipe_id);
  const {
    profile
  } = useProfile();
  const {
    data: mealPlans,
    isLoading: mealsLoading
  } = useMealPlans(weekStart);
  const {
    data: recipes
  } = useRecipes(recipeSearch);
  const addMealPlan = useAddMealPlan();
  const removeMealPlan = useRemoveMealPlan();
  const toggleConsumed = useToggleMealConsumed();
  const weekDays = getWeekDays(weekStart);

  // Scroll to today on mobile when week changes
  useEffect(() => {
    if (isMobile && scrollContainerRef.current) {
      const todayIndex = weekDays.findIndex(day => isToday(day));
      if (todayIndex !== -1) {
        const columnWidth = scrollContainerRef.current.scrollWidth / 7;
        const scrollPosition = Math.max(0, (todayIndex - 1) * columnWidth);
        scrollContainerRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }
  }, [weekStart, isMobile]);

  const getMealForSlot = (date: Date, mealType: MealType) => {
    return mealPlans?.find(plan => plan.plan_date === format(date, 'yyyy-MM-dd') && plan.meal_type === mealType);
  };

  const getDayNutrition = (date: Date) => {
    const dayMeals = mealPlans?.filter(plan => plan.plan_date === format(date, 'yyyy-MM-dd')) || [];
    return dayMeals.reduce((acc, plan) => {
      if (plan.recipe) {
        acc.calories += plan.recipe.calories * plan.servings;
        acc.protein += plan.recipe.protein * plan.servings;
        acc.carbs += plan.recipe.carbs * plan.servings;
        acc.fat += plan.recipe.fat * plan.servings;
      }
      return acc;
    }, {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });
  };

  const handleAddRecipe = async (recipe: Recipe) => {
    if (!selectedSlot) return;
    try {
      await addMealPlan.mutateAsync({
        recipeId: recipe.id,
        planDate: selectedSlot.date,
        mealType: selectedSlot.mealType
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
    setSelectedSlot({
      date,
      mealType
    });
    setShowAddDialog(true);
  };

  const handleMealClick = (meal: MealPlan) => {
    setSelectedMeal(meal);
  };

  const handleToggleConsumed = (e: React.MouseEvent, meal: MealPlan) => {
    e.stopPropagation();
    toggleConsumed.mutate({
      mealPlanId: meal.id,
      isConsumed: !meal.is_consumed
    });
  };

  const handleRemoveFromDetail = async () => {
    if (selectedMeal) {
      await handleRemoveMeal(selectedMeal.id);
      setSelectedMeal(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="Meal Planner" showSearch={false} />

      {/* Sticky Week Navigation - z-50 to not cover modals */}
      <div 
        className="sticky top-16 z-40 bg-background border-b"
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="w-10 h-10 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="flex-1 text-base font-semibold text-center whitespace-nowrap">
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </h2>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="w-10 h-10 shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Planner Content */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className={cn(
            "h-full overflow-x-auto overflow-y-auto",
            "snap-x snap-mandatory md:snap-none",
            "scroll-smooth"
          )}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex min-w-fit h-full">
            {/* Meal Type Labels - Sticky Left Column */}
            <div className="shrink-0 w-20 md:w-24 bg-background border-r border-[#E5E5E5] sticky left-0 z-10">
              {/* Header spacer */}
              <div className="h-16 md:h-20 border-b border-[#E5E5E5]" />
              
              {/* Meal type labels */}
              {mealTypes.map(mealType => (
                <div 
                  key={mealType.key} 
                  className="h-[120px] md:h-[130px] flex items-center justify-end pr-3 border-b border-[#E5E5E5]"
                >
                  <span className="text-xs md:text-sm font-medium text-muted-foreground text-right">
                    {mealType.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Days Container */}
            <div className={cn(
              "flex",
              isMobile ? "w-[calc((100vw-80px)*7/3)]" : "flex-1"
            )}>
              {weekDays.map(day => {
                const nutrition = getDayNutrition(day);
                const calorieGoal = profile?.daily_calories || 2000;
                const caloriePercent = Math.round(nutrition.calories / calorieGoal * 100);
                const isTodayDate = isToday(day);

                return (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                      "flex-1 min-w-0 snap-start",
                      // Today highlight
                      isTodayDate && "border-l-2 border-r-2 border-primary bg-primary/5"
                    )}
                  >
                    {/* Day Header */}
                    <div className={cn(
                      "h-16 md:h-20 flex flex-col items-center justify-center border-b px-1",
                      isTodayDate && "border-b-primary"
                    )}>
                      <p className={cn(
                        "text-xs md:text-sm text-foreground",
                        isTodayDate ? "font-bold" : "font-medium"
                      )}>
                        {format(day, 'EEE')}
                      </p>
                      <p className={cn(
                        "text-xs text-muted-foreground",
                        isTodayDate && "font-semibold text-foreground"
                      )}>
                        {format(day, 'MMM d')}
                      </p>
                      <div className="mt-0.5 flex items-center justify-center gap-0.5">
                        <Flame className="w-3 h-3 text-calories" />
                        <span className={cn(
                          "text-xs font-medium",
                          caloriePercent >= 90 && caloriePercent <= 110 
                            ? "text-primary" 
                            : "text-muted-foreground"
                        )}>
                          {nutrition.calories}
                        </span>
                      </div>
                    </div>

                    {/* Meal Slots */}
                    {mealsLoading ? (
                      mealTypes.map((_, i) => (
                        <div key={i} className="h-[120px] md:h-[130px] p-1 border-b">
                          <Skeleton className="h-full w-full rounded-lg" />
                        </div>
                      ))
                    ) : (
                      mealTypes.map(mealType => {
                        const meal = getMealForSlot(day, mealType.key);
                        
                        return (
                          <div 
                            key={mealType.key} 
                            className="h-[120px] md:h-[130px] p-1 border-b"
                          >
                            <Card 
                              className={cn(
                                "h-full cursor-pointer transition-all border",
                                meal 
                                  ? meal.is_consumed 
                                    ? "bg-primary/10 border-primary/30" 
                                    : "bg-background border-border hover:shadow-md"
                                  : "bg-background border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
                              )} 
                              onClick={() => !meal && openAddDialog(day, mealType.key)}
                            >
                              <CardContent className="p-1.5 md:p-2 h-full">
                                {meal ? (
                                  <div 
                                    className="relative h-full group cursor-pointer" 
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleMealClick(meal);
                                    }}
                                  >
                                    {/* Consumption toggle checkbox */}
                                    <div 
                                      onClick={e => handleToggleConsumed(e, meal)} 
                                      className="absolute top-0 left-0 z-10 p-0.5"
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
                                      className="absolute -top-0.5 -right-0.5 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 hover:bg-destructive hover:text-destructive-foreground" 
                                      onClick={e => {
                                        e.stopPropagation();
                                        handleRemoveMeal(meal.id);
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                    
                                    {/* Image */}
                                    <img 
                                      src={meal.recipe?.image_url} 
                                      alt={meal.recipe?.name} 
                                      className={cn(
                                        "w-full h-12 md:h-14 object-cover rounded mb-1 transition-opacity",
                                        meal.is_consumed && "opacity-60"
                                      )} 
                                    />
                                    
                                    {/* Name */}
                                    <p className={cn(
                                      "text-xs font-medium line-clamp-2 transition-colors leading-tight",
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
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Recipe Dialog/Drawer */}
      {isMobile ? (
        <Drawer open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DrawerContent className="h-[100dvh] max-h-[100dvh] flex flex-col">
            {/* Header */}
            <DrawerHeader className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <DrawerTitle className="text-lg font-semibold">
                Add {selectedSlot && mealTypes.find(m => m.key === selectedSlot.mealType)?.label}
              </DrawerTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowAddDialog(false)}
                className="w-8 h-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </DrawerHeader>
            
            {/* Search bar */}
            <div className="px-4 py-3 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search recipes..." 
                  value={recipeSearch} 
                  onChange={e => setRecipeSearch(e.target.value)} 
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedSlot && format(selectedSlot.date, 'EEEE, MMM d')}
              </p>
            </div>
            
            {/* Grouped recipes list */}
            <ScrollArea className="flex-1">
              <div className="px-4 py-2">
                {(() => {
                  const grouped = groupRecipesByMealType(recipes);
                  const sections = [
                    { key: 'breakfast', label: 'Breakfast', items: grouped.breakfast },
                    { key: 'lunch', label: 'Lunch', items: grouped.lunch },
                    { key: 'dinner', label: 'Dinner', items: grouped.dinner },
                    { key: 'other', label: 'Other', items: grouped.other },
                  ];
                  
                  return sections.map(section => section.items.length > 0 && (
                    <div key={section.key} className="mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                        {section.label}
                      </h3>
                      <div className="space-y-2">
                        {section.items.map(recipe => (
                          <div 
                            key={recipe.id} 
                            className="flex gap-3 p-2 rounded-lg active:bg-secondary cursor-pointer border border-[#E5E5E5]" 
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
                    </div>
                  ));
                })()}
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Add {selectedSlot && mealTypes.find(m => m.key === selectedSlot.mealType)?.label} for{' '}
                {selectedSlot && format(selectedSlot.date, 'EEEE, MMM d')}
              </DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="text" 
                placeholder="Search recipes..." 
                value={recipeSearch} 
                onChange={e => setRecipeSearch(e.target.value)} 
                className="pl-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mt-4">
              {recipes?.map(recipe => (
                <div 
                  key={recipe.id} 
                  className="flex gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer border border-[#E5E5E5] hover:border-border" 
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
      )}

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog 
        recipe={selectedRecipeDetails || null} 
        open={!!selectedMeal} 
        onOpenChange={open => !open && setSelectedMeal(null)} 
        onRemoveFromPlan={handleRemoveFromDetail} 
        showRemoveButton={true} 
      />
    </div>
  );
}
