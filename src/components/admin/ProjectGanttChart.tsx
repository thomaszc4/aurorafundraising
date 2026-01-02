
import React from 'react';
import { ProjectTask } from '@/hooks/useProjectManagerTasks';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Flag, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { generateICS, downloadICS } from '@/utils/calendarUtils';
import { toast } from 'sonner';

interface ProjectGanttChartProps {
    tasks: ProjectTask[];
    startDate?: Date;
    endDate?: Date;
    campaignName?: string;
}

export function ProjectGanttChart({ tasks, startDate, endDate, campaignName = 'Campaign' }: ProjectGanttChartProps) {

    const handleExport = () => {
        try {
            const icsContent = generateICS(tasks, campaignName);
            downloadICS(icsContent, `${campaignName.replace(/\s+/g, '_')}_Schedule.ics`);
            toast.success('Calendar exported successfully');
        } catch (err) {
            toast.error('Failed to export calendar');
        }
    };

    // Determine timeline range
    // Find earliest and latest dates
    let minDate = startDate || new Date();
    let maxDate = endDate || new Date();

    // If tasks have dates outside range, expand
    tasks.forEach(t => {
        if (t.due_date) {
            if (t.due_date < minDate) minDate = t.due_date;
            if (t.due_date > maxDate) maxDate = t.due_date;
        }
    });

    // Add buffer
    const startBuffer = new Date(minDate);
    startBuffer.setDate(startBuffer.getDate() - 5);
    const endBuffer = new Date(maxDate);
    endBuffer.setDate(endBuffer.getDate() + 5);

    const totalDays = Math.ceil((endBuffer.getTime() - startBuffer.getTime()) / (1000 * 60 * 60 * 24));
    const dayWidth = 40; // px per day

    // Group by phase
    const phases = Array.from(new Set(tasks.map(t => t.phase)));

    return (
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Flag className="h-4 w-4 text-primary" />
                    Project Timeline
                </h3>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                    <CalendarPlus className="h-4 w-4" />
                    Sync to Calendar
                </Button>
            </div>

            <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex flex-col min-w-full" style={{ width: `${Math.max(1000, totalDays * dayWidth)}px` }}>

                    {/* Header Dates */}
                    <div className="flex border-b h-10 items-center bg-muted/10">
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const d = new Date(startBuffer);
                            d.setDate(d.getDate() + i);
                            const isToday = d.toDateString() === new Date().toDateString();
                            const isWeekStart = d.getDay() === 1; // Monday

                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex-shrink-0 border-r flex items-center justify-center text-[10px] text-muted-foreground select-none relative",
                                        isToday ? "bg-primary/5" : ""
                                    )}
                                    style={{ width: `${dayWidth}px`, height: '100%' }}
                                >
                                    {isWeekStart || isToday ? (
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium">{format(d, 'dd')}</span>
                                            <span className="opacity-50 text-[9px]">{format(d, 'MMM')}</span>
                                        </div>
                                    ) : null}
                                    {isToday && <div className="absolute inset-y-0 w-0.5 bg-primary/20 left-1/2" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Rows */}
                    <div className="py-2 space-y-4">
                        {phases.map(phase => {
                            const phaseTasks = tasks.filter(t => t.phase === phase);
                            if (phaseTasks.length === 0) return null;

                            return (
                                <div key={phase} className="relative">
                                    <div className="sticky left-0 z-10 px-4 py-1 bg-background/95 backdrop-blur border-y text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {phase} Phase
                                    </div>
                                    <div className="space-y-1 py-2">
                                        {phaseTasks.map(task => {
                                            if (!task.due_date) return null;
                                            const daysFromStart = Math.ceil((task.due_date.getTime() - startBuffer.getTime()) / (1000 * 60 * 60 * 24));
                                            const left = daysFromStart * dayWidth;

                                            return (
                                                <div key={task.id} className="relative h-8 hover:bg-muted/10 transition-colors flex items-center">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={cn(
                                                                        "absolute h-6 rounded-full flex items-center px-2 gap-2 border shadow-sm cursor-pointer transition-all hover:scale-105 hover:z-20",
                                                                        task.is_completed
                                                                            ? "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-800 dark:text-green-300"
                                                                            : "bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                                                                    )}
                                                                    style={{ left: `${left}px`, minWidth: '150px' }}
                                                                >
                                                                    {task.is_completed ? (
                                                                        <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                                                                    ) : (
                                                                        <Circle className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                                                    )}
                                                                    <span className="text-xs font-medium truncate">{task.task}</span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="font-semibold">{task.task}</div>
                                                                <div className="text-xs text-muted-foreground">{format(task.due_date, 'PPP')}</div>
                                                                <div className="text-xs mt-1 max-w-xs">{task.description}</div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {/* Guideline */}
                                                    <div
                                                        className="absolute h-px bg-slate-100 dark:bg-slate-800 w-full top-1/2 -z-10"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
