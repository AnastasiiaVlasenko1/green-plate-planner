import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUpdateRecipe } from '@/hooks/useUpdateRecipe';
import { Recipe } from '@/hooks/useRecipes';
import { toast } from 'sonner';

interface Ingredient {
  amount: string;
  name: string;
}

interface EditRecipeDialogProps {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const dietTypes = ['vegetarian', 'vegan', 'gluten-free', 'high-protein', 'quick', 'meal-prep'];

export function EditRecipeDialog({ recipe, open, onOpenChange }: EditRecipeDialogProps) {
  const updateRecipe = useUpdateRecipe();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('2');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ amount: '', name: '' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Populate form when recipe changes
  useEffect(() => {
    if (recipe && open) {
      setName(recipe.name);
      setDescription(recipe.description || '');
      setPrepTime(recipe.prep_time?.toString() || '');
      setCookTime(recipe.cook_time?.toString() || '');
      setServings(recipe.servings?.toString() || '2');
      setIngredients(
        recipe.ingredients.length > 0 
          ? recipe.ingredients.map(ing => ({ amount: ing.amount || '', name: ing.name }))
          : [{ amount: '', name: '' }]
      );
      setInstructions(recipe.instructions?.length > 0 ? recipe.instructions : ['']);
      setCalories(recipe.calories?.toString() || '');
      setProtein(recipe.protein?.toString() || '');
      setCarbs(recipe.carbs?.toString() || '');
      setFat(recipe.fat?.toString() || '');
      setFiber(recipe.fiber?.toString() || '');
      setSelectedTags(recipe.tags || []);
    }
  }, [recipe, open]);

  const handleClose = () => {
    if (!updateRecipe.isPending) {
      onOpenChange(false);
    }
  };

  // Ingredient handlers
  const addIngredient = () => {
    setIngredients([...ingredients, { amount: '', name: '' }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  // Instruction handlers
  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  // Tag handler
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Form submission
  const handleSubmit = async () => {
    const validIngredients = ingredients.filter(ing => ing.name.trim());
    
    if (!name.trim()) {
      toast.error('Recipe name is required');
      return;
    }
    if (validIngredients.length === 0) {
      toast.error('At least one ingredient is required');
      return;
    }

    const validInstructions = instructions.filter(inst => inst.trim());

    await updateRecipe.mutateAsync({
      id: recipe.id,
      name: name.trim(),
      description: description.trim() || null,
      ingredients: validIngredients,
      instructions: validInstructions,
      prep_time: prepTime ? parseInt(prepTime) : recipe.prep_time,
      cook_time: cookTime ? parseInt(cookTime) : recipe.cook_time,
      servings: parseInt(servings) || 2,
      calories: calories ? parseInt(calories) : recipe.calories,
      protein: protein ? parseInt(protein) : recipe.protein,
      carbs: carbs ? parseInt(carbs) : recipe.carbs,
      fat: fat ? parseInt(fat) : recipe.fat,
      fiber: fiber ? parseInt(fiber) : recipe.fiber,
      tags: selectedTags,
    });

    toast.success('Recipe updated successfully');
    handleClose();
  };

  const isValid = name.trim() && ingredients.some(ing => ing.name.trim());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl">Edit Recipe</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-6 p-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Recipe Name *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Chicken Stir Fry"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the dish"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            {/* Timing & Servings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-prepTime">Prep Time (min)</Label>
                <Input
                  id="edit-prepTime"
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="15"
                  className="mt-1"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-cookTime">Cook Time (min)</Label>
                <Input
                  id="edit-cookTime"
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="20"
                  className="mt-1"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-servings">Servings</Label>
                <Input
                  id="edit-servings"
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="mt-1"
                  min="1"
                  max="12"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <Label>Ingredients *</Label>
              <div className="space-y-2 mt-2">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                      placeholder="Amount (e.g., 2 cups)"
                      className="w-1/3"
                    />
                    <Input
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      placeholder="Ingredient name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                      disabled={ingredients.length === 1}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <Label>Instructions</Label>
              <div className="space-y-2 mt-2">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="w-6 h-9 flex items-center justify-center text-sm text-muted-foreground font-medium">
                      {index + 1}.
                    </span>
                    <Textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInstruction(index)}
                      disabled={instructions.length === 1}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInstruction}
                  className="gap-1 ml-8"
                >
                  <Plus className="w-4 h-4" />
                  Add Step
                </Button>
              </div>
            </div>

            {/* Nutrition */}
            <div>
              <Label>Nutrition (per serving)</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                <div>
                  <Input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="Calories"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground">kcal</span>
                </div>
                <div>
                  <Input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="Protein"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground">g protein</span>
                </div>
                <div>
                  <Input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="Carbs"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground">g carbs</span>
                </div>
                <div>
                  <Input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="Fat"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground">g fat</span>
                </div>
                <div>
                  <Input
                    type="number"
                    value={fiber}
                    onChange={(e) => setFiber(e.target.value)}
                    placeholder="Fiber"
                    min="0"
                  />
                  <span className="text-xs text-muted-foreground">g fiber</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Meal Type</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {mealTypes.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    />
                    <span className="text-sm capitalize">{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Diet Type</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {dietTypes.map((tag) => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                    />
                    <span className="text-sm capitalize">{tag.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={updateRecipe.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || updateRecipe.isPending}>
            {updateRecipe.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
