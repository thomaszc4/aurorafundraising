import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShoppingBag, Users, LineChart, Mail } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-hero overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-blue/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float animation-delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container-wide relative z-10 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary-foreground/90">
              Complete Fundraising Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-slide-up">
            Product-Based Fundraising{" "}
            <span className="text-gradient-teal">Made Simple</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-100">
            The all-in-one platform for schools and organizations. Launch campaigns, 
            track student progress, manage donors, send personalized communications, 
            and keep up to 50% profit on every sale.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10 animate-slide-up animation-delay-150">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10">
              <ShoppingBag className="w-4 h-4 text-secondary" />
              <span className="text-sm text-primary-foreground/80">Product Sales</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10">
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-sm text-primary-foreground/80">Student Tracking</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10">
              <LineChart className="w-4 h-4 text-secondary" />
              <span className="text-sm text-primary-foreground/80">Real-Time Analytics</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10">
              <Mail className="w-4 h-4 text-secondary" />
              <span className="text-sm text-primary-foreground/80">Donor Engagement</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">
                Start Your Campaign
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/fundraising">See How It Works</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-primary-foreground/10 animate-fade-in animation-delay-300">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">500+</div>
              <div className="text-sm text-primary-foreground/60">Organizations Served</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">$2M+</div>
              <div className="text-sm text-primary-foreground/60">Funds Raised</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">50%</div>
              <div className="text-sm text-primary-foreground/60">Profit Margins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
