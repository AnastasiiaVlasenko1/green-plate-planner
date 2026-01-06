import { Clock, Users, Flame, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Recipe } from '@/hooks/useRecipes';

interface RecipeDetailDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToPlan?: () => void;
  onRemoveFromPlan?: () => void;
  showRemoveButton?: boolean;
}

export function RecipeDetailDialog({
  recipe,
  open,
  onOpenChange,
  onAddToPlan,
  onRemoveFromPlan,
  showRemoveButton = false,
}: RecipeDetailDialogProps) {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Hero Image */}
        <div className="relative h-56 w-full">
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden px-6 pb-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
          </DialogHeader>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 py-3 text-sm border-b border-border">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Prep: {recipe.prep_time}m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Cook: {recipe.cook_time}m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{recipe.servings} servings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-calories" />
              <span className="text-calories font-medium">{recipe.calories} cal</span>
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="grid grid-cols-4 gap-4 py-3 border-b border-border">
            <div className="text-center">
              <p className="text-lg font-bold text-protein">{recipe.protein}g</p>
              <p className="text-xs text-muted-foreground">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-carbs">{recipe.carbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-fat">{recipe.fat}g</p>
              <p className="text-xs text-muted-foreground">Fat</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-fiber">{recipe.fiber}g</p>
              <p className="text-xs text-muted-foreground">Fiber</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="ingredients" className="flex-1 flex flex-col overflow-hidden mt-4">
            <TabsList className="bg-transparent h-auto p-0 justify-start gap-6 border-b border-border">
              <TabsTrigger 
                value="ingredients" 
                className="bg-transparent rounded-none px-0 pb-2 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium -mb-px"
              >
                Ingredients
              </TabsTrigger>
              <TabsTrigger 
                value="instructions"
                className="bg-transparent rounded-none px-0 pb-2 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium -mb-px"
              >
                Instructions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ingredients" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[200px]">
                <ul className="space-y-2 pr-4">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="min-w-[5rem] flex-shrink-0 text-muted-foreground font-medium">
                        {ing.amount || (ing as any).quantity}
                      </span>
                      <span className="text-foreground">{ing.name}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="instructions" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[200px]">
                {recipe.instructions && recipe.instructions.length > 0 ? (
                  <ol className="space-y-4 pr-4">
                    {recipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <p className="text-sm text-foreground pt-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No instructions available for this recipe.
                  </p>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border mt-4">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {onAddToPlan && (
              <Button className="flex-1" onClick={onAddToPlan}>
                Add to Meal Plan
              </Button>
            )}
            {showRemoveButton && onRemoveFromPlan && (
              <Button variant="destructive" onClick={onRemoveFromPlan}>
                Remove from Plan
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
