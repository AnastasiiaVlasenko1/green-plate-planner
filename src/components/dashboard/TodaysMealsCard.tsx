import { Link } from 'react-router-dom';
import { Check, Clock, Flame, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { MealPlan, MealType } from '@/hooks/useMealPlans';
import { useState } from 'react';

const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  snack1: 'Morning Snack',
  lunch: 'Lunch',
  snack2: 'Afternoon Snack',
  dinner: 'Dinner',
  snack3: 'Evening Snack',
};

const mealTypeTimes: Record<MealType, string> = {
  breakfast: '7:00 AM',
  snack1: '10:00 AM',
  lunch: '12:30 PM',
  snack2: '3:30 PM',
  dinner: '7:00 PM',
  snack3: '9:00 PM',
};

interface TodaysMealsCardProps {
  meals: MealPlan[];
  isLoading?: boolean;
}

export function TodaysMealsCard({ meals, isLoading }: TodaysMealsCardProps) {
  const [checkedMeals, setCheckedMeals] = useState<Set<string>>(new Set());

  const toggleMeal = (mealId: string) => {
    setCheckedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }
      return next;
    });
  };

  const sortedMeals = [...meals].sort((a, b) => {
    const order: MealType[] = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3'];
    return order.indexOf(a.meal_type) - order.indexOf(b.meal_type);
  });

  const consumedCalories = sortedMeals
    .filter((meal) => checkedMeals.has(meal.id))
    .reduce((acc, meal) => acc + (meal.recipe?.calories || 0) * meal.servings, 0);

  const totalCalories = sortedMeals.reduce(
    (acc, meal) => acc + (meal.recipe?.calories || 0) * meal.servings,
    0
  );

  if (isLoading) {
    return (
      <Card className="card-shadow h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today's Meals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Meals</CardTitle>
          <Link to="/meal-planner" className="text-sm text-primary hover:underline flex items-center gap-1">
            Planner
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {sortedMeals.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {consumedCalories} / {totalCalories} kcal consumed
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {sortedMeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <p className="text-muted-foreground mb-4">No meals planned for today</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/meal-planner">Add Meals</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMeals.map((meal) => {
              const isChecked = checkedMeals.has(meal.id);
              return (
                <div
                  key={meal.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer',
                    isChecked ? 'bg-primary/5 border border-primary/20' : 'bg-secondary hover:bg-secondary/80'
                  )}
                  onClick={() => toggleMeal(meal.id)}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleMeal(meal.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <img
                    src={meal.recipe?.image_url}
                    alt={meal.recipe?.name}
                    className={cn(
                      'w-12 h-12 rounded-lg object-cover transition-opacity',
                      isChecked && 'opacity-60'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">
                        {mealTypeLabels[meal.meal_type]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {mealTypeTimes[meal.meal_type]}
                      </span>
                    </div>
                    <p className={cn(
                      'font-medium text-sm truncate',
                      isChecked && 'line-through text-muted-foreground'
                    )}>
                      {meal.recipe?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    <Flame className="w-3.5 h-3.5" />
                    {meal.recipe?.calories}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
