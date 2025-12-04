import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronRight, ChevronDown, Calendar, Clock, CheckCircle2, 
  Circle, AlertCircle, Sparkles, BookOpen, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  FUNDRAISER_CATEGORIES, 
  getFundraiserTypeById, 
  FundraiserType,
  FundraiserCategory as FundraiserCategoryType
} from '@/data/fundraiserTypes';

interface FundraiserProjectManagerProps {
  campaignId: string;
  fundraiserTypeId: string;
  startDate?: Date;
  onClose?: () => void;
}

interface TaskState {
  [taskId: string]: boolean;
}

export function FundraiserProjectManager({ 
  campaignId, 
  fundraiserTypeId,
  startDate,
  onClose 
}: FundraiserProjectManagerProps) {
  const [fundraiserType, setFundraiserType] = useState<FundraiserType | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskState>({});
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    const type = getFundraiserTypeById(fundraiserTypeId);
    if (type) {
      setFundraiserType(type);
      // Expand the first phase by default
      if (type.projectManagerSteps.length > 0) {
        setExpandedPhases([type.projectManagerSteps[0].phase]);
      }
    }
  }, [fundraiserTypeId]);

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`project-manager-${campaignId}`);
    if (saved) {
      setCompletedTasks(JSON.parse(saved));
    }
  }, [campaignId]);

  // Save progress to localStorage
  useEffect(() => {
    if (Object.keys(completedTasks).length > 0) {
      localStorage.setItem(`project-manager-${campaignId}`, JSON.stringify(completedTasks));
    }
  }, [completedTasks, campaignId]);

  const toggleTask = (phaseIndex: number, taskIndex: number) => {
    const taskId = `${phaseIndex}-${taskIndex}`;
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev => 
      prev.includes(phase) 
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const getPhaseProgress = (phaseIndex: number, taskCount: number): number => {
    let completed = 0;
    for (let i = 0; i < taskCount; i++) {
      if (completedTasks[`${phaseIndex}-${i}`]) completed++;
    }
    return taskCount > 0 ? (completed / taskCount) * 100 : 0;
  };

  const getTotalProgress = (): number => {
    if (!fundraiserType) return 0;
    let total = 0;
    let completed = 0;
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

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-3" />
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

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <div className="space-y-4">
            {fundraiserType.projectManagerSteps.map((phase, phaseIndex) => {
              const isExpanded = expandedPhases.includes(phase.phase);
              const progress = getPhaseProgress(phaseIndex, phase.tasks.length);
              const completedCount = phase.tasks.filter((_, i) => completedTasks[`${phaseIndex}-${i}`]).length;

              return (
                <Card key={phase.phase} className="overflow-hidden">
                  <button
                    onClick={() => togglePhase(phase.phase)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{phase.phase}</h3>
                        <p className="text-sm text-muted-foreground">
                          {completedCount} of {phase.tasks.length} tasks complete
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <Progress value={progress} className="h-2" />
                      </div>
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
                            <div
                              key={taskIndex}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg transition-colors",
                                isComplete ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted/30 hover:bg-muted/50"
                              )}
                            >
                              <Checkbox
                                checked={isComplete}
                                onCheckedChange={() => toggleTask(phaseIndex, taskIndex)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn(
                                    "font-medium",
                                    isComplete ? "line-through text-muted-foreground" : "text-foreground"
                                  )}>
                                    {task.task}
                                  </span>
                                  {dueLabel && (
                                    <span className={cn("text-xs flex items-center gap-1", dueColor)}>
                                      <Clock className="h-3 w-3" />
                                      {dueLabel}
                                    </span>
                                  )}
                                </div>
                                <p className={cn(
                                  "text-sm mt-1",
                                  isComplete ? "text-muted-foreground/60" : "text-muted-foreground"
                                )}>
                                  {task.description}
                                </p>
                              </div>
                              {isComplete && (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
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

        {/* Success Guide Tab */}
        <TabsContent value="guide" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {fundraiserType.label} Success Guide
              </CardTitle>
              <CardDescription>
                Follow these steps to run a successful {fundraiserType.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fundraiserType.successGuide.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br",
                      fundraiserType.color
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary">${fundraiserType.avgRaised}</div>
                <p className="text-xs text-muted-foreground">Avg. Raised/Person</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Badge variant={
                  fundraiserType.difficulty === 'easy' ? 'default' :
                  fundraiserType.difficulty === 'medium' ? 'secondary' : 'destructive'
                } className={
                  fundraiserType.difficulty === 'easy' ? 'bg-emerald-500' :
                  fundraiserType.difficulty === 'medium' ? 'bg-amber-500' : ''
                }>
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
    </div>
  );
}

export default FundraiserProjectManager;
