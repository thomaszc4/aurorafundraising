import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Schedule a Consultation",
    description: "Connect with our team to discuss your fundraising goals and timeline.",
  },
  {
    number: "02",
    title: "Receive Your Materials",
    description: "We'll send you everything you need—product samples, order forms, and marketing materials.",
  },
  {
    number: "03",
    title: "Sell & Succeed",
    description: "Your team sells products, we handle fulfillment, and you keep the profits.",
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
              We've streamlined the fundraising process so you can focus on what matters most—
              your organization and your community.
            </p>

            <div className="space-y-8">
              {steps.map((step, index) => (
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
              <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10">
                <p className="text-primary-foreground text-lg font-medium text-center">
                  "The easiest fundraiser we've ever run."
                </p>
                <p className="text-primary-foreground/60 text-sm text-center mt-2">
                  — Local School PTA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
