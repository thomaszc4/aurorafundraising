import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Clock, CheckCircle2, Plus,
  ExternalLink, CalendarRange, ListTodo, X, GripVertical,
  Activity, Target, Calendar as CalendarIcon, ArrowRight,
  ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFundraiserTypeById, FundraiserType } from '@/data/fundraiserTypes';
import { useProjectManagerTasks, ProjectTask } from '@/hooks/useProjectManagerTasks';
import { TaskEditor, CustomTask } from './TaskEditor';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, format, isSameDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { motion, AnimatePresence } from 'framer-motion';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FundraiserProjectManagerProps {
  campaignId: string;
  fundraiserTypeId: string;
  startDate?: Date;
  endDate?: Date;
  onClose?: () => void;
  onNavigate?: (view: string) => void;
}

function TaskItem({
  task,
  onToggle,
  onDelete,
  onNavigate,
  isOverlay,
  isDragging
}: {
  task: ProjectTask;
  onToggle?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
  onNavigate?: (url: string) => void;
  isOverlay?: boolean;
  isDragging?: boolean;
}) {
  const isOverdue = task.due_date && task.due_date < new Date() && !task.is_completed;

  return (
    <motion.div
      layout
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
        isOverlay ? "bg-background/95 backdrop-blur shadow-2xl border-primary scale-105" : "bg-card/50 hover:bg-card border-border/50 hover:border-primary/30",
        isDragging ? "opacity-30" : "",
        task.is_completed && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground/30 group-hover:text-primary transition-colors cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-4 w-4" />
        </div>
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={() => onToggle && onToggle(task.id, task.is_completed)}
          className="w-5 h-5 rounded-md border-primary/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-transparent"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h4 className={cn(
              "font-semibold text-sm tracking-tight transition-all truncate",
              task.is_completed && "line-through text-muted-foreground font-normal"
            )}>
              {task.task}
            </h4>
            {task.description && !task.is_completed && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {task.due_date && !task.is_completed && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide",
                isOverdue ? "text-rose-500" : "text-muted-foreground/70"
              )}>
                <Clock className="h-3 w-3" />
                {format(task.due_date, 'MMM d')}
              </div>
            )}

            {!isOverlay && (
              <div className="flex items-center gap-1">
                {task.action_url && !task.is_completed && onNavigate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(task.action_url!.replace('/admin?view=', ''))}
                    className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 rounded-lg"
                  >
                    {task.action_label || 'Go'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                {task.is_custom && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => onDelete(task.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SortableTaskItem({ task, onToggle, onDelete, onNavigate }: {
  task: ProjectTask;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onNavigate?: (url: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskItem task={task} onToggle={onToggle} onDelete={onDelete} onNavigate={onNavigate} isDragging={isDragging} />
    </div>
  );
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.4' } }
  })
};

export function FundraiserProjectManager({
  campaignId,
  fundraiserTypeId,
  startDate,
  endDate,
  onClose,
  onNavigate
}: FundraiserProjectManagerProps) {
  const [fundraiserType, setFundraiserType] = useState<FundraiserType | null>(null);
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [editingTask, setEditingTask] = useState<CustomTask | undefined>();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'checklist' | 'calendar'>('checklist');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { tasks, loading, toggleTask, deleteTask, saveTask, reorderTasks } = useProjectManagerTasks(campaignId, fundraiserTypeId, startDate, endDate);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const type = getFundraiserTypeById(fundraiserTypeId);
    if (type) setFundraiserType(type);
  }, [fundraiserTypeId]);

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEndGlobal = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    if (!activeTask) return;

    let newPhase = overTask ? overTask.phase : activeTask.phase;

    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTasksArr = arrayMove(tasks, oldIndex, newIndex);
      const updates = newTasksArr.map((task, index) => ({
        id: task.id,
        display_order: index,
        phase: task.id === active.id ? newPhase : undefined
      }));
      await reorderTasks(updates);
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const handleSaveTask = async (task: CustomTask) => {
    await saveTask({
      id: task.id,
      task: task.task,
      description: task.description,
      phase: task.phase,
      category: task.category,
      days_before_event: task.daysBeforeEvent,
    });
    setShowTaskEditor(false);
  };

  const handleDeleteTask = async (id?: string) => {
    if (id) await deleteTask(id);
    setShowTaskEditor(false);
  };

  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(t => t.due_date && isSameDay(t.due_date, selectedDate));
  }, [selectedDate, tasks]);

  if (!fundraiserType || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading workspace</p>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalProgress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const uniquePhases = Array.from(new Set(tasks.map(t => t.phase)));
  const sortedPhases = uniquePhases.sort((a, b) => {
    const idxA = fundraiserType.projectManagerSteps.findIndex(p => p.phase === a);
    const idxB = fundraiserType.projectManagerSteps.findIndex(p => p.phase === b);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  const getPhaseDates = (phaseName: string) => {
    const pts = tasks.filter(t => t.phase === phaseName && t.due_date);
    if (pts.length === 0) return null;
    const sorted = pts.map(p => p.due_date!).sort((a, b) => a.getTime() - b.getTime());
    return sorted.length === 1 ? format(sorted[0], 'MMM d') : `${format(sorted[0], 'MMM d')} - ${format(sorted[sorted.length - 1], 'MMM d')}`;
  };

  const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : null;

  return (
    <div className="space-y-6">
      {/* Streamlined Header */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg",
            fundraiserType.color
          )}>
            <fundraiserType.icon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">{fundraiserType.label} Plan</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Project Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted/50 p-1 rounded-lg border backdrop-blur-sm">
            {(['checklist', 'calendar'] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView(v)}
                className={cn(
                  "h-8 px-3 rounded-md text-[10px] font-black uppercase tracking-wider gap-2 transition-all",
                  view === v ? "shadow-sm bg-background text-foreground" : "text-muted-foreground/60"
                )}
              >
                {v === 'checklist' ? <ListTodo className="h-3.5 w-3.5" /> : <CalendarRange className="h-3.5 w-3.5" />}
                {v}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => { setEditingTask(undefined); setShowTaskEditor(true); }}
            className="h-10 px-4 rounded-xl font-bold gap-2 shadow-lg shadow-primary/10"
          >
            <Plus className="h-4 w-4 stroke-[3px]" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Unified Summary Bar - Using global glass-card */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Project Health</span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black leading-none">{Math.round(totalProgress)}%</span>
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${totalProgress}%` }} />
              </div>
            </div>
          </div>
          <div className="h-10 w-px bg-border/20 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Tasks Met</span>
            <span className="text-2xl font-black leading-none">{completedCount} <span className="text-muted-foreground/40 font-bold text-lg">/ {tasks.length}</span></span>
          </div>
          <div className="h-10 w-px bg-border/20 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Timeline</span>
            <span className="text-2xl font-black leading-none text-primary">
              {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining}d` : "Ended") : '--'}
            </span>
          </div>
        </div>

        <Badge variant="outline" className="h-9 px-5 rounded-full border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest hidden lg:flex">
          <Activity className="h-3.5 w-3.5 mr-2" />
          {totalProgress > 50 ? 'Gaining Momentum' : 'Setup Phase'}
        </Badge>
      </div>

      {/* Main Content Areas */}
      <AnimatePresence mode="wait">
        {view === 'checklist' ? (
          <motion.div
            key="checklist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEndGlobal}
            >
              <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {sortedPhases.map((phase, pIdx) => {
                  const phaseTasks = tasks.filter(t => t.phase === phase);
                  if (phaseTasks.length === 0) return null;

                  const isCompleted = phaseTasks.every(t => t.is_completed);
                  const phaseDates = getPhaseDates(phase);
                  const cleanName = phase.replace(/\s*\(Week.*\)/i, '').trim();

                  return (
                    <div key={phase} className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all",
                            isCompleted ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4 stroke-[3px]" /> : pIdx + 1}
                          </div>
                          <div>
                            <h3 className="text-base font-black tracking-tight">{cleanName}</h3>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground/50 tabular-nums">
                          {phaseTasks.filter(t => t.is_completed).length} / {phaseTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {phaseTasks.map((task) => (
                          <SortableTaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={handleDeleteTask} onNavigate={onNavigate} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </SortableContext>
              <DragOverlay dropAnimation={dropAnimation}>
                {activeId && activeTask ? <TaskItem task={activeTask} isOverlay /> : null}
              </DragOverlay>
            </DndContext>

            {tasks.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed rounded-3xl border-muted">
                <Target className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No tasks scheduled</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Larger Calendar Container */}
            <div className="md:col-span-2 glass-card rounded-2xl overflow-hidden">
              <div className="p-8 pb-10">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date)}
                  className="rounded-2xl border-none w-full"
                  classNames={{
                    months: "w-full",
                    month: "w-full space-y-6",
                    caption: "flex justify-center pt-2 relative items-center mb-4",
                    caption_label: "text-base font-black tracking-tight",
                    nav: "space-x-2 flex items-center",
                    nav_button: cn(
                      buttonVariants({ variant: "outline" }),
                      "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-xl"
                    ),
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full justify-between",
                    head_cell: "text-muted-foreground rounded-md w-10 sm:w-14 md:w-16 lg:w-20 font-black text-[10px] uppercase tracking-widest text-center",
                    row: "flex w-full mt-2 justify-between",
                    cell: "h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 p-0 font-normal aria-selected:opacity-100 rounded-2xl"
                    ),
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-muted text-foreground font-black",
                  }}
                  components={{
                    DayContent: (props) => {
                      const dtStr = format(props.date, 'yyyy-MM-dd');
                      const dayTasks = tasks.filter(t => t.due_date && format(t.due_date, 'yyyy-MM-dd') === dtStr);
                      return (
                        <div className="relative w-full h-full flex flex-col items-center justify-center group/day">
                          <span className="text-sm border-b-2 border-transparent group-hover/day:border-primary/30 transition-all font-black">
                            {props.date.getDate()}
                          </span>
                          {dayTasks.length > 0 && (
                            <div className="absolute top-2 right-2">
                              <div className={cn(
                                "h-2 w-2 rounded-full shadow-sm",
                                dayTasks.every(t => t.is_completed) ? "bg-emerald-500" : "bg-primary animate-pulse"
                              )} />
                            </div>
                          )}
                          {dayTasks.length > 0 && (
                            <div className="hidden sm:flex absolute bottom-2 left-0 right-0 justify-center">
                              <div className="flex -space-x-1">
                                {dayTasks.slice(0, 3).map((_, i) => (
                                  <div key={i} className="h-1 w-3 rounded-full bg-primary/20" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  }}
                />
              </div>
            </div>

            {/* Interactive Task Sidebar */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Due on Date</h4>
                    <p className="text-lg font-black tracking-tight">{selectedDate ? format(selectedDate, 'MMMM d') : 'Select a date'}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedDateTasks.length > 0 ? (
                    selectedDateTasks.map(t => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={t.id}
                        className="p-4 rounded-xl bg-background border border-border/50 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={t.is_completed}
                              onCheckedChange={() => toggleTask(t.id, t.is_completed)}
                              className="w-4 h-4 rounded border-primary/30"
                            />
                            <span className={cn("text-sm font-bold leading-tight", t.is_completed && "line-through text-muted-foreground")}>{t.task}</span>
                          </div>
                        </div>
                        {t.description && (
                          <p className="text-[10px] text-muted-foreground leading-relaxed pl-7">
                            {t.description}
                          </p>
                        )}
                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-wider w-fit ml-7 mt-1 opacity-60">
                          {t.phase.replace(/\s*\(Week.*\)/i, '').trim()}
                        </Badge>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Info className="h-5 w-5" />
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest">No tasks due</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Status */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Upcoming Milestone</p>
                <div className="flex items-center justify-between">
                  {tasks.filter(t => !t.is_completed && t.due_date && t.due_date > new Date()).sort((a, b) => a.due_date!.getTime() - b.due_date!.getTime())[0] ? (
                    <>
                      <span className="text-xs font-bold truncate">
                        {tasks.filter(t => !t.is_completed && t.due_date && t.due_date > new Date()).sort((a, b) => a.due_date!.getTime() - b.due_date!.getTime())[0].task}
                      </span>
                      <span className="text-xs font-black tabular-nums">
                        {format(tasks.filter(t => !t.is_completed && t.due_date && t.due_date > new Date()).sort((a, b) => a.due_date!.getTime() - b.due_date!.getTime())[0].due_date!, 'MMM d')}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">All tasks completed! 🎉</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TaskEditor
        open={showTaskEditor}
        onOpenChange={setShowTaskEditor}
        task={editingTask}
        phases={sortedPhases}
        campaignEndDate={endDate}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}

export default FundraiserProjectManager;
