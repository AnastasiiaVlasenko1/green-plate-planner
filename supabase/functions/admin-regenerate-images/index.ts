import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all seeded recipes (no owner) that don't have AI-generated images yet
    const { data: recipes, error: fetchError } = await adminClient
      .from('recipes')
      .select('id, name, ingredients, image_url')
      .is('created_by', null)
      .not('image_url', 'like', '%recipe-images%');

    if (fetchError) {
      console.error('Error fetching recipes:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${recipes?.length || 0} recipes to process`);

    const results: { id: string; name: string; status: string; imageUrl?: string }[] = [];

    for (const recipe of recipes || []) {
      console.log(`Processing: ${recipe.name}`);

      try {
        // Build prompt from recipe name and ingredients
        const ingredientList = recipe.ingredients?.slice(0, 5).map((i: { name: string }) => i.name).join(', ') || '';
        const prompt = `A beautiful, professional food photography image of ${recipe.name}. The dish should look appetizing and realistic, showing the finished meal on a clean plate with elegant presentation. Key ingredients visible: ${ingredientList}. Soft natural lighting, shallow depth of field, high-end restaurant quality presentation. Ultra high resolution.`;

        console.log(`Generating image with prompt: ${prompt.substring(0, 100)}...`);

        // Call Lovable AI Gateway
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-pro-image-preview',
            messages: [{ role: 'user', content: prompt }],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI Gateway error for ${recipe.name}:`, errorText);
          results.push({ id: recipe.id, name: recipe.name, status: 'failed', imageUrl: errorText });
          continue;
        }

        const data = await response.json();
        const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          console.error(`No image generated for ${recipe.name}`);
          results.push({ id: recipe.id, name: recipe.name, status: 'no_image' });
          continue;
        }

        // Convert base64 to binary
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Upload to storage
        const fileName = `system/${recipe.id}-${Date.now()}.png`;
        const { error: uploadError } = await adminClient.storage
          .from('recipe-images')
          .upload(fileName, binaryData, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${recipe.name}:`, uploadError);
          results.push({ id: recipe.id, name: recipe.name, status: 'upload_failed' });
          continue;
        }

        // Get public URL
        const { data: urlData } = adminClient.storage
          .from('recipe-images')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Update recipe with new image URL
        const { error: updateError } = await adminClient
          .from('recipes')
          .update({ image_url: publicUrl })
          .eq('id', recipe.id);

        if (updateError) {
          console.error(`Update error for ${recipe.name}:`, updateError);
          results.push({ id: recipe.id, name: recipe.name, status: 'update_failed' });
          continue;
        }

        console.log(`Successfully updated ${recipe.name} with new image`);
        results.push({ id: recipe.id, name: recipe.name, status: 'success', imageUrl: publicUrl });

        // Delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (recipeError) {
        console.error(`Error processing ${recipe.name}:`, recipeError);
        results.push({ id: recipe.id, name: recipe.name, status: 'error' });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`Completed: ${successCount}/${results.length} recipes updated`);

    return new Response(
      JSON.stringify({ 
        message: `Processed ${results.length} recipes, ${successCount} successful`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-regenerate-images:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
