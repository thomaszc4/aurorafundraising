// Automation Engine - Handles automated task execution based on campaign settings
import { supabase } from "@/integrations/supabase/client";
import { getTaskById, TaskDefinition } from "@/data/taskRegistry";

export type AutomationMode = 'manual' | 'approval_required' | 'autopilot';

export interface AutomationSettings {
  id: string;
  campaign_id: string;
  automation_mode: AutomationMode;
  auto_send_invitations: boolean;
  auto_send_reminders: boolean;
  auto_celebrate_milestones: boolean;
  auto_thank_donors: boolean;
  auto_generate_social_posts: boolean;
}

export interface AutomationLogEntry {
  id: string;
  campaign_id: string;
  task_id: string;
  action_type: string;
  status: 'pending' | 'approved' | 'executed' | 'failed' | 'skipped';
  executed_at: string | null;
  executed_by: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Get or create automation settings for a campaign
export async function getAutomationSettings(campaignId: string): Promise<AutomationSettings | null> {
  const { data, error } = await supabase
    .from('campaign_automation_settings')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching automation settings:', error);
    return null;
  }

  return data as AutomationSettings | null;
}

// Create default automation settings for a campaign
export async function createDefaultSettings(campaignId: string): Promise<AutomationSettings | null> {
  const { data, error } = await supabase
    .from('campaign_automation_settings')
    .insert({
      campaign_id: campaignId,
      automation_mode: 'manual',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating automation settings:', error);
    return null;
  }

  return data as AutomationSettings;
}

// Update automation settings
export async function updateAutomationSettings(
  campaignId: string, 
  updates: Partial<Omit<AutomationSettings, 'id' | 'campaign_id'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('campaign_automation_settings')
    .update(updates)
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Error updating automation settings:', error);
    return false;
  }

  return true;
}

// Log an automation action
export async function logAutomationAction(
  campaignId: string,
  taskId: string,
  actionType: string,
  status: AutomationLogEntry['status'],
  details?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('automation_log')
    .insert([{
      campaign_id: campaignId,
      task_id: taskId,
      action_type: actionType,
      status,
      details: details as any,
      executed_at: status === 'executed' ? new Date().toISOString() : null,
    }]);

  if (error) {
    console.error('Error logging automation action:', error);
  }
}

// Check if a task should auto-execute based on settings
export function shouldAutoExecute(
  task: TaskDefinition,
  settings: AutomationSettings
): boolean {
  if (!task.canAutomate) return false;
  if (settings.automation_mode === 'manual') return false;
  
  // Check category-specific settings
  switch (task.category) {
    case 'communications':
      if (task.id.includes('invitation')) return settings.auto_send_invitations;
      if (task.id.includes('reminder') || task.id.includes('push')) return settings.auto_send_reminders;
      if (task.id.includes('thank')) return settings.auto_thank_donors;
      return true;
    case 'engagement':
      return settings.auto_celebrate_milestones;
    case 'social':
      return settings.auto_generate_social_posts;
    default:
      return true;
  }
}

// Execute an automated task
export async function executeTask(
  campaignId: string,
  taskId: string,
  userId?: string
): Promise<{ success: boolean; message: string }> {
  const task = getTaskById(taskId);
  if (!task) {
    return { success: false, message: 'Task not found' };
  }

  try {
    // Log the execution attempt
    await logAutomationAction(campaignId, taskId, task.autoFunction || 'manual', 'executed', {
      executedBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Execute based on the auto function
    switch (task.autoFunction) {
      case 'sendParticipantInvitations':
        return await sendParticipantInvitations(campaignId);
      case 'sendLaunchAnnouncement':
        return await sendCampaignEmail(campaignId, 'launch');
      case 'sendMidCampaignReminder':
        return await sendCampaignEmail(campaignId, 'mid_campaign');
      case 'sendFinalPushReminder':
        return await sendCampaignEmail(campaignId, 'final_push');
      case 'sendParticipantThankYou':
        return await sendCampaignEmail(campaignId, 'thank_participants');
      case 'sendDonorThankYou':
        return await sendDonorThankYouEmails(campaignId);
      case 'closeCampaign':
        return await closeCampaign(campaignId);
      default:
        return { success: false, message: 'No automation handler for this task' };
    }
  } catch (error) {
    console.error('Error executing task:', error);
    await logAutomationAction(campaignId, taskId, task.autoFunction || 'manual', 'failed', {
      error: String(error),
    });
    return { success: false, message: String(error) };
  }
}

// Mark a task as complete
export async function markTaskComplete(
  campaignId: string,
  taskId: string
): Promise<boolean> {
  // First check if task exists in database
  const { data: existingTask } = await supabase
    .from('campaign_tasks')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('task', taskId)
    .maybeSingle();

  if (existingTask) {
    // Update existing task
    const { error } = await supabase
      .from('campaign_tasks')
      .update({ 
        is_completed: true, 
        completed_at: new Date().toISOString() 
      })
      .eq('id', existingTask.id);
    
    return !error;
  } else {
    // Create new task record as completed
    const task = getTaskById(taskId);
    if (!task) return false;

    const { error } = await supabase
      .from('campaign_tasks')
      .insert({
        campaign_id: campaignId,
        task: taskId,
        phase: task.phase,
        is_completed: true,
        completed_at: new Date().toISOString(),
        is_custom: false,
        action_type: task.actionType,
        action_url: task.actionUrl,
        detailed_instructions: task.instructions,
        can_auto_complete: task.canAutomate,
      });
    
    return !error;
  }
}

// Get completed task IDs for a campaign
export async function getCompletedTaskIds(campaignId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('campaign_tasks')
    .select('task')
    .eq('campaign_id', campaignId)
    .eq('is_completed', true);

  if (error) {
    console.error('Error fetching completed tasks:', error);
    return [];
  }

  return data?.map(t => t.task) || [];
}

// ===== Task Implementation Functions =====

async function sendParticipantInvitations(campaignId: string): Promise<{ success: boolean; message: string }> {
  // Get uninvited participants
  const { data: invitations, error } = await supabase
    .from('student_invitations')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('invitation_sent', false);

  if (error) {
    return { success: false, message: 'Failed to fetch participants' };
  }

  if (!invitations || invitations.length === 0) {
    return { success: true, message: 'No pending invitations to send' };
  }

  // Call the send-email edge function for each participant
  let successCount = 0;
  for (const invitation of invitations) {
    try {
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: invitation.student_email,
          subject: 'You\'re Invited to Join Our Fundraiser!',
          template: 'participant_invitation',
          data: {
            name: invitation.student_name,
            campaignId,
          },
        },
      });

      if (!emailError) {
        await supabase
          .from('student_invitations')
          .update({ 
            invitation_sent: true, 
            invitation_sent_at: new Date().toISOString() 
          })
          .eq('id', invitation.id);
        successCount++;
      }
    } catch (e) {
      console.error('Error sending invitation:', e);
    }
  }

  return { 
    success: true, 
    message: `Sent ${successCount} of ${invitations.length} invitations` 
  };
}

async function sendCampaignEmail(
  campaignId: string, 
  emailType: 'launch' | 'mid_campaign' | 'final_push' | 'thank_participants'
): Promise<{ success: boolean; message: string }> {
  // Get all participants for this campaign
  const { data: participants, error } = await supabase
    .from('student_fundraisers')
    .select(`
      id,
      student_id,
      profiles!student_fundraisers_student_id_fkey (
        email,
        full_name
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('is_active', true);

  if (error || !participants) {
    return { success: false, message: 'Failed to fetch participants' };
  }

  const subjectMap = {
    launch: '🚀 Your Fundraiser is Live!',
    mid_campaign: '📊 Halfway There - Keep Going!',
    final_push: '⏰ Final Days - Make Your Last Push!',
    thank_participants: '🎉 Thank You for Your Amazing Effort!',
  };

  let successCount = 0;
  for (const participant of participants) {
    const profile = participant.profiles as { email: string; full_name: string } | null;
    if (!profile?.email) continue;

    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: profile.email,
          subject: subjectMap[emailType],
          template: `campaign_${emailType}`,
          data: {
            name: profile.full_name,
            campaignId,
          },
        },
      });
      successCount++;
    } catch (e) {
      console.error('Error sending email:', e);
    }
  }

  return { 
    success: true, 
    message: `Sent ${successCount} ${emailType} emails` 
  };
}

async function sendDonorThankYouEmails(campaignId: string): Promise<{ success: boolean; message: string }> {
  const { data: donors, error } = await supabase
    .from('donors')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('is_thanked', false);

  if (error || !donors) {
    return { success: false, message: 'Failed to fetch donors' };
  }

  let successCount = 0;
  for (const donor of donors) {
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: donor.email,
          subject: 'Thank You for Your Support! 💝',
          template: 'donor_thank_you',
          data: {
            name: donor.name,
            amount: donor.total_donated,
            campaignId,
          },
        },
      });

      await supabase
        .from('donors')
        .update({ 
          is_thanked: true, 
          thanked_at: new Date().toISOString() 
        })
        .eq('id', donor.id);
      
      successCount++;
    } catch (e) {
      console.error('Error sending thank you email:', e);
    }
  }

  return { 
    success: true, 
    message: `Sent ${successCount} thank you emails to donors` 
  };
}

async function closeCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'completed' })
    .eq('id', campaignId);

  if (error) {
    return { success: false, message: 'Failed to close campaign' };
  }

  return { success: true, message: 'Campaign closed successfully' };
}
