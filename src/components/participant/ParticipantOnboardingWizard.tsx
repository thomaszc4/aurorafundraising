import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    Share2,
    Trophy,
    Rocket,
    ChevronRight,
    ChevronLeft,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    title: string;
    description: string;
    icon: React.ElementType;
    content: React.ReactNode;
}

interface ParticipantOnboardingWizardProps {
    isOpen: boolean;
    onComplete: () => void;
    participantName: string;
}

export function ParticipantOnboardingWizard({
    isOpen,
    onComplete,
    participantName
}: ParticipantOnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps: Step[] = [
        {
            title: "Welcome to our Fundraiser!",
            description: `Hi ${participantName}! We're so glad you're here.`,
            icon: Rocket,
            content: (
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <p className="text-sm leading-relaxed">
                            We're on a mission to hit our goal, and we can't do it without you!
                            This quick guide will show you how to get started and earn awesome rewards.
                        </p>
                    </div>
                </div>
            )
        },
        {
            title: "Your Strategy for Success",
            description: "Raising money is easier than you think!",
            icon: Share2,
            content: (
                <div className="space-y-4 py-4">
                    <ul className="space-y-3">
                        {[
                            "Share your link: Send it to family and friends via text or email.",
                            "Supporters Shop: They can buy amazing products or donate directly.",
                            "You Earn: Every sale gets you closer to cool prizes and milestones!"
                        ].map((text, i) => (
                            <li key={i} className="flex gap-3 text-sm items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )
        },
        {
            title: "Your Personal Roadmap",
            description: "Use your Task List to stay on track.",
            icon: Trophy,
            content: (
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                        <p className="text-sm">
                            Check out your <strong>Task List</strong>! It’s your roadmap to hitting your goal. We’ll celebrate with you as you reach each milestone!
                        </p>
                    </div>
                    <div className="flex justify-around items-center pt-2">
                        <div className="text-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                                <Share2 className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Share</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                        <div className="text-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                                <Trophy className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Earn</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                        <div className="text-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-1">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">Win</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "You're All Set!",
            description: "Ready to make an impact?",
            icon: Sparkles,
            content: (
                <div className="space-y-4 py-4">
                    <p className="text-sm text-center italic text-muted-foreground px-4">
                        "Small actions lead to big results."
                    </p>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200 dark:bg-green-900/20 dark:border-green-800 text-center">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                            Copy your personal link at the top of your dashboard and send it to 5 people right now to get started!
                        </p>
                    </div>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const StepIcon = steps[currentStep].icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onComplete()}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <StepIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">{steps[currentStep].title}</DialogTitle>
                            <DialogDescription className="text-xs">{steps[currentStep].description}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-[180px]">
                    {steps[currentStep].content}
                </div>

                {/* Progress indicator */}
                <div className="flex gap-1 justify-center mb-4">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 rounded-full transition-all duration-300",
                                i === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
                            )}
                        />
                    ))}
                </div>

                <DialogFooter className="flex sm:justify-between gap-2 overflow-hidden">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={cn(currentStep === 0 && "opacity-0")}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button onClick={handleNext} className="min-w-[100px]">
                        {currentStep === steps.length - 1 ? "Let's Go!" : "Next"}
                        {currentStep !== steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
