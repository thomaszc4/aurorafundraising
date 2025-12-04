import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, Mail, Phone, FileText, Clock, 
  Play, Pause, Plus, Trash2, ArrowRight, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface JourneyStep {
  id: string;
  trigger: 'donation' | 'time_elapsed' | 'milestone';
  action: 'email' | 'task' | 'tag';
  template_id?: string;
  delay_days: number;
  condition_value?: string;
  is_active: boolean;
}

interface DonorJourney {
  id: string;
  name: string;
  description: string;
  segment: string;
  is_active: boolean;
  steps: JourneyStep[];
}

interface EmailTemplate {
  id: string;
  name: string;
  template_type: string;
}

interface DonorJourneyManagerProps {
  campaignId: string;
  onClose?: () => void;
}

// Default journeys that can be activated
const DEFAULT_JOURNEYS: Omit<DonorJourney, 'id'>[] = [
  {
    name: 'First-Time Donor Welcome',
    description: 'Automated welcome series for new donors',
    segment: 'first_time',
    is_active: false,
    steps: [
      { id: '1', trigger: 'donation', action: 'email', delay_days: 0, is_active: true },
      { id: '2', trigger: 'time_elapsed', action: 'email', delay_days: 7, is_active: true },
      { id: '3', trigger: 'time_elapsed', action: 'email', delay_days: 30, is_active: true },
    ]
  },
  {
    name: 'Major Donor Stewardship',
    description: 'High-touch engagement for major gift donors',
    segment: 'major',
    is_active: false,
    steps: [
      { id: '1', trigger: 'donation', action: 'email', delay_days: 0, is_active: true },
      { id: '2', trigger: 'donation', action: 'task', delay_days: 1, condition_value: 'thank_you_call', is_active: true },
      { id: '3', trigger: 'time_elapsed', action: 'task', delay_days: 7, condition_value: 'handwritten_note', is_active: true },
    ]
  },
  {
    name: 'Lapsed Donor Re-engagement',
    description: 'Win back donors who haven\'t given recently',
    segment: 'lapsed',
    is_active: false,
    steps: [
      { id: '1', trigger: 'time_elapsed', action: 'email', delay_days: 90, is_active: true },
      { id: '2', trigger: 'time_elapsed', action: 'email', delay_days: 120, is_active: true },
      { id: '3', trigger: 'time_elapsed', action: 'email', delay_days: 180, is_active: true },
    ]
  },
  {
    name: 'Monthly Donor Nurture',
    description: 'Keep recurring donors engaged and appreciated',
    segment: 'recurring',
    is_active: false,
    steps: [
      { id: '1', trigger: 'donation', action: 'email', delay_days: 0, is_active: true },
      { id: '2', trigger: 'time_elapsed', action: 'email', delay_days: 30, is_active: true },
      { id: '3', trigger: 'milestone', action: 'email', delay_days: 0, condition_value: '6_months', is_active: true },
      { id: '4', trigger: 'milestone', action: 'email', delay_days: 0, condition_value: '1_year', is_active: true },
    ]
  }
];

export function DonorJourneyManager({ campaignId, onClose }: DonorJourneyManagerProps) {
  const [journeys, setJourneys] = useState<DonorJourney[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState<DonorJourney | null>(null);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch templates
    const { data: templatesData } = await supabase
      .from('email_templates')
      .select('id, name, template_type')
      .or(`campaign_id.eq.${campaignId},is_system.eq.true`);
    
    if (templatesData) setTemplates(templatesData);

    // For now, use default journeys (in production, these would be stored in DB)
    const journeysWithIds = DEFAULT_JOURNEYS.map((j, idx) => ({
      ...j,
      id: `journey-${idx}`
    }));
    setJourneys(journeysWithIds);
    
    setLoading(false);
  };

  const toggleJourney = (journeyId: string) => {
    setJourneys(prev => prev.map(j => 
      j.id === journeyId ? { ...j, is_active: !j.is_active } : j
    ));
    
    const journey = journeys.find(j => j.id === journeyId);
    if (journey) {
      toast.success(`${journey.name} ${!journey.is_active ? 'activated' : 'paused'}`);
    }
  };

  const runJourneyForDonors = async (journey: DonorJourney) => {
    try {
      // Get donors in this segment - use text comparison since segment is stored as enum
      const { data: donors } = await supabase
        .from('donors')
        .select('*')
        .eq('campaign_id', campaignId)
        .filter('segment', 'eq', journey.segment as any);

      if (!donors || donors.length === 0) {
        toast.error(`No donors in "${journey.segment}" segment`);
        return;
      }

      // Create tasks for each donor based on journey steps
      let tasksCreated = 0;
      for (const donor of donors) {
        for (const step of journey.steps) {
          if (step.action === 'task') {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + step.delay_days);

            await supabase.from('donor_tasks').insert({
              donor_id: donor.id,
              campaign_id: campaignId,
              task_type: step.condition_value || 'follow_up',
              due_date: dueDate.toISOString(),
              notes: `Auto-generated from "${journey.name}" journey`
            });
            tasksCreated++;
          }
        }
      }

      toast.success(`Created ${tasksCreated} tasks for ${donors.length} donors`);
    } catch (error) {
      console.error('Error running journey:', error);
      toast.error('Failed to run journey');
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'donation': return 'After donation';
      case 'time_elapsed': return 'Days since last activity';
      case 'milestone': return 'When milestone reached';
      default: return trigger;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'task': return <FileText className="h-4 w-4" />;
      case 'tag': return <Zap className="h-4 w-4" />;
      default: return null;
    }
  };

  const segmentColors: Record<string, string> = {
    first_time: 'bg-blue-100 text-blue-800',
    recurring: 'bg-green-100 text-green-800',
    lapsed: 'bg-amber-100 text-amber-800',
    major: 'bg-purple-100 text-purple-800',
    business: 'bg-indigo-100 text-indigo-800'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading journeys...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">Donor Journey Automation</h2>
            <p className="text-muted-foreground">Automated workflows based on donor actions and milestones</p>
          </div>
        </div>
      </div>

      {/* Journey Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {journeys.map(journey => (
          <Card key={journey.id} className={cn(
            "transition-all",
            journey.is_active && "border-primary/50 bg-primary/5"
          )}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {journey.name}
                    {journey.is_active && <Badge className="bg-green-500">Active</Badge>}
                  </CardTitle>
                  <CardDescription className="mt-1">{journey.description}</CardDescription>
                </div>
                <Switch 
                  checked={journey.is_active} 
                  onCheckedChange={() => toggleJourney(journey.id)} 
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Target:</span>
                  <Badge className={cn('capitalize', segmentColors[journey.segment])}>
                    {journey.segment.replace('_', ' ')} donors
                  </Badge>
                </div>

                {/* Journey Steps Visualization */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Journey Steps:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {journey.steps.map((step, idx) => (
                      <div key={step.id} className="flex items-center">
                        <div className={cn(
                          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium",
                          step.action === 'email' && "bg-blue-100 text-blue-800",
                          step.action === 'task' && "bg-amber-100 text-amber-800",
                          step.action === 'tag' && "bg-purple-100 text-purple-800"
                        )}>
                          {getActionIcon(step.action)}
                          {step.delay_days > 0 ? `+${step.delay_days}d` : 'Immediate'}
                        </div>
                        {idx < journey.steps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedJourney(journey)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1"
                    onClick={() => runJourneyForDonors(journey)}
                    disabled={!journey.is_active}
                  >
                    <Play className="h-3 w-3" />
                    Run Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Journey Details Dialog */}
      <Dialog open={!!selectedJourney} onOpenChange={() => setSelectedJourney(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJourney?.name}</DialogTitle>
          </DialogHeader>
          {selectedJourney && (
            <div className="space-y-4">
              <p className="text-muted-foreground">{selectedJourney.description}</p>
              
              <div className="space-y-3">
                <h4 className="font-medium">Journey Steps</h4>
                {selectedJourney.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getActionIcon(step.action)}
                        <span className="font-medium capitalize">{step.action}</span>
                        {step.condition_value && (
                          <Badge variant="outline">{step.condition_value.replace('_', ' ')}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {getTriggerLabel(step.trigger)}
                        {step.delay_days > 0 && ` • ${step.delay_days} days delay`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedJourney(null)}>
                  Close
                </Button>
                <Button 
                  className="flex-1 gap-2" 
                  onClick={() => {
                    runJourneyForDonors(selectedJourney);
                    setSelectedJourney(null);
                  }}
                >
                  <Play className="h-4 w-4" />
                  Run Journey
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Donor Journeys Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Trigger</h4>
              <p className="text-sm text-muted-foreground">Journeys start when a donor takes an action or reaches a milestone</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Timing</h4>
              <p className="text-sm text-muted-foreground">Each step can have a delay to space out communications</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Action</h4>
              <p className="text-sm text-muted-foreground">Send emails, create tasks, or update donor records automatically</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DonorJourneyManager;
