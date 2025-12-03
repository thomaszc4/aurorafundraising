import { Trophy, Star, Target, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressMilestonesProps {
  currentAmount: number;
  goalAmount: number;
}

const milestones = [
  { percentage: 25, label: '25%', icon: Star, color: 'text-yellow-500' },
  { percentage: 50, label: '50%', icon: Target, color: 'text-blue-500' },
  { percentage: 75, label: '75%', icon: Award, color: 'text-purple-500' },
  { percentage: 100, label: '100%', icon: Trophy, color: 'text-amber-500' },
];

export const ProgressMilestones = ({ currentAmount, goalAmount }: ProgressMilestonesProps) => {
  const progressPercentage = goalAmount > 0 ? (currentAmount / goalAmount) * 100 : 0;

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Milestones</h3>
      <div className="relative">
        {/* Progress bar background */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-blue to-secondary transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        
        {/* Milestone markers */}
        <div className="flex justify-between mt-4">
          {milestones.map((milestone) => {
            const isReached = progressPercentage >= milestone.percentage;
            const Icon = milestone.icon;
            
            return (
              <div 
                key={milestone.percentage}
                className="flex flex-col items-center"
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isReached 
                      ? `bg-primary/10 ${milestone.color}` 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isReached && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-xs font-medium mt-1",
                  isReached ? "text-foreground" : "text-muted-foreground"
                )}>
                  {milestone.label}
                </span>
                {isReached && (
                  <span className="text-[10px] text-muted-foreground">
                    Reached!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
