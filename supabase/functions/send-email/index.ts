import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'student_invitation' | 'order_confirmation' | 'order_notification';
  to: string;
  data: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();
    console.log(`Sending ${type} email to ${to}`);

    let subject = '';
    let html = '';

    switch (type) {
      case 'student_invitation':
        subject = `You're invited to join ${data.campaignName} fundraiser!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to ${data.campaignName}!</h1>
            <p>Hi ${data.studentName},</p>
            <p>You've been invited to participate in the ${data.campaignName} fundraiser for ${data.organizationName}.</p>
            <p>Click the link below to set up your account and start fundraising:</p>
            <a href="${data.magicLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Join the Fundraiser
            </a>
            <p>The fundraiser runs from ${data.startDate} to ${data.endDate}.</p>
            <p>Good luck!</p>
          </div>
        `;
        break;

      case 'order_confirmation':
        subject = `Order Confirmation - Thank you for supporting ${data.studentName}!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Thank You for Your Order!</h1>
            <p>Hi ${data.customerName},</p>
            <p>Thank you for supporting ${data.studentName} in their fundraising efforts!</p>
            <h2>Order Details</h2>
            <p><strong>Order ID:</strong> ${data.orderId}</p>
            <p><strong>Total:</strong> $${data.totalAmount}</p>
            <h3>Items:</h3>
            <ul>
              ${data.items?.map((item: any) => `<li>${item.name} x ${item.quantity} - $${item.subtotal}</li>`).join('') || ''}
            </ul>
            <p>You'll receive another email when your order ships.</p>
            <p>Thank you for your support!</p>
          </div>
        `;
        break;

      case 'order_notification':
        subject = `New Order! ${data.customerName} just supported your fundraiser`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">New Order Received!</h1>
            <p>Great news! ${data.customerName} just placed an order supporting your fundraiser.</p>
            <p><strong>Order Total:</strong> $${data.totalAmount}</p>
            <p><strong>Your Profit:</strong> $${data.profitAmount}</p>
            <p>Keep up the great work!</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Aurora Fundraising <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: emailResponse.ok ? 200 : 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
