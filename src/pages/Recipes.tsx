import { useState } from 'react';
import { Search, Filter, Clock, Flame, Users } from 'lucide-react';
import { AppHeader } from '@/components/layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecipes, Recipe } from '@/hooks/useRecipes';
import { useAddMealPlan, MealType } from '@/hooks/useMealPlans';
import { toast } from 'sonner';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';

const tagFilters = [
  'breakfast',
  'lunch',
  'dinner',
  'vegetarian',
  'vegan',
  'high-protein',
  'gluten-free',
  'quick',
  'meal-prep',
];

const mealTypeOptions: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'snack1', label: 'Morning Snack' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack2', label: 'Afternoon Snack' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack3', label: 'Evening Snack' },
];

export default function Recipes() {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDate, setAddDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [addMealType, setAddMealType] = useState<MealType>('lunch');

  const { data: recipes, isLoading } = useRecipes(search, selectedTags.length > 0 ? selectedTags : undefined);
  const addMealPlan = useAddMealPlan();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddToPlanner = async () => {
    if (!selectedRecipe) return;

    try {
      await addMealPlan.mutateAsync({
        recipeId: selectedRecipe.id,
        planDate: new Date(addDate),
        mealType: addMealType,
      });
      toast.success(`Added ${selectedRecipe.name} to your meal plan!`);
      setShowAddDialog(false);
      setSelectedRecipe(null);
    } catch (error) {
      toast.error('Failed to add to meal plan');
    }
  };

  return (
    <>
      <AppHeader title="Recipes" showSearch={false} />

      <div className="flex-1 p-4 lg:p-6 space-y-6 animate-fade-in">
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tagFilters.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                className="cursor-pointer capitalize"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recipe Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : recipes?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No recipes found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes?.map((recipe) => (
              <Card
                key={recipe.id}
                className="overflow-hidden card-shadow hover:card-shadow-hover transition-shadow cursor-pointer group"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Button
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecipe(recipe);
                      setShowAddDialog(true);
                    }}
                  >
                    Add to Plan
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-2">{recipe.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {recipe.prep_time + recipe.cook_time}m
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-calories" />
                      {recipe.calories}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {recipe.servings}
                    </div>
                  </div>
                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs capitalize">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={!!selectedRecipe && !showAddDialog}
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
        onAddToPlan={() => setShowAddDialog(true)}
      />

      {/* Add to Planner Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Meal</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {mealTypeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={addMealType === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAddMealType(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleAddToPlanner}
              disabled={addMealPlan.isPending}
            >
              {addMealPlan.isPending ? 'Adding...' : 'Add to Plan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
