import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShoppingBag, Users, LineChart, Mail } from "lucide-react";
export function HeroSection() {
  return <section className="relative min-h-screen flex items-center bg-hero overflow-hidden">
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
          

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-slide-up">
            <span className="text-gradient-teal">10x</span> Your Fundraising{" "}
            <span className="block">With Unique Products</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-100">​​​​​​​​​Schools using Aurora raise 10x more ​than other fundraisers<span className="text-secondary font-semibold">10x more</span> ​  
          </p>

          {/* Feature Pills */}
          

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
              <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">10x</div>
              <div className="text-sm text-primary-foreground/60">More Than Traditional</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">$150+</div>
              <div className="text-sm text-primary-foreground/60">Avg Per Student</div>
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
    </section>;
}