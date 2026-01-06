-- Create profiles table for user preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'Alex',
  avatar_url TEXT,
  daily_calories INTEGER NOT NULL DEFAULT 2000,
  protein_goal INTEGER NOT NULL DEFAULT 150,
  carbs_goal INTEGER NOT NULL DEFAULT 200,
  fat_goal INTEGER NOT NULL DEFAULT 65,
  fiber_goal INTEGER NOT NULL DEFAULT 30,
  dietary_preferences TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT ARRAY['nuts'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create recipes table
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  prep_time INTEGER NOT NULL DEFAULT 15,
  cook_time INTEGER NOT NULL DEFAULT 20,
  servings INTEGER NOT NULL DEFAULT 2,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  fiber INTEGER NOT NULL DEFAULT 0,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public recipes" ON public.recipes FOR SELECT USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "Authenticated users can insert recipes" ON public.recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own recipes" ON public.recipes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own recipes" ON public.recipes FOR DELETE USING (auth.uid() = created_by);

-- Create meal_plans table
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3')),
  servings INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_date, meal_type)
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans" ON public.meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON public.meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans" ON public.meal_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans" ON public.meal_plans FOR DELETE USING (auth.uid() = user_id);

-- Create grocery_items table
CREATE TABLE public.grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  is_checked BOOLEAN NOT NULL DEFAULT false,
  week_start DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grocery items" ON public.grocery_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grocery items" ON public.grocery_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grocery items" ON public.grocery_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grocery items" ON public.grocery_items FOR DELETE USING (auth.uid() = user_id);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample recipes
INSERT INTO public.recipes (name, description, image_url, prep_time, cook_time, servings, calories, protein, carbs, fat, fiber, ingredients, tags, allergens) VALUES
('Greek Yogurt Parfait', 'Creamy Greek yogurt layered with fresh berries and crunchy granola', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', 5, 0, 1, 350, 20, 45, 8, 5, '[{"name": "Greek yogurt", "amount": "1 cup", "category": "Dairy"}, {"name": "Mixed berries", "amount": "1/2 cup", "category": "Produce"}, {"name": "Granola", "amount": "1/4 cup", "category": "Grains"}, {"name": "Honey", "amount": "1 tbsp", "category": "Pantry"}]', ARRAY['breakfast', 'quick', 'high-protein'], ARRAY['dairy']),

('Avocado Toast with Eggs', 'Crispy sourdough topped with smashed avocado and poached eggs', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800', 10, 5, 1, 420, 18, 32, 26, 8, '[{"name": "Sourdough bread", "amount": "2 slices", "category": "Grains"}, {"name": "Avocado", "amount": "1 medium", "category": "Produce"}, {"name": "Eggs", "amount": "2 large", "category": "Dairy"}, {"name": "Red pepper flakes", "amount": "pinch", "category": "Pantry"}]', ARRAY['breakfast', 'vegetarian'], ARRAY['eggs', 'gluten']),

('Mediterranean Quinoa Bowl', 'Protein-packed quinoa with fresh vegetables and feta', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', 15, 20, 2, 520, 22, 58, 22, 10, '[{"name": "Quinoa", "amount": "1 cup", "category": "Grains"}, {"name": "Cucumber", "amount": "1 medium", "category": "Produce"}, {"name": "Cherry tomatoes", "amount": "1 cup", "category": "Produce"}, {"name": "Feta cheese", "amount": "1/4 cup", "category": "Dairy"}, {"name": "Olive oil", "amount": "2 tbsp", "category": "Pantry"}, {"name": "Lemon", "amount": "1", "category": "Produce"}]', ARRAY['lunch', 'vegetarian', 'meal-prep'], ARRAY['dairy']),

('Grilled Chicken Caesar Salad', 'Classic Caesar with grilled chicken breast and parmesan', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800', 15, 15, 2, 480, 42, 18, 28, 4, '[{"name": "Chicken breast", "amount": "8 oz", "category": "Proteins"}, {"name": "Romaine lettuce", "amount": "1 head", "category": "Produce"}, {"name": "Parmesan cheese", "amount": "1/4 cup", "category": "Dairy"}, {"name": "Caesar dressing", "amount": "3 tbsp", "category": "Pantry"}, {"name": "Croutons", "amount": "1/2 cup", "category": "Grains"}]', ARRAY['lunch', 'high-protein', 'low-carb'], ARRAY['dairy', 'gluten']),

('Roasted Salmon with Vegetables', 'Omega-rich salmon with roasted seasonal vegetables', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800', 15, 25, 2, 580, 40, 24, 38, 6, '[{"name": "Salmon fillet", "amount": "12 oz", "category": "Proteins"}, {"name": "Broccoli", "amount": "2 cups", "category": "Produce"}, {"name": "Sweet potato", "amount": "1 medium", "category": "Produce"}, {"name": "Olive oil", "amount": "2 tbsp", "category": "Pantry"}, {"name": "Lemon", "amount": "1", "category": "Produce"}, {"name": "Garlic", "amount": "3 cloves", "category": "Produce"}]', ARRAY['dinner', 'high-protein', 'gluten-free'], ARRAY['fish']),

('Turkey Meatballs with Zucchini Noodles', 'Lean turkey meatballs served over spiralized zucchini', 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800', 20, 25, 2, 450, 38, 18, 26, 5, '[{"name": "Ground turkey", "amount": "1 lb", "category": "Proteins"}, {"name": "Zucchini", "amount": "3 medium", "category": "Produce"}, {"name": "Marinara sauce", "amount": "1 cup", "category": "Pantry"}, {"name": "Egg", "amount": "1", "category": "Dairy"}, {"name": "Italian herbs", "amount": "2 tsp", "category": "Pantry"}]', ARRAY['dinner', 'high-protein', 'low-carb'], ARRAY['eggs']),

('Protein Smoothie Bowl', 'Thick and creamy smoothie bowl topped with fresh fruits', 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800', 10, 0, 1, 380, 28, 48, 10, 7, '[{"name": "Protein powder", "amount": "1 scoop", "category": "Pantry"}, {"name": "Frozen banana", "amount": "1", "category": "Produce"}, {"name": "Almond milk", "amount": "1/2 cup", "category": "Dairy"}, {"name": "Mixed berries", "amount": "1/2 cup", "category": "Produce"}, {"name": "Chia seeds", "amount": "1 tbsp", "category": "Pantry"}]', ARRAY['breakfast', 'high-protein', 'quick'], ARRAY[]::TEXT[]),

('Chickpea Curry', 'Aromatic Indian-spiced chickpea curry with coconut milk', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', 10, 25, 4, 510, 18, 62, 22, 14, '[{"name": "Chickpeas", "amount": "2 cans", "category": "Pantry"}, {"name": "Coconut milk", "amount": "1 can", "category": "Pantry"}, {"name": "Tomatoes", "amount": "2 cups", "category": "Produce"}, {"name": "Onion", "amount": "1 large", "category": "Produce"}, {"name": "Curry powder", "amount": "2 tbsp", "category": "Pantry"}, {"name": "Garlic", "amount": "4 cloves", "category": "Produce"}]', ARRAY['dinner', 'vegan', 'vegetarian', 'meal-prep'], ARRAY[]::TEXT[]),

('Overnight Oats', 'Creamy make-ahead oats with maple and cinnamon', 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800', 5, 0, 1, 340, 12, 52, 10, 6, '[{"name": "Rolled oats", "amount": "1/2 cup", "category": "Grains"}, {"name": "Almond milk", "amount": "1/2 cup", "category": "Dairy"}, {"name": "Greek yogurt", "amount": "1/4 cup", "category": "Dairy"}, {"name": "Maple syrup", "amount": "1 tbsp", "category": "Pantry"}, {"name": "Cinnamon", "amount": "1/2 tsp", "category": "Pantry"}]', ARRAY['breakfast', 'meal-prep', 'vegetarian'], ARRAY['dairy', 'gluten']),

('Buddha Bowl', 'Colorful plant-based bowl with tahini dressing', 'https://images.unsplash.com/photo-1540914124281-342587941389?w=800', 20, 15, 2, 490, 16, 58, 24, 12, '[{"name": "Brown rice", "amount": "1 cup", "category": "Grains"}, {"name": "Sweet potato", "amount": "1 large", "category": "Produce"}, {"name": "Chickpeas", "amount": "1 can", "category": "Pantry"}, {"name": "Kale", "amount": "2 cups", "category": "Produce"}, {"name": "Tahini", "amount": "3 tbsp", "category": "Pantry"}, {"name": "Avocado", "amount": "1/2", "category": "Produce"}]', ARRAY['lunch', 'vegan', 'vegetarian', 'gluten-free'], ARRAY['sesame']),

('Grilled Steak with Sweet Potato', 'Perfectly grilled ribeye with roasted sweet potato', 'https://images.unsplash.com/photo-1558030006-450675393462?w=800', 10, 20, 2, 620, 45, 38, 32, 5, '[{"name": "Ribeye steak", "amount": "12 oz", "category": "Proteins"}, {"name": "Sweet potato", "amount": "2 medium", "category": "Produce"}, {"name": "Butter", "amount": "2 tbsp", "category": "Dairy"}, {"name": "Rosemary", "amount": "2 sprigs", "category": "Produce"}, {"name": "Garlic", "amount": "4 cloves", "category": "Produce"}]', ARRAY['dinner', 'high-protein', 'gluten-free'], ARRAY['dairy']),

('Vegetable Stir-Fry with Tofu', 'Crispy tofu with colorful vegetables in ginger sauce', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800', 15, 15, 2, 440, 24, 38, 24, 8, '[{"name": "Firm tofu", "amount": "14 oz", "category": "Proteins"}, {"name": "Broccoli", "amount": "2 cups", "category": "Produce"}, {"name": "Bell peppers", "amount": "2", "category": "Produce"}, {"name": "Soy sauce", "amount": "3 tbsp", "category": "Pantry"}, {"name": "Ginger", "amount": "1 inch", "category": "Produce"}, {"name": "Sesame oil", "amount": "2 tbsp", "category": "Pantry"}]', ARRAY['dinner', 'vegan', 'vegetarian'], ARRAY['soy', 'sesame']),

('Caprese Salad', 'Fresh mozzarella with tomatoes and basil', 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800', 10, 0, 2, 360, 18, 12, 28, 2, '[{"name": "Fresh mozzarella", "amount": "8 oz", "category": "Dairy"}, {"name": "Tomatoes", "amount": "3 large", "category": "Produce"}, {"name": "Fresh basil", "amount": "1/4 cup", "category": "Produce"}, {"name": "Balsamic glaze", "amount": "2 tbsp", "category": "Pantry"}, {"name": "Olive oil", "amount": "2 tbsp", "category": "Pantry"}]', ARRAY['lunch', 'vegetarian', 'gluten-free', 'quick'], ARRAY['dairy']),

('Lemon Herb Chicken', 'Juicy roasted chicken with herbs and citrus', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800', 15, 35, 4, 520, 48, 8, 32, 2, '[{"name": "Chicken thighs", "amount": "2 lbs", "category": "Proteins"}, {"name": "Lemon", "amount": "2", "category": "Produce"}, {"name": "Fresh thyme", "amount": "4 sprigs", "category": "Produce"}, {"name": "Garlic", "amount": "6 cloves", "category": "Produce"}, {"name": "Olive oil", "amount": "3 tbsp", "category": "Pantry"}]', ARRAY['dinner', 'high-protein', 'gluten-free', 'meal-prep'], ARRAY[]::TEXT[]),

('Banana Protein Pancakes', 'Fluffy pancakes packed with protein', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800', 10, 15, 2, 400, 28, 42, 14, 4, '[{"name": "Banana", "amount": "2", "category": "Produce"}, {"name": "Eggs", "amount": "2", "category": "Dairy"}, {"name": "Protein powder", "amount": "1 scoop", "category": "Pantry"}, {"name": "Oat flour", "amount": "1/2 cup", "category": "Grains"}, {"name": "Maple syrup", "amount": "2 tbsp", "category": "Pantry"}]', ARRAY['breakfast', 'high-protein'], ARRAY['eggs', 'gluten']);