import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ChevronRight, ChevronDown, Clock, CheckCircle2, 
  Sparkles, BookOpen, ArrowLeft, Plus, Pencil, Bell, BellOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFundraiserTypeById, FundraiserType } from '@/data/fundraiserTypes';
import { TaskEditor, CustomTask } from './TaskEditor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FundraiserProjectManagerProps {
  campaignId: string;
  fundraiserTypeId: string;
  startDate?: Date;
  onClose?: () => void;
}

interface TaskState {
  [taskId: string]: boolean;
}

interface DbTask {
  id: string;
  campaign_id: string;
  phase: string;
  task: string;
  description: string | null;
  days_before_event: number | null;
  is_completed: boolean;
  is_custom: boolean;
  display_order: number;
}

export function FundraiserProjectManager({ 
  campaignId, 
  fundraiserTypeId,
  startDate,
  onClose 
}: FundraiserProjectManagerProps) {
  const { user } = useAuth();
  const [fundraiserType, setFundraiserType] = useState<FundraiserType | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskState>({});
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<CustomTask | undefined>();
  const [customTasks, setCustomTasks] = useState<DbTask[]>([]);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const type = getFundraiserTypeById(fundraiserTypeId);
    if (type) {
      setFundraiserType(type);
      if (type.projectManagerSteps.length > 0) {
        setExpandedPhases([type.projectManagerSteps[0].phase]);
      }
    }
  }, [fundraiserTypeId]);

  useEffect(() => {
    fetchCustomTasks();
    loadCompletedTasks();
  }, [campaignId]);

  const fetchCustomTasks = async () => {
    const { data } = await supabase
      .from('campaign_tasks')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('display_order');
    
    if (data) {
      setCustomTasks(data as DbTask[]);
      const completed: TaskState = {};
      data.forEach((task: any) => {
        if (task.is_completed) {
          completed[`custom-${task.id}`] = true;
        }
      });
      setCompletedTasks(prev => ({ ...prev, ...completed }));
    }
  };

  const loadCompletedTasks = () => {
    const saved = localStorage.getItem(`project-manager-${campaignId}`);
    if (saved) {
      setCompletedTasks(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
  };

  useEffect(() => {
    if (Object.keys(completedTasks).length > 0) {
      localStorage.setItem(`project-manager-${campaignId}`, JSON.stringify(completedTasks));
    }
  }, [completedTasks, campaignId]);

  const toggleTask = async (taskId: string, isCustom: boolean = false) => {
    const newCompleted = !completedTasks[taskId];
    setCompletedTasks(prev => ({ ...prev, [taskId]: newCompleted }));

    if (isCustom) {
      const customTaskId = taskId.replace('custom-', '');
      await supabase
        .from('campaign_tasks')
        .update({ 
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null
        })
        .eq('id', customTaskId);
    }
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => 
      prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]
    );
  };

  const handleSaveTask = async (task: CustomTask) => {
    setLoading(true);
    try {
      if (task.id) {
        await supabase
          .from('campaign_tasks')
          .update({
            phase: task.phase,
            task: task.task,
            description: task.description,
            days_before_event: task.daysBeforeEvent
          })
          .eq('id', task.id);
        toast.success('Task updated');
      } else {
        await supabase
          .from('campaign_tasks')
          .insert({
            campaign_id: campaignId,
            phase: task.phase,
            task: task.task,
            description: task.description,
            days_before_event: task.daysBeforeEvent,
            is_custom: true
          });
        toast.success('Task added');
      }
      fetchCustomTasks();
    } catch (error) {
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
      setEditingTask(undefined);
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask?.id) return;
    setLoading(true);
    try {
      await supabase.from('campaign_tasks').delete().eq('id', editingTask.id);
      toast.success('Task deleted');
      fetchCustomTasks();
      setShowTaskEditor(false);
      setEditingTask(undefined);
    } catch (error) {
      toast.error('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const scheduleReminders = async () => {
    if (!user || !startDate) return;
    setLoading(true);
    try {
      await supabase
        .from('task_reminders')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id);

      if (remindersEnabled) {
        const reminders: { campaign_id: string; task_id: string | null; user_id: string; reminder_date: string }[] = [];

        customTasks.forEach(task => {
          if (task.days_before_event && !task.is_completed) {
            const reminderDate = new Date(startDate);
            reminderDate.setDate(reminderDate.getDate() - task.days_before_event - 1);
            if (reminderDate > new Date()) {
              reminders.push({
                campaign_id: campaignId,
                task_id: task.id,
                user_id: user.id,
                reminder_date: reminderDate.toISOString().split('T')[0]
              });
            }
          }
        });

        if (reminders.length > 0) {
          await supabase.from('task_reminders').insert(reminders);
        }
        toast.success(`Scheduled ${reminders.length} email reminders`);
      } else {
        toast.success('Reminders disabled');
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      toast.error('Failed to schedule reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && startDate) {
      scheduleReminders();
    }
  }, [remindersEnabled]);

  const getPhaseProgress = (phaseIndex: number, taskCount: number, phaseCustomTasks: DbTask[]): number => {
    let completed = 0;
    let total = taskCount + phaseCustomTasks.length;
    
    for (let i = 0; i < taskCount; i++) {
      if (completedTasks[`${phaseIndex}-${i}`]) completed++;
    }
    phaseCustomTasks.forEach(task => {
      if (completedTasks[`custom-${task.id}`]) completed++;
    });
    
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getTotalProgress = (): number => {
    if (!fundraiserType) return 0;
    let total = customTasks.length;
    let completed = customTasks.filter(t => completedTasks[`custom-${t.id}`]).length;
    
    fundraiserType.projectManagerSteps.forEach((phase, phaseIndex) => {
      phase.tasks.forEach((_, taskIndex) => {
        total++;
        if (completedTasks[`${phaseIndex}-${taskIndex}`]) completed++;
      });
    });
    
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getDueDateLabel = (daysBeforeEvent?: number): string | null => {
    if (!daysBeforeEvent || !startDate) return null;
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() - daysBeforeEvent);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDueDateColor = (daysBeforeEvent?: number): string => {
    if (!daysBeforeEvent || !startDate) return 'text-muted-foreground';
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() - daysBeforeEvent);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-destructive';
    if (diffDays <= 3) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const getAllPhases = (): string[] => {
    if (!fundraiserType) return [];
    const phases = fundraiserType.projectManagerSteps.map(p => p.phase);
    customTasks.forEach(task => {
      if (!phases.includes(task.phase)) {
        phases.push(task.phase);
      }
    });
    return phases;
  };

  if (!fundraiserType) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading project manager...</p>
        </CardContent>
      </Card>
    );
  }

  const Icon = fundraiserType.icon;
  const totalProgress = getTotalProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className={cn(
            "h-14 w-14 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg",
            fundraiserType.color
          )}>
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{fundraiserType.label}</h2>
            <p className="text-muted-foreground">Project Manager</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{Math.round(totalProgress)}%</div>
          <p className="text-sm text-muted-foreground">Complete</p>
        </div>
      </div>

      {/* Progress & Reminders */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2 flex-1 mr-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(totalProgress)}%</span>
              </div>
              <Progress value={totalProgress} className="h-3" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="reminders" checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
              <Label htmlFor="reminders" className="flex items-center gap-1 text-sm cursor-pointer">
                {remindersEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                Email Reminders
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Task Checklist
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Success Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setEditingTask(undefined); setShowTaskEditor(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Custom Task
            </Button>
          </div>
          
          <div className="space-y-4">
            {fundraiserType.projectManagerSteps.map((phase, phaseIndex) => {
              const isExpanded = expandedPhases.includes(phase.phase);
              const phaseCustomTasks = customTasks.filter(t => t.phase === phase.phase);
              const progress = getPhaseProgress(phaseIndex, phase.tasks.length, phaseCustomTasks);
              const completedCount = phase.tasks.filter((_, i) => completedTasks[`${phaseIndex}-${i}`]).length 
                + phaseCustomTasks.filter(t => completedTasks[`custom-${t.id}`]).length;
              const totalCount = phase.tasks.length + phaseCustomTasks.length;

              return (
                <Card key={phase.phase} className="overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase.phase)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{phase.phase}</h3>
                        <p className="text-sm text-muted-foreground">{completedCount} of {totalCount} tasks complete</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32"><Progress value={progress} className="h-2" /></div>
                      {progress === 100 ? (
                        <Badge variant="default" className="bg-emerald-500">Complete</Badge>
                      ) : progress > 0 ? (
                        <Badge variant="secondary">In Progress</Badge>
                      ) : (
                        <Badge variant="outline">Not Started</Badge>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4">
                      <div className="border-t pt-4 space-y-3">
                        {phase.tasks.map((task, taskIndex) => {
                          const taskId = `${phaseIndex}-${taskIndex}`;
                          const isComplete = completedTasks[taskId];
                          const dueLabel = getDueDateLabel(task.daysBeforeEvent);
                          const dueColor = getDueDateColor(task.daysBeforeEvent);

                          return (
                            <div key={taskIndex} className={cn(
                              "flex items-start gap-3 p-3 rounded-lg transition-colors",
                              isComplete ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/30 hover:bg-muted/50"
                            )}>
                              <Checkbox checked={isComplete} onCheckedChange={() => toggleTask(taskId)} className="mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn("font-medium", isComplete ? "line-through text-muted-foreground" : "text-foreground")}>{task.task}</span>
                                  {dueLabel && <span className={cn("text-xs flex items-center gap-1", dueColor)}><Clock className="h-3 w-3" />{dueLabel}</span>}
                                </div>
                                <p className={cn("text-sm mt-1", isComplete ? "text-muted-foreground/60" : "text-muted-foreground")}>{task.description}</p>
                              </div>
                              {isComplete && <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                            </div>
                          );
                        })}
                        
                        {phaseCustomTasks.map(task => {
                          const taskId = `custom-${task.id}`;
                          const isComplete = completedTasks[taskId];
                          const dueLabel = getDueDateLabel(task.days_before_event || undefined);
                          const dueColor = getDueDateColor(task.days_before_event || undefined);

                          return (
                            <div key={task.id} className={cn(
                              "flex items-start gap-3 p-3 rounded-lg transition-colors border-l-2 border-primary",
                              isComplete ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-primary/5 hover:bg-primary/10"
                            )}>
                              <Checkbox checked={isComplete} onCheckedChange={() => toggleTask(taskId, true)} className="mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn("font-medium", isComplete ? "line-through text-muted-foreground" : "text-foreground")}>{task.task}</span>
                                  <Badge variant="outline" className="text-xs">Custom</Badge>
                                  {dueLabel && <span className={cn("text-xs flex items-center gap-1", dueColor)}><Clock className="h-3 w-3" />{dueLabel}</span>}
                                </div>
                                <p className={cn("text-sm mt-1", isComplete ? "text-muted-foreground/60" : "text-muted-foreground")}>{task.description}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                                e.stopPropagation();
                                setEditingTask({ id: task.id, phase: task.phase, task: task.task, description: task.description || '', daysBeforeEvent: task.days_before_event || undefined, isCustom: true });
                                setShowTaskEditor(true);
                              }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {isComplete && <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="guide" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {fundraiserType.label} Success Guide
              </CardTitle>
              <CardDescription>Follow these steps to run a successful {fundraiserType.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fundraiserType.successGuide.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br", fundraiserType.color)}>{index + 1}</div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary">${fundraiserType.avgRaised}</div>
                <p className="text-xs text-muted-foreground">Avg. Raised/Person</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Badge variant={fundraiserType.difficulty === 'easy' ? 'default' : fundraiserType.difficulty === 'medium' ? 'secondary' : 'destructive'} 
                  className={fundraiserType.difficulty === 'easy' ? 'bg-emerald-500' : fundraiserType.difficulty === 'medium' ? 'bg-amber-500' : ''}>
                  {fundraiserType.difficulty.charAt(0).toUpperCase() + fundraiserType.difficulty.slice(1)}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">Difficulty</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-lg font-bold text-foreground">{fundraiserType.timeToOrganize}</div>
                <p className="text-xs text-muted-foreground">Time to Organize</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <TaskEditor open={showTaskEditor} onOpenChange={setShowTaskEditor} task={editingTask} phases={getAllPhases()} onSave={handleSaveTask} onDelete={editingTask?.id ? handleDeleteTask : undefined} />
    </div>
  );
}

export default FundraiserProjectManager;
