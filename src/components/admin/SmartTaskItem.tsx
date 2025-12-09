import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Image, Package, Users, Mail, Share2, Megaphone, 
  Bell, Zap, Heart, Gift, CheckCircle, ExternalLink,
  Loader2, Sparkles
} from 'lucide-react';
import { TaskDefinition } from '@/data/taskRegistry';
import { executeTask, markTaskComplete } from '@/services/automationEngine';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SmartTaskItemProps {
  task: TaskDefinition;
  campaignId: string;
  isComplete: boolean;
  isAutopilot: boolean;
  onComplete: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Image,
  Package,
  Users,
  Mail,
  Share2,
  Megaphone,
  Bell,
  Zap,
  Heart,
  Gift,
  CheckCircle,
};

const phaseColors: Record<string, string> = {
  setup: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  launch: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  active: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  closing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
};

export function SmartTaskItem({ 
  task, 
  campaignId, 
  isComplete, 
  isAutopilot,
  onComplete 
}: SmartTaskItemProps) {
  const navigate = useNavigate();
  const [isExecuting, setIsExecuting] = useState(false);
  const [localComplete, setLocalComplete] = useState(isComplete);

  const IconComponent = iconMap[task.icon] || CheckCircle;

  const handlePrimaryAction = async () => {
    if (task.actionType === 'navigate' && task.actionUrl) {
      navigate(task.actionUrl);
      return;
    }

    if (task.actionType === 'auto' || task.actionType === 'confirm') {
      setIsExecuting(true);
      try {
        const result = await executeTask(campaignId, task.id);
        if (result.success) {
          toast.success(result.message);
          await markTaskComplete(campaignId, task.id);
          setLocalComplete(true);
          onComplete();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Failed to execute task');
      } finally {
        setIsExecuting(false);
      }
    }
  };

  const handleSecondaryAction = () => {
    if (task.secondaryUrl) {
      navigate(task.secondaryUrl);
    } else if (task.actionUrl) {
      navigate(task.actionUrl);
    }
  };

  const handleManualComplete = async () => {
    await markTaskComplete(campaignId, task.id);
    setLocalComplete(true);
    onComplete();
    toast.success(`"${task.name}" marked as complete`);
  };

  if (localComplete) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 opacity-60">
        <Checkbox checked disabled className="h-5 w-5" />
        <div className="flex items-center gap-2 flex-1">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
          <span className="line-through text-muted-foreground">{task.name}</span>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border bg-card transition-all hover:shadow-md",
      "border-border"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={localComplete}
          onCheckedChange={handleManualComplete}
          className="mt-1 h-5 w-5"
        />
        
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <IconComponent className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">{task.name}</h4>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={phaseColors[task.phase]}>
                {task.phase.charAt(0).toUpperCase() + task.phase.slice(1)}
              </Badge>
              {task.canAutomate && (
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isAutopilot ? 'Auto' : 'Automatable'}
                </Badge>
              )}
            </div>
          </div>

          {/* Instructions */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {task.instructions}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handlePrimaryAction}
              disabled={isExecuting}
              className="gap-1.5"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {task.actionType === 'navigate' && <ExternalLink className="h-3.5 w-3.5" />}
                  {task.actionLabel || 'Do This'}
                </>
              )}
            </Button>
            
            {task.secondaryLabel && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSecondaryAction}
                className="gap-1.5"
              >
                {task.secondaryLabel}
              </Button>
            )}

            <span className="text-xs text-muted-foreground ml-auto">
              ~{task.estimatedMinutes} min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
