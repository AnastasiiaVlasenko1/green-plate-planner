import { useState, useRef } from 'react';
import { Clock, Users, Flame, RefreshCw, Upload, Pencil, Trash2, Globe, Lock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Recipe } from '@/hooks/useRecipes';
import { useGenerateRecipeImage } from '@/hooks/useGenerateRecipeImage';
import { useUploadRecipeImage } from '@/hooks/useUploadRecipeImage';
import { useUpdateRecipe } from '@/hooks/useUpdateRecipe';
import { useDeleteRecipe } from '@/hooks/useDeleteRecipe';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditRecipeDialog } from './EditRecipeDialog';
import { toast } from 'sonner';

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
  showRemoveButton = false
}: RecipeDetailDialogProps) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const generateImage = useGenerateRecipeImage();
  const uploadImage = useUploadRecipeImage();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isOwnRecipe = recipe && user && recipe.created_by === user.id;

  const handleRegenerateImage = async () => {
    if (!recipe) return;
    
    setIsGenerating(true);
    try {
      await generateImage.mutateAsync({
        recipeId: recipe.id,
        recipeName: recipe.name,
        ingredients: recipe.ingredients,
      });
      toast.success('Image regenerated successfully!');
    } catch (error) {
      toast.error('Failed to generate image. Please try again.');
      console.error('Image generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !recipe) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadImage.mutateAsync({ recipeId: recipe.id, file });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTogglePublic = async () => {
    if (!recipe) return;
    
    try {
      await updateRecipe.mutateAsync({
        id: recipe.id,
        is_public: !recipe.is_public,
      });
      toast.success(recipe.is_public ? 'Recipe is now private' : 'Recipe is now public');
    } catch (error) {
      toast.error('Failed to update recipe visibility');
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    
    try {
      await deleteRecipe.mutateAsync(recipe.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      // Error handled by the hook
    }
  };

  if (!recipe) return null;

  const recipeContent = (
    <>
      {/* Hero Image with Edit/Delete buttons */}
      <div className="relative h-48 md:h-56 w-full flex-shrink-0">
        <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        
        {/* Edit/Delete circular buttons - stacked vertically over image */}
        {isOwnRecipe && (
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="w-10 h-10 rounded-full shadow-lg"
              onClick={() => setShowEditDialog(true)}
            >
              <Pencil className="w-4 h-4" />
              <span className="sr-only">Edit recipe</span>
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="w-10 h-10 rounded-full shadow-lg"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Delete recipe</span>
            </Button>
          </div>
        )}
        
        {/* Upload/Regenerate buttons */}
        {isOwnRecipe && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={handleUploadClick}
              disabled={isUploading || isGenerating}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Upload'}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              onClick={handleRegenerateImage}
              disabled={isGenerating || isUploading}
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'AI Generate'}</span>
            </Button>
          </div>
        )}
        {!isOwnRecipe && user && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute bottom-3 right-3">
                  <Badge variant="secondary" className="text-xs">
                    Public Recipe
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Image editing is only available for your own recipes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 overflow-hidden px-4 md:px-6 pb-6">
        <div className="pb-2">
          <h2 className="text-xl md:text-2xl font-semibold">{recipe.name}</h2>
          <p className="text-sm text-muted-foreground">{recipe.description}</p>
        </div>

        {/* Admin: Public/Private Toggle */}
        {isOwnRecipe && isAdmin && (
          <div className="flex items-center justify-between py-3 px-4 border rounded-lg bg-muted/50 mb-3">
            <div className="flex items-center gap-3">
              {recipe.is_public ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="public-toggle" className="cursor-pointer">
                  {recipe.is_public ? 'Public Recipe' : 'Private Recipe'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {recipe.is_public ? 'Visible to all users' : 'Only visible to you'}
                </p>
              </div>
            </div>
            <Switch
              id="public-toggle"
              checked={recipe.is_public}
              onCheckedChange={handleTogglePublic}
              disabled={updateRecipe.isPending}
            />
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 py-3 text-sm border-b border-border">
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
        <div className="grid grid-cols-4 gap-2 md:gap-4 py-3 border-b border-border">
          <div className="text-center">
            <p className="text-base md:text-lg font-bold text-protein">{recipe.protein}g</p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div className="text-center">
            <p className="text-base md:text-lg font-bold text-carbs">{recipe.carbs}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-base md:text-lg font-bold text-fat">{recipe.fat}g</p>
            <p className="text-xs text-muted-foreground">Fat</p>
          </div>
          <div className="text-center">
            <p className="text-base md:text-lg font-bold text-fiber">{recipe.fiber}g</p>
            <p className="text-xs text-muted-foreground">Fiber</p>
          </div>
        </div>

        {/* Tabs with scrollable content */}
        <Tabs defaultValue="ingredients" className="flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="bg-transparent h-auto p-0 justify-start gap-6 border-b border-border flex-shrink-0">
            <TabsTrigger value="ingredients" className="bg-transparent rounded-none px-0 pb-2 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium -mb-px">
              Ingredients
            </TabsTrigger>
            <TabsTrigger value="instructions" className="bg-transparent rounded-none px-0 pb-2 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-medium -mb-px">
              Instructions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="flex-1 min-h-0 mt-4 data-[state=inactive]:hidden overflow-auto">
            <ul className="space-y-2 pr-4">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-3 text-base">
                  <span className="min-w-[5rem] flex-shrink-0 text-muted-foreground font-medium">
                    {ing.amount || (ing as any).quantity}
                  </span>
                  <span className="text-foreground">{ing.name}</span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="instructions" className="flex-1 min-h-0 mt-4 data-[state=inactive]:hidden overflow-auto">
            {recipe.instructions && recipe.instructions.length > 0 ? (
              <ol className="space-y-4 pr-4">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium text-foreground bg-secondary">
                      {i + 1}
                    </span>
                    <p className="text-base text-foreground pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-base text-muted-foreground italic">
                No instructions available for this recipe.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Footer: Tags + Actions */}
      <div className="flex-shrink-0 px-4 md:px-6 pb-4 pt-3 border-t border-border bg-background">
        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {recipe.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
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
    </>
  );

  // Mobile: Full-screen drawer with swipe-down to close
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[100dvh] max-h-[100dvh] rounded-none">
            {/* Sticky header with close indicator */}
            <div className="sticky top-0 z-10 bg-background border-b">
              <DrawerHeader className="py-3 px-4">
                <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-2" />
                <DrawerTitle className="sr-only">{recipe.name}</DrawerTitle>
              </DrawerHeader>
            </div>
            <div className="flex-1 overflow-auto flex flex-col">
              {recipeContent}
            </div>
          </DrawerContent>
        </Drawer>

        {/* Edit Dialog */}
        {recipe && (
          <EditRecipeDialog
            recipe={recipe}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{recipe?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Desktop: Regular dialog
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {recipeContent}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {recipe && (
        <EditRecipeDialog
          recipe={recipe}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipe?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
