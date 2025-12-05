import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationName, organizationType, fundraiserType, goalAmount, description, brandColors } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const fundraiserTypeLabels: Record<string, string> = {
      product: "Product Sale",
      walkathon: "Walk-a-thon",
      readathon: "Read-a-thon", 
      jogathon: "Jog-a-thon",
      other_athon: "Pledge Fundraiser"
    };

    const typeLabel = fundraiserTypeLabels[fundraiserType] || fundraiserType;
    
    const brandColorInfo = brandColors 
      ? `\nBrand Colors: Primary ${brandColors.primary}, Secondary ${brandColors.secondary}, Accent ${brandColors.accent}
(When suggesting visual content, reference these brand colors for consistency)`
      : '';

    const systemPrompt = `You are a social media marketing expert specializing in school and nonprofit fundraising campaigns. 
Create engaging, emotional, and action-driven social media posts that encourage donations and participation.
Your posts should be authentic, heartfelt, and highlight the impact of contributions.
Always include relevant emojis and hashtags. Keep posts concise but impactful.`;

    const userPrompt = `Create 5 unique social media posts for a fundraiser with these details:

Organization: ${organizationName}
Organization Type: ${organizationType || 'School/Youth Organization'}
Fundraiser Type: ${typeLabel}
Goal: $${goalAmount?.toLocaleString() || '5,000'}
${description ? `Description: ${description}` : ''}${brandColorInfo}

For each post, create:
1. The main post text (suitable for Facebook, Instagram, or Twitter)
2. A suggested comment to engage with supporters
3. Best platform for this specific post (Facebook, Instagram, Twitter, or All)

Focus on:
- Emotional connection and community impact
- Clear call-to-action
- Urgency without being pushy
- Gratitude and appreciation
- The unique value proposition

Return the response as a JSON array with objects containing: post, suggestedComment, platform`;

    console.log("Generating social posts for:", organizationName);

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response received");

    // Parse the JSON from the response
    let posts = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        posts = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured posts from text
        posts = [{
          post: content.slice(0, 280),
          suggestedComment: "Thank you for your support! 🙏",
          platform: "All"
        }];
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      posts = [{
        post: content.slice(0, 280),
        suggestedComment: "Thank you for your support! 🙏",
        platform: "All"
      }];
    }

    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating social posts:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate posts" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
