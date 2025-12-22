import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Laptop, Share2, BarChart3, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: "setup",
    icon: Laptop,
    title: "1. We Build Your Store",
    description: "Forget complex forms. Just tell us your goal and organization name. We generate a professional, mobile-friendly fundraising store for you in minutes.",
    features: ["No coding required", "Custom branding", "Pre-loaded products"],
    image: "/images/process_dashboard.png" // Placeholder
  },
  {
    id: "share",
    icon: Share2,
    title: "2. Students Share Links",
    description: "No door-to-door sales. Students get a unique link to share via text, email, and social media. Supporters buy online and ship directly to their homes.",
    features: ["One-click sharing", "Automated email invite", "Social media ready"],
    image: "/images/process_share.png" // Placeholder
  },
  {
    id: "track",
    icon: BarChart3,
    title: "3. Watch Revenue Grow",
    description: "Track sales, student participation, and total profit in real-time from your admin dashboard. No spreadsheets, no manual counting.",
    features: ["Real-time leaderboard", "Automated payouts", "Exportable reports"],
    image: "/images/process_stats.png" // Placeholder
  }
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const ActiveIcon = steps[activeStep].icon;

  return (
    <section className="section-padding bg-muted/30 relative overflow-hidden" id="how-it-works">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-blue/10 via-background to-background" />

      <div className="container-wide relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary-blue uppercase tracking-wider mb-4 block">
            The Process
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Fundraising Has Never Been <span className="text-gradient-teal">This Easy</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We've replaced the chaos of traditional fundraising with a streamlined, digital-first approach.
            See how it works in 3 simple steps.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column: Steps Navigation */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={cn(
                  "relative p-6 rounded-2xl cursor-pointer transition-all duration-300 border",
                  activeStep === index
                    ? "bg-white dark:bg-card border-primary-blue shadow-lg scale-[1.02]"
                    : "bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-white/5 opacity-70 hover:opacity-100"
                )}
              >
                <div className="flex gap-6">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                    activeStep === index ? "bg-primary-blue text-white" : "bg-secondary/10 text-muted-foreground"
                  )}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-xl font-bold mb-2 transition-colors",
                      activeStep === index ? "text-primary-blue" : "text-foreground"
                    )}>
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {step.description}
                    </p>

                    {/* Features list only visible when active */}
                    <div className={cn(
                      "grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-hidden transition-all duration-300",
                      activeStep === index ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"
                    )}>
                      {step.features.map(feature => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-foreground/80">
                          <CheckCircle2 className="w-4 h-4 text-secondary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-8 pl-4">
              <Button variant="default" size="lg" className="shadow-lg shadow-primary-blue/20" asChild>
                <Link to="/fundraising">
                  Starting Is Free - Sign Up Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Visual Preview */}
          <div className="relative">
            {/* Device Frame */}
            <div className="relative aspect-[4/3] rounded-2xl bg-foreground/5 border border-white/10 backdrop-blur-sm shadow-2xl p-2 animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-blue/20 to-secondary/20 rounded-2xl blur-3xl -z-10" />

              <div className="h-full w-full bg-background rounded-xl overflow-hidden relative group">
                {/* Placeholder for Screenshot */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
                  {/* Here we would put the real image */}
                  {/* <img src={steps[activeStep].image} alt={steps[activeStep].title} className="w-full h-full object-cover" /> */}

                  {/* Visual Placeholder UI since we don't have screenshots yet */}
                  <div className="w-3/4 h-3/4 border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center p-8 text-center bg-background/50">
                    <ActiveIcon className="w-16 h-16 mb-4 text-primary-blue opacity-50" />
                    <p className="font-semibold text-lg mb-2">Visual: {steps[activeStep].title}</p>
                    <p className="text-sm opacity-70">Screenshot or video demonstration of how easy this step is.</p>
                    <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
                      <PlayCircle className="w-4 h-4" />
                      Watch Video Demo
                    </div>
                  </div>
                </div>

                {/* Overlay Transition */}
                <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none" />
              </div>
            </div>

            {/* Testimonial Bubble */}
            <div className="absolute -bottom-8 -right-8 max-w-xs bg-white dark:bg-card p-4 rounded-xl shadow-xl border border-border/50 animate-float animation-delay-200 hidden md:block">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">A+</div>
                <div className="text-xs text-muted-foreground">Verified User</div>
              </div>
              <p className="text-sm font-medium italic text-foreground">
                "I was dreading the setup, but it literally took me 5 minutes."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
