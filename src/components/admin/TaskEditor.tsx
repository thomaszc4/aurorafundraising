import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { CalendarIcon, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomTask {
  id?: string;
  phase: string;
  task: string;
  description: string;
  daysBeforeEvent?: number;
  dueDate?: Date;
  category?: string;
  isCustom: boolean;
}

interface TaskEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: CustomTask;
  phases: string[];
  campaignEndDate?: Date;
  onSave: (task: CustomTask) => void;
  onDelete?: () => void;
}

export function TaskEditor({
  open,
  onOpenChange,
  task,
  phases,
  campaignEndDate,
  onSave,
  onDelete
}: TaskEditorProps) {
  const [phase, setPhase] = useState(task?.phase || phases[0] || '');
  const [taskName, setTaskName] = useState(task?.task || '');
  const [description, setDescription] = useState(task?.description || '');
  const [category, setCategory] = useState(task?.category || 'General');
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate);
  const [daysBeforeEvent, setDaysBeforeEvent] = useState<string>(
    task?.daysBeforeEvent?.toString() || ''
  );

  const categories = ['Communication', 'Planning', 'Logistics', 'Financial', 'General'];

  const handleDateSelect = (date: Date | undefined) => {
    setDueDate(date);
    if (date && campaignEndDate) {
      const diff = differenceInDays(campaignEndDate, date);
      setDaysBeforeEvent(diff.toString());
    }
  };

  const handleSave = () => {
    if (!taskName || !phase) return;

    onSave({
      id: task?.id,
      phase,
      task: taskName,
      description,
      category,
      daysBeforeEvent: daysBeforeEvent ? parseInt(daysBeforeEvent) : undefined,
      dueDate: dueDate,
      isCustom: true
    });

    // Reset form
    setTaskName('');
    setDescription('');
    setCategory('General');
    setDaysBeforeEvent('');
    setDueDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task?.id ? (
              <><Pencil className="h-5 w-5" /> Edit Task</>
            ) : (
              <><Plus className="h-5 w-5" /> Add Custom Task</>
            )}
          </DialogTitle>
          <DialogDescription>
            {task?.id
              ? 'Modify the task details below'
              : 'Create a new custom task for your project plan'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phase">Phase *</Label>
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Label</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskName">Task Name *</Label>
            <Input
              id="taskName"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="e.g., Order custom t-shirts"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daysBeforeEvent">Days Before Event (optional)</Label>
            <Input
              id="daysBeforeEvent"
              type="number"
              value={daysBeforeEvent}
              onChange={e => setDaysBeforeEvent(e.target.value)}
              placeholder="e.g., 14"
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Usually calculated automatically if a due date is selected.
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {task?.id && onDelete && (
            <Button variant="destructive" onClick={onDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!taskName || !phase}>
              {task?.id ? 'Save Changes' : 'Add Task'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
