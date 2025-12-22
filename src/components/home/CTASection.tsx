import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "Up to 50% profit margins",
  "Individual student fundraiser pages",
  "Real-time leaderboards & tracking",
  "Automated donor thank-you emails",
  "Email campaigns with merge tags",
  "COPPA compliant platform",
];

export function CTASection() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-hero">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-blue/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-pulse animation-delay-500" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container-tight relative z-10">
        <div className="glass-card p-12 rounded-3xl text-center border border-white/10 shadow-glow">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Ready to Transform Your{" "}
            <span className="text-gradient-teal">Risk-Free?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join hundreds of organizations maximizing their revenue with Aurora.
            <span className="text-foreground font-semibold block mt-2">No upfront costs. You keep 50% of everything you sell.</span>
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 max-w-3xl mx-auto mb-12 text-left">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-foreground/80">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                </div>
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild className="w-full sm:w-auto shadow-lg shadow-primary-blue/25 hover:shadow-primary-blue/40">
              <Link to="/contact">
                Start Your Free Campaign
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="w-full sm:w-auto border-foreground/20 hover:bg-foreground/5">
              <Link to="/faq">Read Our Guarantee</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
