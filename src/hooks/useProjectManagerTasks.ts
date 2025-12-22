
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getFundraiserTypeById } from '@/data/fundraiserTypes';
import { toast } from 'sonner';

export interface ProjectTask {
    id: string;
    campaign_id: string;
    phase: string;
    task: string;
    description: string | null;
    detailed_instructions: string | null;
    days_before_event: number | null;
    is_completed: boolean;
    is_custom: boolean;
    display_order: number;
    action_url: string | null;
    action_label: string | null;
    due_date?: Date;
}

export function useProjectManagerTasks(
    campaignId: string,
    fundraiserTypeId: string,
    startDate?: Date,
    endDate?: Date
) {
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (campaignId && fundraiserTypeId) {
            loadBrief();
        }
    }, [campaignId, fundraiserTypeId, startDate, endDate]);

    const loadBrief = async () => {
        try {
            setLoading(true);

            const { data: existingTasks, error } = await supabase
                .from('campaign_tasks')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('display_order');

            if (error) throw error;

            const hasStandardTasks = existingTasks?.some(t => !t.is_custom);

            if (!hasStandardTasks && existingTasks) {
                await hydrateFromTemplate(existingTasks.length);
                const { data: refreshedData } = await supabase
                    .from('campaign_tasks')
                    .select('*')
                    .eq('campaign_id', campaignId)
                    .order('display_order');

                processTasks(refreshedData || []);
                return;
            }

            processTasks(existingTasks || []);
        } catch (err) {
            console.error('Error loading project tasks:', err);
            toast.error('Failed to load project tasks');
        } finally {
            setLoading(false);
        }
    };

    const processTasks = (data: any[]) => {
        let anchorDate = endDate;
        if (!anchorDate && startDate) {
            anchorDate = new Date(startDate);
            anchorDate.setDate(anchorDate.getDate() + 30);
        }

        const processedTasks = data.map(t => {
            let dueDate: Date | undefined = undefined;

            if (anchorDate && t.days_before_event !== null) {
                dueDate = new Date(anchorDate);
                dueDate.setDate(dueDate.getDate() - t.days_before_event);
            } else if (startDate && !anchorDate) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + (t.days_before_event || 0));
                dueDate = d;
            }

            return {
                ...t,
                due_date: dueDate
            };
        });
        setTasks(processedTasks);
    };

    const hydrateFromTemplate = async (currentCount: number) => {
        const type = getFundraiserTypeById(fundraiserTypeId);
        if (!type) return;

        const newTasks = [];
        let order = currentCount;

        for (const phase of type.projectManagerSteps) {
            for (const t of phase.tasks) {
                let actionUrl = null;
                if (t.actionView) {
                    actionUrl = `/admin?view=${t.actionView}`;
                }

                newTasks.push({
                    campaign_id: campaignId,
                    phase: phase.phase,
                    task: t.task,
                    description: t.description,
                    detailed_instructions: t.description,
                    days_before_event: t.daysBeforeEvent,
                    is_completed: false,
                    is_custom: false,
                    display_order: order++,
                    action_url: actionUrl,
                });
            }
        }

        if (newTasks.length > 0) {
            await supabase.from('campaign_tasks').insert(newTasks);
        }
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, is_completed: !currentStatus } : t
        ));

        const { error } = await supabase
            .from('campaign_tasks')
            .update({
                is_completed: !currentStatus,
                completed_at: !currentStatus ? new Date().toISOString() : null
            })
            .eq('id', taskId);

        if (error) {
            toast.error('Failed to update task');
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, is_completed: currentStatus } : t
            ));
        }
    };

    const saveTask = async (task: Partial<ProjectTask>) => {
        setLoading(true);
        try {
            if (task.id) {
                await supabase
                    .from('campaign_tasks')
                    .update({
                        phase: task.phase,
                        task: task.task,
                        description: task.description,
                        days_before_event: task.days_before_event
                    })
                    .eq('id', task.id);
                toast.success('Task updated');
            } else {
                const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.display_order)) : 0;
                await supabase.from('campaign_tasks').insert({
                    campaign_id: campaignId,
                    phase: task.phase,
                    task: task.task!,
                    description: task.description,
                    days_before_event: task.days_before_event,
                    is_custom: true,
                    display_order: maxOrder + 1,
                    is_completed: false
                });
                toast.success('Task added');
            }
            await loadBrief();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!taskId) return;
        setLoading(true);
        try {
            await supabase.from('campaign_tasks').delete().eq('id', taskId);
            toast.success('Task deleted');
            await loadBrief();
        } catch (error) {
            toast.error('Failed to delete task');
        } finally {
            setLoading(false);
        }
    };

    return {
        tasks,
        loading,
        refresh: loadBrief,
        toggleTask,
        saveTask,
        deleteTask
    };
}
