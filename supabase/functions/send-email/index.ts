import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'student_invitation' | 'order_confirmation' | 'order_notification' | 'donor_communication' | 'survey_invitation' | 'impact_update';
  to: string;
  data: Record<string, any>;
  trackingId?: string;
  abTestId?: string;
  variant?: 'a' | 'b';
  donorId?: string;
}

// Function to wrap links with tracking
function wrapLinksWithTracking(html: string, trackingId: string, baseUrl: string): string {
  // Match href attributes with URLs
  const linkRegex = /href="(https?:\/\/[^"]+)"/gi;
  
  return html.replace(linkRegex, (match, url) => {
    // Don't track unsubscribe or preference links (they already go to our app)
    if (url.includes('/preferences') || url.includes('/unsubscribe')) {
      return match;
    }
    const encodedUrl = encodeURIComponent(url);
    const trackingUrl = `${baseUrl}/functions/v1/track-email?id=${trackingId}&type=click&url=${encodedUrl}`;
    return `href="${trackingUrl}"`;
  });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data, trackingId, abTestId, variant, donorId }: EmailRequest = await req.json();
    console.log(`Sending ${type} email to ${to}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let subject = '';
    let html = '';
    let emailTrackingId = trackingId;

    // Create tracking record if we have donor info
    if (donorId && !emailTrackingId) {
      const { data: trackingData, error: trackingError } = await supabase
        .from('email_tracking')
        .insert({
          donor_id: donorId,
          ab_test_id: abTestId || null,
          variant: variant || null,
          sent_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!trackingError && trackingData) {
        emailTrackingId = trackingData.id;
      }
    }

    // Build tracking pixel URL
    const trackingPixelUrl = emailTrackingId 
      ? `${supabaseUrl}/functions/v1/track-email?id=${emailTrackingId}&type=open`
      : null;

    // Build preference center URL
    const preferenceCenterUrl = donorId 
      ? `${data.appUrl || 'https://aurora-fundraising.lovable.app'}/preferences/${donorId}`
      : null;

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
            ${preferenceCenterUrl ? `
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 12px; color: #6b7280;">
                <a href="${preferenceCenterUrl}" style="color: #2563eb;">Update your preferences</a> | 
                Manage how you appear on our supporter wall and communication settings
              </p>
            ` : ''}
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

      case 'donor_communication':
        subject = data.subject || 'Message from our fundraising team';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${data.content}
            ${preferenceCenterUrl ? `
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 12px; color: #6b7280;">
                <a href="${preferenceCenterUrl}" style="color: #2563eb;">Update your preferences</a> | 
                Manage your communication and recognition settings
              </p>
            ` : ''}
          </div>
        `;
        break;

      case 'survey_invitation':
        subject = `We'd love your feedback - ${data.campaignName}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Your Opinion Matters!</h1>
            <p>Hi ${data.donorName},</p>
            <p>Thank you for supporting ${data.campaignName}! We'd love to hear about your experience.</p>
            <p>Your feedback helps us improve and serve our community better.</p>
            <a href="${data.surveyUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Share Your Feedback
            </a>
            <p>This survey only takes 2-3 minutes to complete.</p>
            <p>Thank you for your continued support!</p>
            ${preferenceCenterUrl ? `
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 12px; color: #6b7280;">
                <a href="${preferenceCenterUrl}" style="color: #2563eb;">Update your preferences</a>
              </p>
            ` : ''}
          </div>
        `;
        break;

      case 'impact_update':
        subject = data.title || 'See the impact of your donation';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">${data.title}</h1>
            ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Impact" style="width: 100%; border-radius: 8px; margin: 16px 0;" />` : ''}
            ${data.statValue ? `
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 16px 0;">
                <p style="font-size: 36px; font-weight: bold; color: #2563eb; margin: 0;">${data.statValue}</p>
                <p style="color: #6b7280; margin: 8px 0 0 0;">${data.statDescription || ''}</p>
              </div>
            ` : ''}
            ${data.story ? `<p>${data.story}</p>` : ''}
            <p>Thank you for making this possible!</p>
            ${preferenceCenterUrl ? `
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 12px; color: #6b7280;">
                <a href="${preferenceCenterUrl}" style="color: #2563eb;">Update your preferences</a>
              </p>
            ` : ''}
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Wrap links with click tracking if we have a tracking ID
    if (emailTrackingId) {
      html = wrapLinksWithTracking(html, emailTrackingId, supabaseUrl);
    }

    // Add tracking pixel to all emails if we have a tracking ID
    if (trackingPixelUrl) {
      html += `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
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

    return new Response(JSON.stringify({ ...result, trackingId: emailTrackingId }), {
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
