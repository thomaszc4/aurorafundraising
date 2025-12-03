import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    console.log(`Received Stripe event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      const sessionId = session.id;

      if (!orderId) {
        console.error("No order_id in session metadata");
        return new Response("Missing order_id", { status: 400 });
      }

      console.log(`Processing payment for order: ${orderId}, session: ${sessionId}`);

      // Update order status to completed using service role (bypasses RLS)
      const { error: updateError } = await supabaseClient
        .from("orders")
        .update({ 
          status: "completed",
          stripe_payment_intent_id: session.payment_intent as string
        })
        .eq("id", orderId)
        .eq("stripe_session_id", sessionId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        return new Response("Failed to update order", { status: 500 });
      }

      console.log(`Order ${orderId} marked as completed`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
