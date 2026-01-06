import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user for recommendations: ${userId}`);

    const { nutritionGaps, preferences, allergies, availableRecipes } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a nutrition-focused recipe recommendation assistant. Your job is to analyze nutritional gaps and suggest the best recipes to fill those gaps while respecting dietary preferences and allergies.

Guidelines:
- Prioritize recipes that fill the biggest nutritional gaps
- Never recommend recipes containing allergens the user has specified
- Consider dietary preferences (vegetarian, vegan, keto, etc.)
- Explain WHY each recipe was chosen based on nutritional benefits
- Return exactly 3 recommendations`;

    const userPrompt = `Based on the following data, recommend 3 recipes from the available list:

NUTRITIONAL GAPS (what the user needs more of today):
${JSON.stringify(nutritionGaps, null, 2)}

USER'S DIETARY PREFERENCES: ${preferences?.length ? preferences.join(", ") : "None specified"}

USER'S ALLERGIES (MUST AVOID): ${allergies?.length ? allergies.join(", ") : "None"}

AVAILABLE RECIPES:
${JSON.stringify(availableRecipes.map((r: any) => ({
  id: r.id,
  name: r.name,
  calories: r.calories,
  protein: r.protein,
  carbs: r.carbs,
  fat: r.fat,
  fiber: r.fiber,
  tags: r.tags,
  allergens: r.allergens,
})), null, 2)}

Return your recommendations using the suggest_recipes function.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_recipes",
              description: "Return 3 recipe recommendations with explanations",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        recipe_id: { type: "string", description: "The UUID of the recommended recipe" },
                        reason: { type: "string", description: "Brief explanation of why this recipe was chosen (focus on nutritional benefits)" },
                        nutrition_highlight: { type: "string", description: "Key nutrient this recipe helps with (e.g., 'High in protein', 'Great fiber source')" },
                      },
                      required: ["recipe_id", "reason", "nutrition_highlight"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_recipes" } },
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
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No recommendations returned from AI");
    }

    const recommendations = JSON.parse(toolCall.function.arguments);
    
    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in recommend-recipes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
