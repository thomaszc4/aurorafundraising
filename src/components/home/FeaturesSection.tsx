import { Zap, Shield, Heart, TrendingUp, Package, Users } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Simple Setup",
    description: "Get started in minutes. We handle the logistics so you can focus on selling.",
  },
  {
    icon: TrendingUp,
    title: "High Profit Margins",
    description: "Earn up to 50% profit on every sale with our competitively priced products.",
  },
  {
    icon: Package,
    title: "Quality Products",
    description: "Products people actually want—practical, durable, and community-focused.",
  },
  {
    icon: Shield,
    title: "Trusted Support",
    description: "Dedicated support team to help you every step of the way.",
  },
  {
    icon: Heart,
    title: "Community Impact",
    description: "Every product sold benefits families with essential preparedness tools.",
  },
  {
    icon: Users,
    title: "Team Friendly",
    description: "Easy for volunteers of all ages to participate and contribute.",
  },
];

export function FeaturesSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary-blue uppercase tracking-wider mb-4 block">
            Why Aurora
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Fundraising That{" "}
            <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We've reimagined fundraising to be simpler, more profitable, and genuinely beneficial 
            for everyone involved.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-3xl bg-card hover:bg-card-elevated border border-border/50 hover:border-primary-blue/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 flex items-center justify-center mb-6 group-hover:bg-primary-blue/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary-blue" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
