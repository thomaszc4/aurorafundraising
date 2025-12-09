import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ArrowRight, Loader2, Settings2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { SmartTaskItem } from './SmartTaskItem';
import { 
  TASK_REGISTRY, 
  TaskDefinition, 
  TaskContext, 
  getNextTasks,
  PHASE_INFO
} from '@/data/taskRegistry';
import { 
  getAutomationSettings, 
  createDefaultSettings,
  getCompletedTaskIds,
  AutomationSettings
} from '@/services/automationEngine';

interface DashboardTaskListProps {
  campaignId: string;
  fundraiserTypeId: string;
  startDate?: Date;
  onViewAll: () => void;
}

export function DashboardTaskList({ 
  campaignId, 
  fundraiserTypeId, 
  startDate,
  onViewAll 
}: DashboardTaskListProps) {
  const [tasks, setTasks] = useState<TaskDefinition[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings | null>(null);
  const [context, setContext] = useState<TaskContext | null>(null);

  useEffect(() => {
    loadData();
  }, [campaignId, fundraiserTypeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load automation settings
      let settings = await getAutomationSettings(campaignId);
      if (!settings) {
        settings = await createDefaultSettings(campaignId);
      }
      setAutomationSettings(settings);

      // Load completed tasks
      const completed = await getCompletedTaskIds(campaignId);
      setCompletedTaskIds(completed);

      // Build task context
      const taskContext = await buildTaskContext(campaignId, fundraiserTypeId, startDate);
      setContext(taskContext);

      // Get next actionable tasks
      const nextTasks = getNextTasks(taskContext, completed);
      setTasks(nextTasks.slice(0, 5)); // Show top 5 tasks
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTaskContext = async (
    campaignId: string, 
    fundraiserType: string,
    startDate?: Date
  ): Promise<TaskContext> => {
    // Fetch campaign data
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('logo_url, goal_amount, start_date, end_date')
      .eq('id', campaignId)
      .maybeSingle();

    // Fetch participant count
    const { count: participantCount } = await supabase
      .from('student_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    // Check if invitations were sent
    const { count: sentInvitations } = await supabase
      .from('student_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('invitation_sent', true);

    // Check for products
    const { count: productCount } = await supabase
      .from('campaign_products')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    // Check for social posts
    const { count: postCount } = await supabase
      .from('campaign_posts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    // Calculate total raised
    const { data: fundraisers } = await supabase
      .from('student_fundraisers')
      .select('total_raised')
      .eq('campaign_id', campaignId);
    
    const totalRaised = fundraisers?.reduce((sum, f) => sum + (f.total_raised || 0), 0) || 0;

    const now = new Date();
    const campaignStart = campaign?.start_date ? new Date(campaign.start_date) : startDate;
    const campaignEnd = campaign?.end_date ? new Date(campaign.end_date) : undefined;

    return {
      campaignId,
      fundraiserType,
      hasLogo: !!campaign?.logo_url,
      hasParticipants: (participantCount || 0) > 0,
      participantCount: participantCount || 0,
      invitationsSent: (sentInvitations || 0) > 0,
      hasProducts: (productCount || 0) > 0,
      hasSocialPosts: (postCount || 0) > 0,
      campaignStarted: campaignStart ? now >= campaignStart : false,
      campaignEnded: campaignEnd ? now >= campaignEnd : false,
      daysUntilStart: campaignStart ? Math.ceil((campaignStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      daysUntilEnd: campaignEnd ? Math.ceil((campaignEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      totalRaised,
      goalAmount: campaign?.goal_amount || 0,
    };
  };

  const handleTaskComplete = () => {
    loadData(); // Reload tasks after completion
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">All tasks completed! 🎉</p>
          <Button variant="link" onClick={onViewAll} className="mt-2">
            View Project Manager
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isAutopilot = automationSettings?.automation_mode === 'autopilot';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Your Next Tasks
            </CardTitle>
            {isAutopilot && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Zap className="h-3 w-3 mr-1" />
                Autopilot Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
              <Settings2 className="h-4 w-4" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <SmartTaskItem
            key={task.id}
            task={task}
            campaignId={campaignId}
            isComplete={completedTaskIds.includes(task.id)}
            isAutopilot={isAutopilot}
            onComplete={handleTaskComplete}
          />
        ))}
      </CardContent>
    </Card>
  );
}
