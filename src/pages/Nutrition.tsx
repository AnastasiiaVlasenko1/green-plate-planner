import { useState } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NutritionRing, NutritionBar } from '@/components/nutrition/NutritionDisplay';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Nutrition() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const { profile, isLoading: profileLoading } = useProfile();
  const { data: mealPlans, isLoading: mealsLoading } = useMealPlans(weekStart);

  const isLoading = profileLoading || mealsLoading;

  // Calculate daily nutrition for each day of the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const dailyNutrition = weekDays.map((day) => {
    const dayMeals = mealPlans?.filter(
      (plan) => plan.plan_date === format(day, 'yyyy-MM-dd')
    ) || [];

    return {
      date: day,
      ...dayMeals.reduce(
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
      ),
    };
  });

  // Calculate weekly totals
  const weeklyTotals = dailyNutrition.reduce(
    (acc, day) => {
      acc.calories += day.calories;
      acc.protein += day.protein;
      acc.carbs += day.carbs;
      acc.fat += day.fat;
      acc.fiber += day.fiber;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const weeklyGoals = {
    calories: (profile?.daily_calories || 2000) * 7,
    protein: (profile?.protein_goal || 150) * 7,
    carbs: (profile?.carbs_goal || 200) * 7,
    fat: (profile?.fat_goal || 65) * 7,
    fiber: (profile?.fiber_goal || 30) * 7,
  };

  // Today's nutrition
  const todayNutrition = dailyNutrition.find((d) => isToday(d.date)) || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  return (
    <>
      <AppHeader title="Nutrition" showSearch={false} />

      <div className="flex-1 p-4 lg:p-6 space-y-6 animate-fade-in">
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Progress */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Today's Progress</CardTitle>
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
                    size="lg"
                  />
                  <NutritionRing
                    value={todayNutrition.protein}
                    max={profile?.protein_goal || 150}
                    color="hsl(var(--protein))"
                    label="Protein"
                    size="lg"
                  />
                  <NutritionRing
                    value={todayNutrition.carbs}
                    max={profile?.carbs_goal || 200}
                    color="hsl(var(--carbs))"
                    label="Carbs"
                    size="lg"
                  />
                  <NutritionRing
                    value={todayNutrition.fat}
                    max={profile?.fat_goal || 65}
                    color="hsl(var(--fat))"
                    label="Fat"
                    size="lg"
                  />
                  <NutritionRing
                    value={todayNutrition.fiber}
                    max={profile?.fiber_goal || 30}
                    color="hsl(var(--fiber))"
                    label="Fiber"
                    size="lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))
              ) : (
                <>
                  <NutritionBar
                    value={weeklyTotals.calories}
                    max={weeklyGoals.calories}
                    color="hsl(var(--calories))"
                    label="Calories"
                    unit="kcal"
                  />
                  <NutritionBar
                    value={weeklyTotals.protein}
                    max={weeklyGoals.protein}
                    color="hsl(var(--protein))"
                    label="Protein"
                  />
                  <NutritionBar
                    value={weeklyTotals.carbs}
                    max={weeklyGoals.carbs}
                    color="hsl(var(--carbs))"
                    label="Carbs"
                  />
                  <NutritionBar
                    value={weeklyTotals.fat}
                    max={weeklyGoals.fat}
                    color="hsl(var(--fat))"
                    label="Fat"
                  />
                  <NutritionBar
                    value={weeklyTotals.fiber}
                    max={weeklyGoals.fiber}
                    color="hsl(var(--fiber))"
                    label="Fiber"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Breakdown */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {dailyNutrition.map((day) => {
                  const calorieGoal = profile?.daily_calories || 2000;
                  const percentage = Math.round((day.calories / calorieGoal) * 100);

                  return (
                    <div
                      key={day.date.toISOString()}
                      className={cn(
                        "p-3 rounded-lg text-center",
                        isToday(day.date) ? "bg-primary/10 ring-2 ring-primary" : "bg-secondary"
                      )}
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {format(day.date, 'EEE')}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {format(day.date, 'd')}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className={cn(
                          "text-lg font-bold",
                          percentage >= 90 && percentage <= 110 ? "text-primary" : 
                          percentage > 110 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {day.calories}
                        </p>
                        <p className="text-xs text-muted-foreground">kcal</p>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>P: {day.protein}g</p>
                          <p>C: {day.carbs}g</p>
                          <p>F: {day.fat}g</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
