import { Link } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import { Plus, Flame, ArrowRight, Clock } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NutritionRing } from '@/components/nutrition/NutritionDisplay';
import { useProfile } from '@/hooks/useProfile';
import { useMealPlans, MealType } from '@/hooks/useMealPlans';
import { useRecipes } from '@/hooks/useRecipes';
import { Skeleton } from '@/components/ui/skeleton';

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  snack1: 'Morning Snack',
  lunch: 'Lunch',
  snack2: 'Afternoon Snack',
  dinner: 'Dinner',
  snack3: 'Evening Snack',
};

export default function Dashboard() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: mealPlans, isLoading: mealsLoading } = useMealPlans();
  const { data: recipes, isLoading: recipesLoading } = useRecipes();

  // Calculate today's nutrition
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

  const isLoading = profileLoading || mealsLoading || recipesLoading;

  return (
    <>
      <AppHeader title="Dashboard" showSearch={false} />
      
      <div className="flex-1 p-4 lg:p-6 space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Good {getTimeOfDay()}, {profile?.full_name || 'there'}! 👋
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Button asChild>
            <Link to="/meal-planner">
              <Plus className="w-4 h-4 mr-2" />
              Plan Meals
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Nutrition */}
          <Card className="lg:col-span-2 card-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Today's Nutrition</CardTitle>
                <Link to="/nutrition" className="text-sm text-primary hover:underline flex items-center gap-1">
                  View details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-around">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="w-24 h-32 rounded-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap justify-around gap-4">
                  <NutritionRing
                    value={todayNutrition.calories}
                    max={profile?.daily_calories || 2000}
                    color="hsl(var(--calories))"
                    label="Calories"
                    unit="kcal"
                  />
                  <NutritionRing
                    value={todayNutrition.protein}
                    max={profile?.protein_goal || 150}
                    color="hsl(var(--protein))"
                    label="Protein"
                  />
                  <NutritionRing
                    value={todayNutrition.carbs}
                    max={profile?.carbs_goal || 200}
                    color="hsl(var(--carbs))"
                    label="Carbs"
                  />
                  <NutritionRing
                    value={todayNutrition.fat}
                    max={profile?.fat_goal || 65}
                    color="hsl(var(--fat))"
                    label="Fat"
                  />
                  <NutritionRing
                    value={todayNutrition.fiber}
                    max={profile?.fiber_goal || 30}
                    color="hsl(var(--fiber))"
                    label="Fiber"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="card-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-muted-foreground">Meals Planned</span>
                <span className="text-xl font-semibold text-foreground">
                  {mealPlans?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-muted-foreground">Recipes Available</span>
                <span className="text-xl font-semibold text-foreground">
                  {recipes?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-muted-foreground">Today's Meals</span>
                <span className="text-xl font-semibold text-foreground">
                  {todaysMeals.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Meals */}
        <Card className="card-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Today's Meals</CardTitle>
              <Link to="/meal-planner" className="text-sm text-primary hover:underline flex items-center gap-1">
                View planner
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : todaysMeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No meals planned for today</p>
                <Button asChild variant="outline">
                  <Link to="/meal-planner">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Meals
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {todaysMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex gap-3 p-3 bg-secondary rounded-lg"
                  >
                    <img
                      src={meal.recipe?.image_url}
                      alt={meal.recipe?.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary font-medium uppercase">
                        {mealTypeLabels[meal.meal_type]}
                      </p>
                      <p className="font-medium text-foreground truncate">
                        {meal.recipe?.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {meal.recipe?.calories} cal
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meal.recipe?.prep_time} min
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Recipes */}
        <Card className="card-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Quick Recipe Ideas</CardTitle>
              <Link to="/recipes" className="text-sm text-primary hover:underline flex items-center gap-1">
                Browse all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recipes?.slice(0, 4).map((recipe) => (
                  <Link
                    key={recipe.id}
                    to="/recipes"
                    className="group relative overflow-hidden rounded-lg aspect-[4/3]"
                  >
                    <img
                      src={recipe.image_url}
                      alt={recipe.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-medium text-white text-sm">{recipe.name}</p>
                      <p className="text-white/80 text-xs">
                        {recipe.calories} cal • {recipe.prep_time + recipe.cook_time} min
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
