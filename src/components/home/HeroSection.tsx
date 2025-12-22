import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShoppingBag, Users, LineChart, Mail } from "lucide-react";
export function HeroSection() {
  return <section className="relative min-h-screen flex items-center overflow-hidden">
    {/* Background Image */}
    <div className="absolute inset-0 z-0">
      <img src="/images/aurora_hero.png" alt="Aurora Scene" className="w-full h-full object-cover opacity-40 dark:opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
    </div>

    {/* Background Elements */}
    <div className="absolute inset-0 overflow-hidden z-0">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-blue/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float animation-delay-200" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-3xl" />
    </div>

    {/* Grid Pattern Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] z-0" />

    <div className="container-wide relative z-10 pt-32 pb-20">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary-foreground/10 text-primary-foreground/80 mb-8 animate-fade-in backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium"> The Future of School Fundraising</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-slide-up drop-shadow-lg">
          <span className="text-gradient-teal">Maximize</span> Your <span className="block">Fundraising Revenue</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-100 font-medium drop-shadow-md">
          Our goal is simple: Help you make more money. Schools using Aurora raise <span className="text-secondary font-bold">10x more</span> than traditional fundraisers with high-margin, high-quality products.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
          <Button variant="hero" size="lg" asChild className="h-14 px-8 text-lg shadow-glow hover:shadow-glow-teal transition-all duration-300">
            <Link to="/contact">
              Start Making Money
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button variant="heroOutline" size="lg" asChild className="h-14 px-8 text-lg backdrop-blur-md bg-background/20 hover:bg-background/40">
            <Link to="/fundraising">See How It Works</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-primary-foreground/10 animate-fade-in animation-delay-300 backdrop-blur-sm rounded-3xl bg-background/5">
          <div className="p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300">
            <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">10x</div>
            <div className="text-sm text-primary-foreground/80 font-medium">Revenue vs Traditional</div>
          </div>
          <div className="p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300">
            <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">$150+</div>
            <div className="text-sm text-primary-foreground/80 font-medium">Avg Per Student</div>
          </div>
          <div className="p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300">
            <div className="text-3xl sm:text-4xl font-bold text-secondary mb-2">50%</div>
            <div className="text-sm text-primary-foreground/80 font-medium">Profit Margins</div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Gradient */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
  </section>;
}