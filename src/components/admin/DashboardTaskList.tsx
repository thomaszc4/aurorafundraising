import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ArrowRight, Calendar, Loader2 } from 'lucide-react';
import { format, isPast, isToday, addDays, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { getFundraiserTypeById } from '@/data/fundraiserTypes';

interface Task {
  id: string;
  task: string;
  description: string | null;
  phase: string;
  is_completed: boolean;
  is_custom: boolean;
  days_before_event: number | null;
  display_order: number;
  dueDate?: Date;
}

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [campaignId, fundraiserTypeId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch custom tasks from database
      const { data: customTasks, error } = await supabase
        .from('campaign_tasks')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('is_completed', false)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Get default tasks from fundraiser type
      const fundraiserType = getFundraiserTypeById(fundraiserTypeId);
      const defaultTasks: Task[] = [];

      if (fundraiserType?.projectManagerSteps) {
        fundraiserType.projectManagerSteps.forEach((phase, phaseIndex) => {
          phase.tasks.forEach((task, taskIndex) => {
            // Check if this task exists in customTasks (by matching task name)
            const existsInDb = customTasks?.find(
              ct => ct.task === task.task && ct.phase === phase.phase
            );
            
            if (!existsInDb) {
              let dueDate: Date | undefined;
              if (startDate && task.daysBeforeEvent !== undefined) {
                dueDate = addDays(startDate, -task.daysBeforeEvent);
              }

              defaultTasks.push({
                id: `default-${phaseIndex}-${taskIndex}`,
                task: task.task,
                description: task.description,
                phase: phase.phase,
                is_completed: false,
                is_custom: false,
                days_before_event: task.daysBeforeEvent ?? null,
                display_order: phaseIndex * 100 + taskIndex,
                dueDate,
              });
            }
          });
        });
      }

      // Combine and add due dates to custom tasks
      const allTasks = [
        ...defaultTasks,
        ...(customTasks?.map(ct => {
          let dueDate: Date | undefined;
          if (startDate && ct.days_before_event) {
            dueDate = addDays(startDate, -ct.days_before_event);
          }
          return {
            ...ct,
            dueDate,
          };
        }) || []),
      ];

      // Sort by due date (soonest first) then by display_order
      allTasks.sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.display_order - b.display_order;
      });

      // Only show first 6 tasks
      setTasks(allTasks.slice(0, 6));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    try {
      if (task.is_custom || task.id.startsWith('default-')) {
        // For default tasks, create a new record in the database
        if (!task.is_custom) {
          const { error } = await supabase
            .from('campaign_tasks')
            .insert({
              campaign_id: campaignId,
              task: task.task,
              description: task.description,
              phase: task.phase,
              is_completed: true,
              is_custom: false,
              days_before_event: task.days_before_event,
              display_order: task.display_order,
              completed_at: new Date().toISOString(),
            });

          if (error) throw error;
        } else {
          // For existing custom tasks, update them
          const { error } = await supabase
            .from('campaign_tasks')
            .update({
              is_completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq('id', task.id);

          if (error) throw error;
        }

        toast.success('Task completed!');
        setTasks(prev => prev.filter(t => t.id !== task.id));
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const getDueDateBadge = (task: Task) => {
    if (!task.dueDate) return null;

    if (isPast(task.dueDate) && !isToday(task.dueDate)) {
      return (
        <Badge variant="destructive" className="text-xs">
          Overdue
        </Badge>
      );
    }

    if (isToday(task.dueDate)) {
      return (
        <Badge variant="default" className="text-xs bg-amber-500">
          Due Today
        </Badge>
      );
    }

    const inThreeDays = addDays(new Date(), 3);
    if (isBefore(task.dueDate, inThreeDays)) {
      return (
        <Badge variant="secondary" className="text-xs">
          Due {format(task.dueDate, 'MMM d')}
        </Badge>
      );
    }

    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {format(task.dueDate, 'MMM d')}
      </span>
    );
  };

  const getPhaseBadge = (phase: string) => {
    const phaseColors: Record<string, string> = {
      'Planning & Setup': 'bg-blue-500/10 text-blue-700',
      'Pre-Launch': 'bg-purple-500/10 text-purple-700',
      'Active Fundraising': 'bg-green-500/10 text-green-700',
      'Close & Thank': 'bg-amber-500/10 text-amber-700',
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${phaseColors[phase] || 'bg-muted text-muted-foreground'}`}
      >
        {phase}
      </Badge>
    );
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Your Next Tasks
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id={task.id}
              onCheckedChange={() => handleCompleteTask(task)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <label
                htmlFor={task.id}
                className="text-sm font-medium cursor-pointer block"
              >
                {task.task}
              </label>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {getPhaseBadge(task.phase)}
                {getDueDateBadge(task)}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
