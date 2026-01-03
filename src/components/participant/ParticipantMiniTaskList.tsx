import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    PartyPopper, Share2, Trophy, TrendingUp, Crown,
    CheckCircle2, Sparkles, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { PARTICIPANT_TASKS, getParticipantTaskStatus, ParticipantTask } from '@/data/participantTasks';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
    PartyPopper,
    Share2,
    Trophy,
    TrendingUp,
    Crown,
};

interface ParticipantMiniTaskListProps {
    participant: any;
    goalAmount: number;
    onUpdate?: () => void;
}

export function ParticipantMiniTaskList({
    participant,
    goalAmount,
    onUpdate
}: ParticipantMiniTaskListProps) {
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const tasks = getParticipantTaskStatus(
        participant,
        participant.task_states,
        goalAmount
    );

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const progress = (completedCount / tasks.length) * 100;

    const toggleManualTask = async (taskId: string, currentStatus: boolean) => {
        setUpdatingId(taskId);
        try {
            const currentStates = (participant.task_states as Record<string, boolean>) || {};
            const newStates = {
                ...currentStates,
                [taskId]: !currentStatus
            };

            const { error } = await supabase
                .from('participants')
                .update({
                    task_states: newStates as any
                } as any)
                .eq('id', participant.id);

            if (error) throw error;

            if (!currentStatus) {
                toast.success("Task completed! Great job!", {
                    icon: <Sparkles className="h-4 w-4 text-yellow-500" />
                });
            }

            if (onUpdate) onUpdate();
        } catch (err: any) {
            console.error('Error updating task:', err);
            toast.error(`Failed to update task: ${err.message || 'Unknown error'}`);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Your Daily Tasks
                    </CardTitle>
                    <Badge variant="secondary" className="font-bold">
                        {completedCount}/{tasks.length} Done
                    </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                        className="bg-primary h-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {tasks.map((task) => {
                    const IconComponent = iconMap[task.icon] || CheckCircle2;
                    const isCompleted = task.status === 'completed';
                    const isManual = task.type === 'manual';
                    const isUpdating = updatingId === task.id;

                    return (
                        <div
                            key={task.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                isCompleted
                                    ? "bg-primary/5 border-primary/20 opacity-80"
                                    : "bg-background border-border hover:border-primary/30"
                            )}
                        >
                            <div className="mt-0.5">
                                {isManual ? (
                                    <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={() => toggleManualTask(task.id, isCompleted)}
                                        disabled={isUpdating}
                                        className="h-5 w-5"
                                    />
                                ) : (
                                    <div className={cn(
                                        "h-5 w-5 rounded-full flex items-center justify-center border",
                                        isCompleted ? "bg-primary border-primary" : "bg-muted border-muted-foreground/20"
                                    )}>
                                        {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <IconComponent className={cn(
                                        "h-4 w-4",
                                        isCompleted ? "text-primary" : "text-muted-foreground"
                                    )} />
                                    <span className={cn(
                                        "text-sm font-semibold",
                                        isCompleted && "text-muted-foreground line-through"
                                    )}>
                                        {task.name}
                                    </span>
                                    {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                </div>
                                <p className="text-xs text-muted-foreground leading-tight">
                                    {task.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
