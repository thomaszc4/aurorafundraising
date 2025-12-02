import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { fundraiserId, cart, customerInfo } = await req.json();

    if (!fundraiserId || !cart || !customerInfo) {
      throw new Error("Missing required fields");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate totals
    const totalAmount = cart.reduce((sum: number, item: any) => 
      sum + (Number(item.price) * item.quantity), 0
    );
    
    const profitAmount = cart.reduce((sum: number, item: any) => 
      sum + ((Number(item.price) - Number(item.cost || 0)) * item.quantity), 0
    );

    // Create order record
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        student_fundraiser_id: fundraiserId,
        customer_email: customerInfo.email,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        total_amount: totalAmount,
        profit_amount: profitAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cart.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      unit_cost: item.cost || 0,
      subtotal: Number(item.price) * item.quantity,
    }));

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Create Stripe line items
    const lineItems = cart.map((item: any) => {
      if (item.stripePriceId) {
        return {
          price: item.stripePriceId,
          quantity: item.quantity,
        };
      } else {
        // Create price on the fly if no price_id
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.productName || 'Product',
            },
            unit_amount: Math.round(Number(item.price) * 100),
          },
          quantity: item.quantity,
        };
      }
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: customerInfo.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout/cancel`,
      metadata: {
        order_id: order.id,
        fundraiser_id: fundraiserId,
      },
    });

    // Update order with session ID
    await supabaseClient
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
