import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  ListTodo, Calendar as CalendarIcon, Users, CheckCircle2, 
  Plus, Trash2, Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StudentFundraiser {
  id: string;
  student_id: string;
  total_raised: number;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface BulkTaskAssignmentProps {
  campaignId: string;
}

const TASK_TEMPLATES = [
  { name: 'Share fundraiser link', description: 'Share your personal fundraising page with friends and family' },
  { name: 'Make first sale', description: 'Complete your first sale to get started' },
  { name: 'Reach $50 goal', description: 'Reach $50 in total sales' },
  { name: 'Send thank you messages', description: 'Thank your supporters with a personal message' },
  { name: 'Post on social media', description: 'Share your fundraiser on social media' },
  { name: 'Contact 5 potential supporters', description: 'Reach out to at least 5 people who might support you' },
];

export function BulkTaskAssignment({ campaignId }: BulkTaskAssignmentProps) {
  const [students, setStudents] = useState<StudentFundraiser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [campaignId]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_fundraisers')
      .select(`
        id,
        student_id,
        total_raised,
        profiles:student_id (
          full_name,
          email
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('is_active', true);

    if (!error && data) {
      setStudents(data as any);
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleTemplateSelect = (template: typeof TASK_TEMPLATES[0]) => {
    setTaskName(template.name);
    setTaskDescription(template.description);
  };

  const handleAssignTasks = async () => {
    if (!taskName.trim()) {
      toast.error('Please enter a task name');
      return;
    }
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    setSubmitting(true);
    try {
      const tasks = selectedStudents.map(studentFundraiserId => ({
        student_fundraiser_id: studentFundraiserId,
        campaign_id: campaignId,
        task_name: taskName,
        description: taskDescription || null,
        due_date: dueDate?.toISOString() || null,
        is_completed: false,
      }));

      const { error } = await supabase
        .from('student_tasks')
        .insert(tasks);

      if (error) throw error;

      toast.success(`Assigned "${taskName}" to ${selectedStudents.length} participants`);
      setIsDialogOpen(false);
      setTaskName('');
      setTaskDescription('');
      setDueDate(undefined);
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error assigning tasks:', error);
      toast.error('Failed to assign tasks');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading participants...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Task Assignment</h2>
          <p className="text-muted-foreground">Assign tasks to multiple participants at once</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={selectedStudents.length === 0} className="gap-2">
              <Plus className="h-4 w-4" />
              Assign Task ({selectedStudents.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign Task to {selectedStudents.length} Participants</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Quick Templates */}
              <div>
                <Label className="text-sm font-medium">Quick Templates</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TASK_TEMPLATES.slice(0, 4).map(template => (
                    <Badge 
                      key={template.name}
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {template.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskName">Task Name *</Label>
                <Input
                  id="taskName"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Enter task name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taskDescription">Description</Label>
                <Textarea
                  id="taskDescription"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={handleAssignTasks}
                  disabled={submitting || !taskName.trim()}
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Assigning...' : 'Assign Task'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selection Summary */}
      {selectedStudents.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedStudents.length} participant{selectedStudents.length !== 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudents([])}>
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Participants List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Select Participants</CardTitle>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active participants in this campaign
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map(student => (
                <div
                  key={student.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedStudents.includes(student.id) 
                      ? "bg-primary/10 border-primary/30" 
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => handleSelectStudent(student.id)}
                >
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => handleSelectStudent(student.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {student.profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.profiles?.email}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    ${Number(student.total_raised || 0).toFixed(0)} raised
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suggested Task Templates</CardTitle>
          <CardDescription>Click to use as a starting point</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {TASK_TEMPLATES.map(template => (
              <div
                key={template.name}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  handleTemplateSelect(template);
                  setIsDialogOpen(true);
                }}
              >
                <div className="flex items-start gap-2">
                  <ListTodo className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
