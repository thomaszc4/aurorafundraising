import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, CalendarIcon, CheckCircle2, Circle, Trash2, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StudentTask {
  id: string;
  task_name: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface StudentTaskManagerProps {
  studentFundraiserId: string | null;
  studentName?: string;
}

const TASK_TEMPLATES = [
  { name: 'Share fundraiser link', description: 'Share your personal fundraiser page on social media' },
  { name: 'Make first sale', description: 'Complete your first order' },
  { name: 'Reach $50', description: 'Raise at least $50 in total' },
  { name: 'Contact 10 people', description: 'Reach out to 10 potential supporters' },
  { name: 'Send thank you notes', description: 'Thank all your supporters' },
];

export function StudentTaskManager({ studentFundraiserId, studentName }: StudentTaskManagerProps) {
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    task_name: '',
    description: '',
    due_date: undefined as Date | undefined,
  });

  useEffect(() => {
    if (studentFundraiserId) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [studentFundraiserId]);

  const fetchTasks = async () => {
    if (!studentFundraiserId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_tasks')
        .select('*')
        .eq('student_fundraiser_id', studentFundraiserId)
        .order('is_completed', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFundraiserId || !newTask.task_name) return;

    try {
      // Get campaign_id from the student_fundraiser
      const { data: fundraiser } = await supabase
        .from('student_fundraisers')
        .select('campaign_id')
        .eq('id', studentFundraiserId)
        .single();

      if (!fundraiser) throw new Error('Fundraiser not found');

      const { error } = await supabase
        .from('student_tasks')
        .insert({
          student_fundraiser_id: studentFundraiserId,
          campaign_id: fundraiser.campaign_id,
          task_name: newTask.task_name,
          description: newTask.description || null,
          due_date: newTask.due_date ? newTask.due_date.toISOString() : null,
        });

      if (error) throw error;
      
      toast.success('Task added');
      setNewTask({ task_name: '', description: '', due_date: undefined });
      setIsDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const handleToggleTask = async (task: StudentTask) => {
    try {
      const { error } = await supabase
        .from('student_tasks')
        .update({
          is_completed: !task.is_completed,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('student_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleAddFromTemplate = async (template: typeof TASK_TEMPLATES[0]) => {
    if (!studentFundraiserId) return;

    try {
      const { data: fundraiser } = await supabase
        .from('student_fundraisers')
        .select('campaign_id')
        .eq('id', studentFundraiserId)
        .single();

      if (!fundraiser) throw new Error('Fundraiser not found');

      const { error } = await supabase
        .from('student_tasks')
        .insert({
          student_fundraiser_id: studentFundraiserId,
          campaign_id: fundraiser.campaign_id,
          task_name: template.name,
          description: template.description,
        });

      if (error) throw error;
      
      toast.success('Task added from template');
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const completedCount = tasks.filter(t => t.is_completed).length;

  if (!studentFundraiserId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Student Tasks
          </CardTitle>
          <CardDescription>
            Select a student to manage their tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click on a student in the table to view and manage their tasks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Tasks
            </CardTitle>
            {studentName && (
              <CardDescription>{studentName}</CardDescription>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Name</Label>
                  <Input
                    value={newTask.task_name}
                    onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                    placeholder="Enter task name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newTask.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTask.due_date ? format(newTask.due_date, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTask.due_date}
                        onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button type="submit" className="w-full">Add Task</Button>
              </form>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Quick Add from Templates</p>
                <div className="flex flex-wrap gap-2">
                  {TASK_TEMPLATES.map((template) => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddFromTemplate(template)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              {completedCount}/{tasks.length} completed
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No tasks assigned yet</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setIsDialogOpen(true)}
              className="mt-1"
            >
              Add the first task
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    task.is_completed ? "bg-muted/50 opacity-60" : "bg-background"
                  )}
                >
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={() => handleToggleTask(task)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      task.is_completed && "line-through text-muted-foreground"
                    )}>
                      {task.task_name}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
