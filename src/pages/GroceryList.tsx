import { useState } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, RefreshCw, Check, ShoppingCart } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useGroceryList, useToggleGroceryItem, useGenerateGroceryList } from '@/hooks/useGroceryList';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categoryOrder = ['Produce', 'Proteins', 'Dairy', 'Grains', 'Pantry', 'Other'];

export default function GroceryList() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: groceryItems, isLoading } = useGroceryList(weekStart);
  const toggleItem = useToggleGroceryItem();
  const generateList = useGenerateGroceryList();

  // Group items by category
  const itemsByCategory = groceryItems?.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof groceryItems>) || {};

  // Sort categories
  const sortedCategories = Object.keys(itemsByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const handleToggle = async (id: string, isChecked: boolean) => {
    try {
      await toggleItem.mutateAsync({ id, isChecked: !isChecked });
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleGenerate = async () => {
    try {
      await generateList.mutateAsync(weekStart);
      toast.success('Grocery list generated from your meal plan!');
    } catch (error) {
      toast.error('Failed to generate grocery list');
    }
  };

  const checkedCount = groceryItems?.filter((item) => item.is_checked).length || 0;
  const totalCount = groceryItems?.length || 0;

  return (
    <>
      <AppHeader title="Grocery List" showSearch={false} />

      <div className="flex-1 p-4 lg:p-6 space-y-6 animate-fade-in">
        {/* Week Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d')}
            </h2>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleGenerate} disabled={generateList.isPending}>
            <RefreshCw className={cn("w-4 h-4 mr-2", generateList.isPending && "animate-spin")} />
            Generate from Meal Plan
          </Button>
        </div>

        {/* Progress */}
        {totalCount > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(checkedCount / totalCount) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {checkedCount} / {totalCount} items
            </span>
          </div>
        )}

        {/* Grocery List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="card-shadow">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-10" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : totalCount === 0 ? (
          <Card className="card-shadow">
            <CardContent className="py-12 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Grocery Items</h3>
              <p className="text-muted-foreground mb-4">
                Add meals to your planner, then generate your grocery list
              </p>
              <Button onClick={handleGenerate} disabled={generateList.isPending}>
                <RefreshCw className={cn("w-4 h-4 mr-2", generateList.isPending && "animate-spin")} />
                Generate from Meal Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map((category) => (
              <Card key={category} className="card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {category}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({itemsByCategory[category]?.length || 0})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {itemsByCategory[category]?.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer",
                          item.is_checked && "opacity-60"
                        )}
                        onClick={() => handleToggle(item.id, item.is_checked)}
                      >
                        <Checkbox
                          checked={item.is_checked}
                          className="pointer-events-none"
                        />
                        <span className={cn(
                          "flex-1",
                          item.is_checked && "line-through text-muted-foreground"
                        )}>
                          {item.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
