import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressEnhancedProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  showMilestones?: boolean;
  milestones?: number[];
  variant?: 'default' | 'gradient' | 'striped';
  indicatorClassName?: string;
}

const ProgressEnhanced = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressEnhancedProps
>(({ className, value = 0, showMilestones = false, milestones = [25, 50, 75, 100], variant = 'default', indicatorClassName, ...props }, ref) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-6 w-full overflow-hidden rounded-full",
          // Glassmorphism track
          "bg-black/20 border border-white/5 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full transition-all duration-1000 ease-out rounded-full relative",
            // Base gradient (overridable)
            "bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600",
            // Internal shimmer/gloss effect
            "after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.3)_0%,transparent_50%,rgba(0,0,0,0.1)_100%)]",
            // Striped variant overlay
            variant === 'striped' && "before:absolute before:inset-0 before:bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%)] before:bg-[length:1rem_1rem] before:animate-[progress-stripes_1s_linear_infinite]",
            // Glow effect
            clampedValue > 0 && "shadow-[0_0_20px_rgba(56,189,248,0.5)] drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]",
            indicatorClassName
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </ProgressPrimitive.Root>

      {/* Milestone Markers */}
      {showMilestones && (
        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
          {milestones.map((milestone) => (
            <div
              key={milestone}
              className="absolute h-full flex flex-col items-center group"
              style={{ left: `${milestone}%` }}
            >
              {/* Marker Line */}
              <div
                className={cn(
                  "w-0.5 h-full z-10 transition-colors duration-500",
                  clampedValue >= milestone
                    ? "bg-white/30"
                    : "bg-white/10"
                )}
              />
            </div>
          ))}
        </div>
      )}

      {/* Milestone Labels */}
      {showMilestones && (
        <div className="flex justify-between mt-2 px-1">
          <span className="text-[11px] font-medium text-muted-foreground/70">Start</span>
          {milestones.map((milestone) => (
            milestone !== 100 && (
              <span
                key={milestone}
                className={cn(
                  "text-[11px] font-medium transition-colors duration-500",
                  clampedValue >= milestone ? "text-primary-blue drop-shadow-sm" : "text-muted-foreground/50"
                )}
              >
                {milestone}%
              </span>
            )
          ))}
          <span className={cn(
            "text-[11px] font-medium transition-colors duration-500",
            clampedValue >= 100 ? "text-purple-400 drop-shadow-sm" : "text-muted-foreground/70"
          )}>
            Goal
          </span>
        </div>
      )}
    </div>
  );
});

ProgressEnhanced.displayName = "ProgressEnhanced";

export { ProgressEnhanced };