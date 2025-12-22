
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
  Sparkles, BookOpen, Plus, Bell, BellOff,
  Download, GripVertical, ExternalLink, CalendarRange, ListTodo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFundraiserTypeById, FundraiserType } from '@/data/fundraiserTypes';
import { useProjectManagerTasks } from '@/hooks/useProjectManagerTasks';
import { ProjectGanttChart } from './ProjectGanttChart';
import { TaskEditor, CustomTask } from './TaskEditor';
import { toast } from 'sonner';
import { exportProjectManagerToPdf } from '@/utils/exportPdf';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, format } from 'date-fns';

interface FundraiserProjectManagerProps {
  campaignId: string;
  fundraiserTypeId: string;
  startDate?: Date;
  endDate?: Date;
  onClose?: () => void;
  onNavigate?: (view: string) => void;
}

export function FundraiserProjectManager({
  campaignId,
  fundraiserTypeId,
  startDate,
  endDate,
  onClose,
  onNavigate
}: FundraiserProjectManagerProps) {
  const { user } = useAuth();
  const [fundraiserType, setFundraiserType] = useState<FundraiserType | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<CustomTask | undefined>();
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  // Unified Hook
  const { tasks, loading, toggleTask, refresh } = useProjectManagerTasks(campaignId, fundraiserTypeId, startDate, endDate);

  useEffect(() => {
    const type = getFundraiserTypeById(fundraiserTypeId);
    if (type) {
      setFundraiserType(type);
      if (type.projectManagerSteps.length > 0) {
        setExpandedPhases([type.projectManagerSteps[0].phase]);
      }
    }
  }, [fundraiserTypeId]);

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev =>
      prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase]
    );
  };

  const handleDragEnd = async (event: any) => {
    // D&D disabled for unified list for now
  };

  const handleExportPdf = async () => {
    // Re-implement if needed using task list
    toast.info("Export PDF momentarily unavailable in this version.");
  };

  const handleSaveTask = async (task: CustomTask) => {
    // Re-implement standard save logic using Supabase directly or extending hook
    // For now we just refresh
    refresh();
    setShowTaskEditor(false);
  };

  const handleDeleteTask = async () => {
    // Re-implement
    refresh();
    setShowTaskEditor(false);
  };

  if (!fundraiserType || loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading project manager...</p>
        </CardContent>
      </Card>
    );
  }

  const Icon = fundraiserType.icon;
  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;
  const totalProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Get unique phases from tasks to ensure we cover custom phases too
  const uniquePhases = Array.from(new Set(tasks.map(t => t.phase)));
  // Sort phases based on FundraiserType order + any new ones
  const sortedPhases = uniquePhases.sort((a, b) => {
    const idxA = fundraiserType.projectManagerSteps.findIndex(p => p.phase === a);
    const idxB = fundraiserType.projectManagerSteps.findIndex(p => p.phase === b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
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
      <div className="glass-card p-6 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2 flex-1 mr-4">
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Success Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <ProjectGanttChart
            tasks={tasks}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <div className="flex justify-end gap-2 mb-4">
            <Button onClick={() => { setEditingTask(undefined); setShowTaskEditor(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Custom Task
            </Button>
          </div>

          <div className="space-y-4">
            {sortedPhases.map((phase) => {
              const phaseTasks = tasks.filter(t => t.phase === phase);
              const isExpanded = expandedPhases.includes(phase);
              const phaseCompleted = phaseTasks.filter(t => t.is_completed).length;
              const phaseTotal = phaseTasks.length;
              const phaseProgress = phaseTotal > 0 ? (phaseCompleted / phaseTotal) * 100 : 0;

              return (
                <Card key={phase} className="overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{phase}</h3>
                        <p className="text-sm text-muted-foreground">{phaseCompleted} of {phaseTotal} tasks complete</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32"><Progress value={phaseProgress} className="h-2" /></div>
                      {phaseProgress === 100 ? (
                        <Badge variant="default" className="bg-emerald-500">Complete</Badge>
                      ) : phaseProgress > 0 ? (
                        <Badge variant="secondary">In Progress</Badge>
                      ) : (
                        <Badge variant="outline">Not Started</Badge>
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4">
                      <div className="border-t pt-4 space-y-3">
                        {phaseTasks.map((task) => {
                          const isOverdue = task.due_date && task.due_date < new Date() && !task.is_completed;

                          return (
                            <div key={task.id} className={cn(
                              "flex items-start gap-3 p-3 rounded-lg transition-colors",
                              task.is_completed ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/30 hover:bg-muted/50"
                            )}>
                              <Checkbox
                                checked={task.is_completed}
                                onCheckedChange={() => toggleTask(task.id, task.is_completed)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn("font-medium", task.is_completed ? "line-through text-muted-foreground" : "text-foreground")}>
                                    {task.task}
                                  </span>
                                  {task.due_date && (
                                    <span className={cn(
                                      "text-xs flex items-center gap-1",
                                      isOverdue ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                      <Clock className="h-3 w-3" />
                                      {format(task.due_date, 'MMM d')}
                                    </span>
                                  )}
                                  {task.is_custom && <Badge variant="outline" className="text-[10px] h-5">Custom</Badge>}
                                </div>
                                <p className={cn("text-sm mt-1", task.is_completed ? "text-muted-foreground/60" : "text-muted-foreground")}>
                                  {task.description}
                                </p>
                              </div>

                              {task.action_url && !task.is_completed && onNavigate && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onNavigate!(task.action_url!.replace('/admin?view=', ''))}
                                  className="gap-1.5 shrink-0"
                                >
                                  {task.action_label || 'Go'}
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
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
        </TabsContent>
      </Tabs>

      <TaskEditor
        open={showTaskEditor}
        onOpenChange={setShowTaskEditor}
        task={editingTask}
        phases={sortedPhases}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}

export default FundraiserProjectManager;
