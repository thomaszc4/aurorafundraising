import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskReminder {
  id: string;
  campaign_id: string;
  task_id: string | null;
  user_id: string;
  reminder_date: string;
  campaigns: {
    name: string;
    organization_name: string;
    start_date: string | null;
  };
  campaign_tasks: {
    task: string;
    description: string | null;
    phase: string;
    days_before_event: number | null;
  } | null;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch reminders due today that haven't been sent
    const { data: reminders, error: fetchError } = await supabase
      .from('task_reminders')
      .select(`
        id,
        campaign_id,
        task_id,
        user_id,
        reminder_date,
        campaigns!inner (name, organization_name, start_date),
        campaign_tasks (task, description, phase, days_before_event),
        profiles!inner (email, full_name)
      `)
      .eq('reminder_date', today)
      .eq('sent', false);

    if (fetchError) {
      throw fetchError;
    }

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to send today" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const sentReminders: string[] = [];
    const errors: string[] = [];

    for (const reminder of reminders as unknown as TaskReminder[]) {
      const campaign = reminder.campaigns;
      const task = reminder.campaign_tasks;
      const profile = reminder.profiles;

      const taskInfo = task 
        ? `<strong>${task.task}</strong><br/><em>${task.phase}</em><br/>${task.description || ''}`
        : 'General campaign reminder';

      const daysInfo = task?.days_before_event 
        ? `<p>This task is due ${task.days_before_event} days before your event.</p>`
        : '';

      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Aurora Fundraising <onboarding@resend.dev>",
            to: [profile.email],
            subject: `Task Reminder: ${task?.task || campaign.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #6366f1;">Task Reminder</h1>
                <p>Hi ${profile.full_name || 'there'},</p>
                <p>This is a reminder about an upcoming task for your fundraiser:</p>
                
                <div style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 16px; margin: 16px 0;">
                  <h3 style="margin: 0 0 8px 0;">${campaign.name}</h3>
                  <p style="margin: 0; color: #64748b;">${campaign.organization_name}</p>
                </div>
                
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
                  ${taskInfo}
                </div>
                
                ${daysInfo}
                
                <p>Log in to your dashboard to mark this task as complete and view your full project plan.</p>
                
                <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
                  — The Aurora Fundraising Team
                </p>
              </div>
            `,
          }),
        });

        if (!emailRes.ok) {
          throw new Error(`Email API error: ${await emailRes.text()}`);
        }

        // Mark as sent
        await supabase
          .from('task_reminders')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', reminder.id);

        sentReminders.push(reminder.id);
      } catch (emailError: any) {
        console.error(`Failed to send reminder ${reminder.id}:`, emailError);
        errors.push(`${reminder.id}: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        sent: sentReminders.length,
        errors: errors.length,
        details: { sentReminders, errors }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-task-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
