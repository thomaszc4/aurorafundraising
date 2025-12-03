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

    if (!fundraiserId || !cart || !Array.isArray(cart) || cart.length === 0 || !customerInfo) {
      throw new Error("Missing required fields");
    }

    // Validate customer info
    if (!customerInfo.email || typeof customerInfo.email !== 'string') {
      throw new Error("Valid email is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Extract product IDs from cart
    const productIds = cart.map((item: any) => item.productId).filter(Boolean);
    
    if (productIds.length === 0) {
      throw new Error("No valid products in cart");
    }

    // Fetch actual product prices from database (SERVER-SIDE VALIDATION)
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('id, name, price, cost, stripe_price_id, is_active')
      .in('id', productIds);

    if (productsError || !products) {
      console.error("Failed to fetch products:", productsError);
      throw new Error("Failed to validate products");
    }

    // Create a map of products by ID for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate all products exist and are active
    for (const item of cart) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (!product.is_active) {
        throw new Error(`Product is not available: ${product.name}`);
      }
    }

    // Calculate totals using DATABASE prices (not client-supplied prices)
    const totalAmount = cart.reduce((sum: number, item: any) => {
      const product = productMap.get(item.productId);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      return sum + (Number(product!.price) * quantity);
    }, 0);
    
    const profitAmount = cart.reduce((sum: number, item: any) => {
      const product = productMap.get(item.productId);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      return sum + ((Number(product!.price) - Number(product!.cost || 0)) * quantity);
    }, 0);

    // Create order record
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        student_fundraiser_id: fundraiserId,
        customer_email: customerInfo.email,
        customer_name: customerInfo.name || null,
        customer_phone: customerInfo.phone || null,
        total_amount: totalAmount,
        profit_amount: profitAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw orderError;
    }

    // Create order items using DATABASE prices
    const orderItems = cart.map((item: any) => {
      const product = productMap.get(item.productId);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      return {
        order_id: order.id,
        product_id: item.productId,
        quantity: quantity,
        unit_price: Number(product!.price),
        unit_cost: Number(product!.cost || 0),
        subtotal: Number(product!.price) * quantity,
      };
    });

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      throw itemsError;
    }

    // Create Stripe line items using DATABASE prices
    const lineItems = cart.map((item: any) => {
      const product = productMap.get(item.productId);
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      
      if (product!.stripe_price_id) {
        return {
          price: product!.stripe_price_id,
          quantity: quantity,
        };
      } else {
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product!.name,
            },
            unit_amount: Math.round(Number(product!.price) * 100),
          },
          quantity: quantity,
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

    console.log(`Checkout session created: ${session.id} for order: ${order.id}`);

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
