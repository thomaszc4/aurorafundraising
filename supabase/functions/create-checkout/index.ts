import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const cartItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID format"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(100, "Maximum 100 items per product"),
});

const customerInfoSchema = z.object({
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  name: z.string().max(100, "Name too long").optional().nullable(),
  phone: z.string().max(20, "Phone number too long").optional().nullable(),
});

const checkoutRequestSchema = z.object({
  fundraiserId: z.string().uuid("Invalid fundraiser ID format"),
  cart: z.array(cartItemSchema).min(1, "Cart cannot be empty").max(50, "Maximum 50 items per order"),
  customerInfo: customerInfoSchema,
});

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("x-real-ip") || 
                   "unknown";

  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    console.log(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfter)
        },
        status: 429,
      }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const rawBody = await req.json();

    // Validate input with zod
    const validationResult = checkoutRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.log(`Validation failed: ${errors}`);
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { fundraiserId, cart, customerInfo } = validationResult.data;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Extract product IDs from cart
    const productIds = cart.map((item) => item.productId);

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
    const totalAmount = cart.reduce((sum: number, item) => {
      const product = productMap.get(item.productId);
      return sum + (Number(product!.price) * item.quantity);
    }, 0);
    
    const profitAmount = cart.reduce((sum: number, item) => {
      const product = productMap.get(item.productId);
      return sum + ((Number(product!.price) - Number(product!.cost || 0)) * item.quantity);
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
    const orderItems = cart.map((item) => {
      const product = productMap.get(item.productId);
      return {
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: Number(product!.price),
        unit_cost: Number(product!.cost || 0),
        subtotal: Number(product!.price) * item.quantity,
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
    const lineItems = cart.map((item) => {
      const product = productMap.get(item.productId);
      
      if (product!.stripe_price_id) {
        return {
          price: product!.stripe_price_id,
          quantity: item.quantity,
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

    console.log(`Checkout session created: ${session.id} for order: ${order.id} from IP: ${clientIP}`);

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