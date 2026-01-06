import { Link } from 'react-router-dom';
import { format, addDays, isSameDay } from 'date-fns';
import { Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MealPlan } from '@/hooks/useMealPlans';

interface TomorrowsPlanCardProps {
  mealPlans: MealPlan[];
  isLoading?: boolean;
}

export function TomorrowsPlanCard({ mealPlans, isLoading }: TomorrowsPlanCardProps) {
  const tomorrow = addDays(new Date(), 1);
  const tomorrowsMeals = mealPlans?.filter((plan) =>
    isSameDay(new Date(plan.plan_date), tomorrow)
  ) || [];

  const tomorrowNutrition = tomorrowsMeals.reduce(
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

  if (isLoading) {
    return (
      <Card className="card-shadow h-full flex flex-col">
        <CardContent className="p-6 flex-1">
          <div className="h-24 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Tomorrow's Plan
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(tomorrow, 'EEEE, MMM d')}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {tomorrowsMeals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-3">
              No meals planned for tomorrow yet
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/meal-planner">
                Plan Tomorrow
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {tomorrowsMeals.length} meal{tomorrowsMeals.length !== 1 ? 's' : ''} planned
              </span>
              <Link to="/meal-planner" className="text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                <p className="text-lg font-bold text-orange-500">
                  {tomorrowNutrition.calories}
                </p>
                <p className="text-xs text-muted-foreground">Calories</p>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                <p className="text-lg font-bold text-blue-500">
                  {tomorrowNutrition.protein}g
                </p>
                <p className="text-xs text-muted-foreground">Protein</p>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-lg font-bold text-yellow-500">
                  {tomorrowNutrition.carbs}g
                </p>
                <p className="text-xs text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center p-3 bg-pink-500/10 rounded-lg">
                <p className="text-lg font-bold text-pink-500">
                  {tomorrowNutrition.fat}g
                </p>
                <p className="text-xs text-muted-foreground">Fat</p>
              </div>
            </div>

            {/* Mini meal preview */}
            <div className="flex -space-x-2">
              {tomorrowsMeals.slice(0, 4).map((meal) => (
                <img
                  key={meal.id}
                  src={meal.recipe?.image_url}
                  alt={meal.recipe?.name}
                  className="w-10 h-10 rounded-full border-2 border-background object-cover"
                  title={meal.recipe?.name}
                />
              ))}
              {tomorrowsMeals.length > 4 && (
                <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{tomorrowsMeals.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
