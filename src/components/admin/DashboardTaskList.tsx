import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, ArrowRight, Loader2, ExternalLink, Calendar, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProjectManagerTasks } from '@/hooks/useProjectManagerTasks';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DashboardTaskListProps {
  campaignId: string;
  fundraiserTypeId: string;
  startDate?: Date;
  endDate?: Date;
  onViewAll: () => void;
}

export function DashboardTaskList({
  campaignId,
  fundraiserTypeId,
  startDate,
  endDate,
  onViewAll
}: DashboardTaskListProps) {
  const navigate = useNavigate();
  const { tasks, loading, toggleTask } = useProjectManagerTasks(campaignId, fundraiserTypeId, startDate, endDate);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Filter for upcoming tasks (not completed)
  const upcomingTasks = tasks
    .filter(t => !t.is_completed)
    .sort((a, b) => {
      // Sort by due date (nulls last)
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.getTime() - b.due_date.getTime();
    })
    .slice(0, 5);

  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (upcomingTasks.length === 0 && tasks.length > 0) {
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
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Your Next Tasks
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-normal text-xs">
                {Math.round(progress)}% Complete
              </Badge>
              {tasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedCount} of {totalCount} tasks done
                </span>
              )}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <TooltipProvider>
          {upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 rounded-lg border bg-card/50 hover:bg-card hover:shadow-sm transition-all border-border/50"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={() => toggleTask(task.id, task.is_completed)}
                  className="mt-1 h-5 w-5 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-foreground truncate pr-2">{task.task}</h4>
                    {task.due_date && (
                      <Badge variant="outline" className={cn(
                        "scale-90 origin-right whitespace-nowrap",
                        task.due_date < new Date() ? "text-destructive border-destructive/30" : "text-muted-foreground"
                      )}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {Number(formatDistanceToNow(task.due_date, { addSuffix: true }).replace(/[^0-9]/g, '')) < 2 && task.due_date < new Date()
                          ? "Overdue"
                          : formatDistanceToNow(task.due_date, { addSuffix: true })}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {task.description}
                  </p>

                  <div className="flex items-center gap-2">
                    {task.action_url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => navigate(task.action_url!)}
                      >
                        Action <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}

                    {(task.detailed_instructions || task.description) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground">
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p>{task.detailed_instructions || task.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <span className="text-xs text-muted-foreground/50 ml-auto capitalize">
                      {task.phase} Phase
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TooltipProvider>

        {tasks.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>No tasks found. Visit Project Manager to set up your plan.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
