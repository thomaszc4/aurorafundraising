import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  console.log("=== Stripe Webhook Received ===");
  console.log("Has signature:", !!signature);
  console.log("Has webhook secret:", !!webhookSecret);

  if (!signature) {
    console.error("Missing stripe-signature header");
    return new Response("Missing stripe-signature header", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET env variable");
    return new Response("Webhook secret not configured", { 
      status: 500,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.text();
    console.log("Body length:", body.length);
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }
    
    console.log(`Received Stripe event: ${event.type}`);
    console.log("Event ID:", event.id);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      const sessionId = session.id;
      const paymentIntent = session.payment_intent;

      console.log("Processing checkout.session.completed");
      console.log("Order ID from metadata:", orderId);
      console.log("Session ID:", sessionId);
      console.log("Payment Intent:", paymentIntent);

      if (!orderId) {
        console.error("No order_id in session metadata");
        // Still return 200 to acknowledge the webhook
        return new Response(JSON.stringify({ received: true, warning: "No order_id in metadata" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Update order status to completed using service role (bypasses RLS)
      const { data: updateData, error: updateError } = await supabaseClient
        .from("orders")
        .update({ 
          status: "completed",
          stripe_payment_intent_id: typeof paymentIntent === 'string' ? paymentIntent : null
        })
        .eq("id", orderId)
        .eq("stripe_session_id", sessionId)
        .select();

      if (updateError) {
        console.error("Failed to update order:", updateError);
        // Still return 200 to prevent Stripe retries, but log the error
        return new Response(JSON.stringify({ 
          received: true, 
          error: "Failed to update order",
          details: updateError.message 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      console.log(`Order ${orderId} updated successfully:`, updateData);

      // The trigger will automatically update student_fundraiser.total_raised
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    console.error("Full error:", err);
    return new Response(`Webhook Error: ${err.message}`, { 
      status: 400,
      headers: corsHeaders 
    });
  }
});
