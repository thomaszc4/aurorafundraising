import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Target,
  Users,
  DollarSign,
  ClipboardList,
  Share2,
  CheckCircle2,
  ArrowRight,
  X,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Target,
    title: 'Welcome to Aurora',
    description: 'Aurora helps you run fundraisers that raise 10x more than traditional methods. Our unique products that people actually want make all the difference.',
    highlight: 'Most school fundraisers raise $20-50 per student. Aurora averages $200+ per student.',
  },
  {
    icon: ClipboardList,
    title: 'Project Manager',
    description: 'Your step-by-step guide to a successful fundraiser. Every task is laid out with the resources you need to complete it. Smart links take you directly to where you need to go.',
    highlight: 'Never wonder "what\'s next?" - we guide you through every step with one-click actions.',
  },
  {
    icon: Calendar,
    title: 'Visual Timeline',
    description: 'See your entire campaign at a glance with the Gantt Chart. Sync your timeline to your personal calendar so you never miss a deadline.',
    highlight: 'Export to Google Calendar, Outlook, or Apple Calendar in one click.',
  },
  {
    icon: Users,
    title: 'Student Management',
    description: 'Add students via spreadsheet or manually. Each student gets their own fundraising page to share with family and friends.',
    highlight: 'Parents can support multiple children with the same email address.',
  },
  {
    icon: DollarSign,
    title: 'Donor CRM',
    description: 'Track every donation, send thank-you messages, and build lasting relationships with your supporters.',
    highlight: 'Repeat donors give 3x more over time than one-time donors.',
  },
  {
    icon: Share2,
    title: 'Easy Sharing',
    description: 'Students share their unique QR codes and links. Door-to-door mode makes in-person sales simple and trackable.',
    highlight: 'QR codes let supporters buy instantly from their phones.',
  },
  {
    icon: CheckCircle2,
    title: 'You\'re Ready!',
    description: 'Start by creating your fundraiser. We\'ll guide you through setting up your organization, choosing products, and inviting students.',
    highlight: 'Most fundraisers are up and running in under 10 minutes.',
  },
];

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={handleSkip}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">{step.title}</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{step.description}</p>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium text-primary">{step.highlight}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 pt-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Tutorial
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
