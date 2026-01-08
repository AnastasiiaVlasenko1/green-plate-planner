import { useState, useRef } from 'react';
import { Plus, Trash2, Upload, Loader2, Sparkles, Globe } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { useCreateRecipe } from '@/hooks/useCreateRecipe';
import { useUserRole } from '@/hooks/useUserRole';

interface Ingredient {
  amount: string;
  name: string;
}

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
const dietTypes = ['vegetarian', 'vegan', 'gluten-free', 'high-protein', 'quick', 'meal-prep'];

export function AddRecipeDialog({ open, onOpenChange }: AddRecipeDialogProps) {
  const createRecipe = useCreateRecipe();
  const { isAdmin } = useUserRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrepTime('');
    setCookTime('');
    setServings('2');
    setIngredients([{ amount: '', name: '' }]);
    setInstructions(['']);
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber('');
    setSelectedTags([]);
    setImage(null);
    setImagePreview(null);
    setIsPublic(false);
  };

  const handleClose = () => {
    if (!createRecipe.isPending) {
      resetForm();
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

  // Image handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form submission
  const handleSubmit = async () => {
    // Validate required fields
    const validIngredients = ingredients.filter(ing => ing.name.trim());
    
    if (!name.trim()) {
      return;
    }
    if (validIngredients.length === 0) {
      return;
    }

    const validInstructions = instructions.filter(inst => inst.trim());

    await createRecipe.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      ingredients: validIngredients,
      instructions: validInstructions.length > 0 ? validInstructions : undefined,
      prep_time: prepTime ? parseInt(prepTime) : undefined,
      cook_time: cookTime ? parseInt(cookTime) : undefined,
      servings: parseInt(servings) || 2,
      calories: calories ? parseInt(calories) : undefined,
      protein: protein ? parseInt(protein) : undefined,
      carbs: carbs ? parseInt(carbs) : undefined,
      fat: fat ? parseInt(fat) : undefined,
      fiber: fiber ? parseInt(fiber) : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      image: image || undefined,
      isPublic: isAdmin ? isPublic : false,
    });

    handleClose();
  };

  const isValid = name.trim() && ingredients.some(ing => ing.name.trim());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl">Add New Recipe</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-6 p-6">
            {/* AI hint */}
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg text-sm">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-muted-foreground">
                Only name and ingredients are required. Leave other fields blank and AI will generate them for you!
              </p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Recipe Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Chicken Stir Fry"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the dish (optional - AI will generate)"
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            {/* Timing & Servings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prepTime">Prep Time (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="15"
                  className="mt-1"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="cookTime">Cook Time (min)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="20"
                  className="mt-1"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
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
              <p className="text-xs text-muted-foreground mb-2">Optional - AI will generate if left blank</p>
              <div className="space-y-2">
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
              <p className="text-xs text-muted-foreground mb-2">Optional - AI will estimate if left blank</p>
              <div className="grid grid-cols-5 gap-2">
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

            {/* Image Upload */}
            <div>
              <Label>Recipe Image</Label>
              <p className="text-xs text-muted-foreground mb-2">Optional - AI will generate if not provided</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-dashed gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </Button>
              )}
            </div>

            {/* Admin: Public Recipe Toggle */}
            {isAdmin && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <Label htmlFor="public-toggle" className="cursor-pointer">Make recipe public</Label>
                    <p className="text-xs text-muted-foreground">Visible to all users</p>
                  </div>
                </div>
                <Switch
                  id="public-toggle"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t bg-background gap-3 shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createRecipe.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createRecipe.isPending}
          >
            {createRecipe.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Save Recipe'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
