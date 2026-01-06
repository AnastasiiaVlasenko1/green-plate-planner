import { useMemo } from 'react';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';
import { MealPlan } from '@/hooks/useMealPlans';

interface WeeklyTrendChartProps {
  mealPlans: MealPlan[];
  calorieGoal: number;
  streak?: number;
}

export function WeeklyTrendChart({ mealPlans, calorieGoal, streak = 0 }: WeeklyTrendChartProps) {
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dayMeals = mealPlans?.filter((plan) => 
        isSameDay(new Date(plan.plan_date), date)
      ) || [];
      
      const calories = dayMeals.reduce((acc, plan) => {
        if (plan.recipe) {
          return acc + (plan.recipe.calories * plan.servings);
        }
        return acc;
      }, 0);

      return {
        date: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        calories,
        goal: calorieGoal,
      };
    });
    return days;
  }, [mealPlans, calorieGoal]);

  const maxCalories = Math.max(...chartData.map(d => d.calories), calorieGoal);
  const yAxisMax = Math.ceil(maxCalories / 500) * 500 + 200;

  return (
    <Card className="card-shadow h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Weekly Trend
          </CardTitle>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{streak} day streak</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={[0, yAxisMax]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                        <p className="text-sm font-medium text-foreground">{data.fullDate}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.calories} / {data.goal} kcal
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine 
                y={calorieGoal} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="hsl(var(--calories))"
                strokeWidth={2.5}
                dot={{ fill: 'hsl(var(--calories))', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: 'hsl(var(--calories))', strokeWidth: 0, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[hsl(var(--calories))] rounded" />
            <span>Calories</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 border-t-2 border-dashed border-primary" />
            <span>Goal ({calorieGoal})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
