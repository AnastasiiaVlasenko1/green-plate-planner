import { Link } from 'react-router-dom';
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NutritionRing } from '@/components/nutrition/NutritionDisplay';
import { useProfile } from '@/hooks/useProfile';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useRecipes } from '@/hooks/useRecipes';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SmartInsightsBar,
  WeeklyTrendChart,
  TodaysMealsCard,
  TomorrowsPlanCard,
  QuickRecipesCarousel,
  RecommendedRecipesCard,
} from '@/components/dashboard';

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

  const goals = {
    calories: profile?.daily_calories || 2000,
    protein: profile?.protein_goal || 150,
    carbs: profile?.carbs_goal || 200,
    fat: profile?.fat_goal || 65,
    fiber: profile?.fiber_goal || 30,
  };

  // Generate smart insight based on current progress
  const getSmartInsight = () => {
    const caloriePercent = (todayNutrition.calories / goals.calories) * 100;
    const proteinPercent = (todayNutrition.protein / goals.protein) * 100;
    
    if (todaysMeals.length === 0) {
      return "Start your day right! Plan your meals to stay on track with your nutrition goals.";
    }
    if (proteinPercent < 30 && caloriePercent > 40) {
      return "💡 Tip: Your protein intake is low compared to calories. Consider adding lean proteins to your next meal.";
    }
    if (caloriePercent >= 100) {
      return "✅ You've reached your calorie goal for today! Focus on nutrient-dense foods if eating more.";
    }
    if (caloriePercent >= 70) {
      return `🎯 Great progress! You're ${Math.round(caloriePercent)}% toward your daily calorie goal.`;
    }
    return "🌱 Keep going! A balanced mix of proteins, carbs, and healthy fats will fuel your day.";
  };

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

        {/* Smart Insights Bar */}
        {!isLoading && (
          <SmartInsightsBar
            todayNutrition={todayNutrition}
            goals={goals}
            mealsPlanned={todaysMeals.length}
            streak={3} // TODO: Calculate actual streak from data
          />
        )}

        {/* Today's Overview - Nutrition Rings */}
        <Card className="card-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Today's Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-around flex-wrap gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="w-24 h-32 rounded-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap justify-around gap-4 md:gap-6">
                  <NutritionRing
                    value={todayNutrition.calories}
                    max={goals.calories}
                    color="hsl(var(--calories))"
                    label="Calories"
                    unit="kcal"
                    size="lg"
                  />
                  <NutritionRing
                    value={todayNutrition.protein}
                    max={goals.protein}
                    color="hsl(var(--protein))"
                    label="Protein"
                    size="lg"
                  />
                  <NutritionRing
                    value={todayNutrition.carbs}
                    max={goals.carbs}
                    color="hsl(var(--carbs))"
                    label="Carbs"
                    size="lg"
                  />
                  <NutritionRing
                    value={todayNutrition.fat}
                    max={goals.fat}
                    color="hsl(var(--fat))"
                    label="Fat"
                    size="lg"
                  />
                  <NutritionRing
                    value={todayNutrition.fiber}
                    max={goals.fiber}
                    color="hsl(var(--fiber))"
                    label="Fiber"
                    size="lg"
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-6 max-w-xl mx-auto">
                  {getSmartInsight()}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Middle Section - Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Today's Meals */}
          <TodaysMealsCard meals={todaysMeals} isLoading={isLoading} />
          
          {/* Right Column - Weekly Trend */}
          <WeeklyTrendChart
            mealPlans={mealPlans || []}
            calorieGoal={goals.calories}
            streak={3} // TODO: Calculate actual streak
          />
        </div>

        {/* Bottom Section - Action Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* AI Recommendations */}
          <RecommendedRecipesCard />
          
          {/* Quick Recipe Ideas Carousel */}
          <QuickRecipesCarousel recipes={recipes || []} isLoading={isLoading} />
          
          {/* Tomorrow's Plan Preview */}
          <TomorrowsPlanCard mealPlans={mealPlans || []} isLoading={isLoading} />
        </div>
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
