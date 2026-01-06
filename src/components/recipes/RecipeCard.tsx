import { Clock, Flame, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recipe } from '@/hooks/useRecipes';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  onAddToPlanner?: (recipe: Recipe) => void;
  onClick?: () => void;
  compact?: boolean;
}

export function RecipeCard({ recipe, onAddToPlanner, onClick, compact = false }: RecipeCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden card-shadow hover:card-shadow-hover transition-shadow cursor-pointer group",
        compact ? "h-auto" : "h-full"
      )}
      onClick={onClick}
    >
      <div className={cn("relative overflow-hidden", compact ? "h-32" : "h-48")}>
        <img
          src={recipe.image_url}
          alt={recipe.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {onAddToPlanner && (
          <Button
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlanner(recipe);
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <h3 className={cn("font-semibold text-foreground mb-2", compact ? "text-sm" : "text-base")}>
          {recipe.name}
        </h3>
        
        {!compact && recipe.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.prep_time + recipe.cook_time} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-calories" />
            <span>{recipe.calories} cal</span>
          </div>
        </div>

        {!compact && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
