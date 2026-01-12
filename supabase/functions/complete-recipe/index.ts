import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Ingredient {
  amount: string;
  name: string;
}

interface RecipeInput {
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions?: string[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  tags?: string[];
}

interface CompletedRecipe {
  description: string;
  prep_time: number;
  cook_time: number;
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  tags: string[];
  allergens: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const recipe: RecipeInput = await req.json();

    // Build the list of what needs to be generated
    const missingFields: string[] = [];
    if (!recipe.description) missingFields.push("description (1-2 sentences about the dish)");
    if (!recipe.prep_time) missingFields.push("prep_time (in minutes)");
    if (!recipe.cook_time) missingFields.push("cook_time (in minutes)");
    if (!recipe.instructions || recipe.instructions.length === 0) {
      missingFields.push("instructions (array of step-by-step cooking instructions)");
    }
    if (!recipe.calories) missingFields.push("calories (per serving)");
    if (!recipe.protein) missingFields.push("protein (grams per serving)");
    if (!recipe.carbs) missingFields.push("carbs (grams per serving)");
    if (!recipe.fat) missingFields.push("fat (grams per serving)");
    if (!recipe.fiber) missingFields.push("fiber (grams per serving)");
    missingFields.push("tags (relevant tags from: breakfast, lunch, dinner, snack, vegetarian, vegan, gluten-free, high-protein, quick, meal-prep)");
    missingFields.push("allergens (common allergens present, e.g., nuts, dairy, gluten, eggs, soy, shellfish)");

    const ingredientsList = recipe.ingredients
      .map(ing => `${ing.amount} ${ing.name}`)
      .join('\n');

    const prompt = `You are a professional chef and nutritionist. Given this recipe information, generate the missing details.

Recipe Name: ${recipe.name}
Servings: ${recipe.servings || 2}

Ingredients:
${ingredientsList}

${recipe.instructions && recipe.instructions.length > 0 ? `Existing Instructions:\n${recipe.instructions.join('\n')}` : ''}

Generate the following missing fields:
${missingFields.join('\n')}

Important:
- Nutrition values should be realistic per-serving estimates
- Instructions should be clear, numbered steps
- Tags should only include relevant ones from the provided list
- Allergens should only list what's actually present in the ingredients`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a helpful cooking assistant. Return valid JSON only." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "complete_recipe",
              description: "Complete the missing recipe details",
              parameters: {
                type: "object",
                properties: {
                  description: { type: "string", description: "1-2 sentence description of the dish" },
                  prep_time: { type: "number", description: "Preparation time in minutes" },
                  cook_time: { type: "number", description: "Cooking time in minutes" },
                  instructions: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Step-by-step cooking instructions" 
                  },
                  calories: { type: "number", description: "Calories per serving" },
                  protein: { type: "number", description: "Protein in grams per serving" },
                  carbs: { type: "number", description: "Carbohydrates in grams per serving" },
                  fat: { type: "number", description: "Fat in grams per serving" },
                  fiber: { type: "number", description: "Fiber in grams per serving" },
                  tags: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Relevant recipe tags" 
                  },
                  allergens: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Allergens present in the recipe" 
                  }
                },
                required: ["description", "prep_time", "cook_time", "instructions", "calories", "protein", "carbs", "fat", "fiber", "tags", "allergens"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "complete_recipe" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate recipe details");
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "complete_recipe") {
      throw new Error("Invalid AI response format");
    }

    const generatedData: CompletedRecipe = JSON.parse(toolCall.function.arguments);

    // Merge with existing data (user input takes priority)
    const completedRecipe = {
      description: recipe.description || generatedData.description,
      prep_time: recipe.prep_time || generatedData.prep_time,
      cook_time: recipe.cook_time || generatedData.cook_time,
      instructions: (recipe.instructions && recipe.instructions.length > 0) 
        ? recipe.instructions 
        : generatedData.instructions,
      calories: recipe.calories || generatedData.calories,
      protein: recipe.protein || generatedData.protein,
      carbs: recipe.carbs || generatedData.carbs,
      fat: recipe.fat || generatedData.fat,
      fiber: recipe.fiber || generatedData.fiber,
      tags: (recipe.tags && recipe.tags.length > 0) ? recipe.tags : generatedData.tags,
      allergens: generatedData.allergens,
    };

    return new Response(JSON.stringify(completedRecipe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("complete-recipe error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
