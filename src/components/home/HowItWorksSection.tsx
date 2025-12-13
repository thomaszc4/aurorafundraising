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
    <section className="section-padding bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-blue/10 via-background to-background" />

      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
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
              {steps.map((step, index) => (
                <div key={step.number} className="flex gap-6 group">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white shadow-sm border border-border/50 flex items-center justify-center group-hover:bg-primary-blue group-hover:text-white transition-all duration-300">
                    <span className="text-2xl font-bold text-primary-blue group-hover:text-white transition-colors">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary-blue transition-colors">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="default" size="lg" className="mt-10 shadow-lg shadow-primary-blue/20" asChild>
              <Link to="/fundraising">
                See Full Process
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Visual */}
          <div className="relative order-1 lg:order-2">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-white/50 to-white/10 border border-white/20 backdrop-blur-md shadow-2xl overflow-hidden relative p-8">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />

              {/* Animated blobs */}
              <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-blue/20 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-float animation-delay-200" />

              {/* Floating Cards */}
              <div className="relative h-full w-full">
                <div className="absolute top-10 left-0 right-10 p-4 rounded-xl glass bg-white/40 border-white/40 shadow-lg animate-float">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">Campaign Dashboard</p>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary-blue rounded-full" />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Goal: $10,000</span>
                    <span className="text-primary-blue font-medium">75%</span>
                  </div>
                </div>

                <div className="absolute top-[40%] right-0 left-10 p-4 rounded-xl glass bg-white/40 border-white/40 shadow-lg animate-float animation-delay-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-secondary text-xs font-bold">$</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">New Donation</p>
                      <p className="text-xs text-muted-foreground">Just now</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-foreground">$150.00</p>
                </div>

                <div className="absolute bottom-10 left-4 right-4 p-4 rounded-xl glass bg-white/60 border-white/50 shadow-lg animate-float animation-delay-100">
                  <p className="text-sm font-medium italic text-foreground/80 text-center">
                    "Setup was incredibly easy. Our campaign was live within a day!"
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    — Lincoln Elementary PTA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
