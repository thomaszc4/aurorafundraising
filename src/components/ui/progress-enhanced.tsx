import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressEnhancedProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  showMilestones?: boolean;
  milestones?: number[];
  variant?: 'default' | 'gradient' | 'striped';
}

const ProgressEnhanced = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressEnhancedProps
>(({ className, value = 0, showMilestones = false, milestones = [25, 50, 75, 100], variant = 'default', ...props }, ref) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full",
          // Enhanced empty state - more visible track
          "bg-muted/80 border border-border/50",
          // Subtle pattern for empty state
          clampedValue < 5 && "bg-[linear-gradient(45deg,transparent_25%,hsl(var(--muted))_25%,hsl(var(--muted))_50%,transparent_50%,transparent_75%,hsl(var(--muted))_75%)] bg-[length:8px_8px]",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            // Default variant
            variant === 'default' && "bg-primary-blue",
            // Gradient variant
            variant === 'gradient' && "bg-gradient-to-r from-primary-blue via-secondary to-accent",
            // Striped variant
            variant === 'striped' && "bg-primary bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%)] bg-[length:1rem_1rem] animate-[progress-stripes_1s_linear_infinite]",
            // Glow effect when making progress
            clampedValue > 0 && clampedValue < 100 && "shadow-[0_0_10px_hsl(var(--primary)/0.3)]",
            // Success state
            clampedValue >= 100 && "bg-green-500 shadow-[0_0_15px_hsl(142_76%_36%/0.4)]"
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </ProgressPrimitive.Root>
      
      {/* Milestone Markers */}
      {showMilestones && (
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {milestones.map((milestone) => (
            <div
              key={milestone}
              className="absolute h-full flex items-center"
              style={{ left: `${milestone}%` }}
            >
              <div 
                className={cn(
                  "w-0.5 h-3 -translate-x-1/2 rounded-full transition-colors",
                  clampedValue >= milestone 
                    ? "bg-primary-foreground/50" 
                    : "bg-muted-foreground/30"
                )}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Milestone Labels (optional) */}
      {showMilestones && (
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">0%</span>
          {milestones.slice(0, -1).map((milestone) => (
            <span 
              key={milestone} 
              className={cn(
                "text-[10px]",
                clampedValue >= milestone ? "text-primary" : "text-muted-foreground"
              )}
            >
              {milestone}%
            </span>
          ))}
          <span className={cn(
            "text-[10px]",
            clampedValue >= 100 ? "text-green-500 font-medium" : "text-muted-foreground"
          )}>
            100%
          </span>
        </div>
      )}
    </div>
  );
});

ProgressEnhanced.displayName = "ProgressEnhanced";

export { ProgressEnhanced };