import { useMemo, useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, ShoppingCart, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartInsightsBarProps {
  todayNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  mealsPlanned: number;
  streak?: number;
}

interface Insight {
  icon: typeof Lightbulb;
  message: string;
  type: 'tip' | 'achievement' | 'alert' | 'info';
}

export function SmartInsightsBar({ todayNutrition, goals, mealsPlanned, streak = 0 }: SmartInsightsBarProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [];

    // Nutritional gap insights
    const proteinPercent = (todayNutrition.protein / goals.protein) * 100;
    const fiberPercent = (todayNutrition.fiber / goals.fiber) * 100;
    const caloriesPercent = (todayNutrition.calories / goals.calories) * 100;

    if (proteinPercent < 50) {
      list.push({
        icon: Lightbulb,
        message: `You're at ${Math.round(proteinPercent)}% of your protein goal. Consider adding eggs, chicken, or Greek yogurt to your next meal.`,
        type: 'tip',
      });
    }

    if (fiberPercent < 40) {
      list.push({
        icon: Lightbulb,
        message: `Boost your fiber intake! Add some vegetables, fruits, or whole grains to hit your ${goals.fiber}g goal.`,
        type: 'tip',
      });
    }

    if (caloriesPercent > 90 && caloriesPercent < 100) {
      list.push({
        icon: TrendingUp,
        message: `Almost there! You're ${goals.calories - todayNutrition.calories} calories away from your daily target.`,
        type: 'info',
      });
    }

    // Achievement insights
    if (streak >= 7) {
      list.push({
        icon: Trophy,
        message: `Amazing! You're on a ${streak}-day streak of hitting your nutrition goals! 🔥`,
        type: 'achievement',
      });
    } else if (streak >= 3) {
      list.push({
        icon: Trophy,
        message: `Great progress! ${streak} days in a row of healthy eating. Keep it going!`,
        type: 'achievement',
      });
    }

    // Planning alerts
    if (mealsPlanned === 0) {
      list.push({
        icon: ShoppingCart,
        message: `No meals planned for today yet. Head to the meal planner to set up your day!`,
        type: 'alert',
      });
    }

    // Default insight if none
    if (list.length === 0) {
      list.push({
        icon: Lightbulb,
        message: `Stay hydrated! Aim for 8 glasses of water today alongside your nutritious meals.`,
        type: 'tip',
      });
    }

    return list;
  }, [todayNutrition, goals, mealsPlanned, streak]);

  // Auto-rotate insights
  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [insights.length]);

  const currentInsight = insights[currentIndex];
  const Icon = currentInsight.icon;

  const typeStyles = {
    tip: 'bg-primary/10 border-primary/20 text-primary',
    achievement: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    alert: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  };

  const iconStyles = {
    tip: 'text-primary',
    achievement: 'text-amber-500',
    alert: 'text-orange-500',
    info: 'text-blue-500',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-xl border transition-all',
      typeStyles[currentInsight.type]
    )}>
      <div className={cn('p-2 rounded-lg bg-background/50', iconStyles[currentInsight.type])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="flex-1 text-sm font-medium text-foreground">
        {currentInsight.message}
      </p>
      {insights.length > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length)}
            className="p-1 rounded hover:bg-background/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground min-w-[40px] text-center">
            {currentIndex + 1}/{insights.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % insights.length)}
            className="p-1 rounded hover:bg-background/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
