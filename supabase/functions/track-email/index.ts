import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21,
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get("id");
    const type = url.searchParams.get("type") || "open"; // open or click

    if (!trackingId) {
      return new Response(TRACKING_PIXEL, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          ...corsHeaders,
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Tracking ${type} for id: ${trackingId}`);

    if (type === "open") {
      // Get current record to increment count
      const { data: current } = await supabase
        .from("email_tracking")
        .select("open_count, opened_at")
        .eq("id", trackingId)
        .single();

      const updateData: Record<string, any> = {
        open_count: (current?.open_count || 0) + 1,
      };
      
      // Only set opened_at on first open
      if (!current?.opened_at) {
        updateData.opened_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("email_tracking")
        .update(updateData)
        .eq("id", trackingId);

      if (error) console.error("Error updating open tracking:", error);
    } else if (type === "click") {
      // Get current record to increment count
      const { data: current } = await supabase
        .from("email_tracking")
        .select("click_count, clicked_at")
        .eq("id", trackingId)
        .single();

      const updateData: Record<string, any> = {
        click_count: (current?.click_count || 0) + 1,
      };
      
      // Only set clicked_at on first click
      if (!current?.clicked_at) {
        updateData.clicked_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("email_tracking")
        .update(updateData)
        .eq("id", trackingId);

      if (error) console.error("Error updating click tracking:", error);
    }

    // Return tracking pixel
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in track-email function:", error);
    // Still return the pixel even on error
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
