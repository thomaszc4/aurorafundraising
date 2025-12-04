import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Schedule a Consultation",
    description: "Connect with our team to discuss your fundraising goals, timeline, and organization type.",
  },
  {
    number: "02",
    title: "Set Up Your Campaign",
    description: "We'll configure your dashboard with products, student pages, and donor tracking tools.",
  },
  {
    number: "03",
    title: "Launch & Track Progress",
    description: "Students share their pages, you monitor sales in real-time, and donors receive automated thank-yous.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section-padding bg-muted/50">
      <div className="container-wide">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="text-sm font-semibold text-primary-blue uppercase tracking-wider mb-4 block">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              Three Simple Steps to{" "}
              <span className="text-gradient-teal">Success</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Our platform streamlines every aspect of fundraising—from product sales 
              to donor engagement—so you can focus on what matters most.
            </p>

            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.number} className="flex gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary-blue/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-blue">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="default" size="lg" className="mt-10" asChild>
              <Link to="/fundraising">
                See Full Process
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-hero overflow-hidden relative">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-secondary/30 animate-float" />
                  <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-primary-blue/40 animate-float animation-delay-200" />
                  <div className="absolute -bottom-4 -left-12 w-24 h-24 rounded-full bg-accent/30 animate-float animation-delay-300" />
                </div>
              </div>
              
              {/* Platform Preview Cards */}
              <div className="absolute top-8 left-8 p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10">
                <p className="text-primary-foreground text-sm font-medium">Campaign Dashboard</p>
                <p className="text-primary-foreground/60 text-xs">Real-time analytics</p>
              </div>
              
              <div className="absolute top-8 right-8 p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10">
                <p className="text-primary-foreground text-sm font-medium">$12,450</p>
                <p className="text-primary-foreground/60 text-xs">Total raised</p>
              </div>
              
              <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10">
                <p className="text-primary-foreground text-lg font-medium text-center">
                  "Setup was incredibly easy. Our campaign was live within a day!"
                </p>
                <p className="text-primary-foreground/60 text-sm text-center mt-2">
                  — Lincoln Elementary PTA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
