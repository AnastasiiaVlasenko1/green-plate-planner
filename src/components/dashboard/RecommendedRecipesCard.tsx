import { useState } from 'react';
import { Sparkles, RefreshCw, ChefHat, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecipeRecommendations, RecipeRecommendation } from '@/hooks/useRecipeRecommendations';
import { useQueryClient } from '@tanstack/react-query';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { Recipe } from '@/hooks/useRecipes';
export function RecommendedRecipesCard() {
  const {
    data: recommendations,
    isLoading,
    error,
    isFetching
  } = useRecipeRecommendations();
  const queryClient = useQueryClient();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const handleRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ['recipe-recommendations']
    });
  };
  if (error) {
    return <Card className="card-shadow h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Unable to load recommendations.</p>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <>
      <Card className="card-shadow h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-[16px]">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isFetching} className="h-8 w-8">
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Personalized picks based on your nutritional gaps
          </p>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          {isLoading ? <>
              {[...Array(3)].map((_, i) => <div key={i} className="flex gap-3 p-3 rounded-lg border">
                  <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>)}
            </> : recommendations && recommendations.length > 0 ? recommendations.map(rec => <RecommendationItem key={rec.recipe.id} recommendation={rec} onClick={() => setSelectedRecipe(rec.recipe)} />) : <div className="text-center py-6">
              <ChefHat className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Add some recipes to get personalized recommendations!
              </p>
            </div>}
        </CardContent>
      </Card>

      <RecipeDetailDialog recipe={selectedRecipe} open={!!selectedRecipe} onOpenChange={open => !open && setSelectedRecipe(null)} />
    </>;
}
interface RecommendationItemProps {
  recommendation: RecipeRecommendation;
  onClick: () => void;
}

// Parse nutrition highlight string into individual nutrient items
function parseNutritionHighlight(highlight: string): string[] {
  if (!highlight) return [];
  
  // Remove buzz words and common patterns
  let cleaned = highlight
    // Remove leading buzz words
    .replace(/^(very |extremely |excellent |good |great |high |low |rich )+/gi, '')
    // Remove "high in", "rich in", "source of" patterns
    .replace(/(high in|rich in|source of|packed with|loaded with)\s*/gi, '')
    // Remove trailing "source", "rich", "content"
    .replace(/\s*(source|rich|content)$/gi, '')
    // Handle "X source" pattern → just X
    .replace(/(\w+)\s+source/gi, '$1');
  
  // Split by comma or "and"
  return cleaned
    .split(/,\s*|\s+and\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function RecommendationItem({
  recommendation,
  onClick
}: RecommendationItemProps) {
  const {
    recipe,
    reason,
    nutrition_highlight
  } = recommendation;
  
  const nutrients = parseNutritionHighlight(nutrition_highlight).slice(0, 3);
  
  return (
    <button 
      onClick={onClick} 
      className="w-full flex gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/30 transition-all text-left group"
    >
      <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
        <img 
          src={recipe.image_url} 
          alt={recipe.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {recipe.name}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {reason}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {nutrients.map((nutrient, i) => (
            <Badge 
              key={i} 
              variant="secondary" 
              className="text-xs whitespace-nowrap capitalize max-w-[100px] truncate"
              title={nutrient}
            >
              {nutrient}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Plus className="w-4 h-4 text-primary" />
      </div>
    </button>
  );
}